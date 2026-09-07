import os
import cv2
import numpy as np
import time
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from PIL import Image
import uuid

from app.database.models import ImageProcessingJob
from app.core.config import get_settings

settings = get_settings()
RESULTS_DIR = os.path.join(settings.UPLOAD_DIR, "processing_results")
os.makedirs(RESULTS_DIR, exist_ok=True)

class ImageProcessingService:
    @staticmethod
    def _save_file(image_arr, filename):
        path = os.path.join(RESULTS_DIR, filename)
        if len(image_arr.shape) == 2:
            cv2.imwrite(path, image_arr)
        else:
            cv2.imwrite(path, cv2.cvtColor(image_arr, cv2.COLOR_RGB2BGR))
        return f"/api/uploads/processing_results/{filename}"

    @staticmethod
    def process_job(db: Session, job_id: str, file_path: str):
        job = db.query(ImageProcessingJob).filter(ImageProcessingJob.id == job_id).first()
        if not job:
            return

        start_time = time.time()
        job.status = "processing"
        job.stage = "loading and validation"
        job.progress = 10
        db.commit()

        try:
            # 1. Validation and Loading
            if not os.path.exists(file_path):
                raise ValueError("File not found")
            
            # Load with cv2
            img = cv2.imread(file_path, cv2.IMREAD_UNCHANGED)
            if img is None:
                raise ValueError("Failed to load or corrupt image")
            
            orig_h, orig_w = img.shape[:2]
            
            if len(img.shape) == 3 and img.shape[2] == 3:
                img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            elif len(img.shape) == 3 and img.shape[2] == 4:
                img_gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
            else:
                img_gray = img

            job.stage = "noise reduction"
            job.progress = 20
            db.commit()

            # 2. Speckle/Noise Reduction
            denoised = cv2.medianBlur(img_gray, 5)

            job.stage = "contrast enhancement"
            job.progress = 30
            db.commit()

            # 3. Contrast enhancement (CLAHE)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(denoised)

            job.stage = "pixel normalization"
            job.progress = 40
            db.commit()

            # 4. Pixel normalization
            if np.isnan(enhanced).any() or np.isinf(enhanced).any():
                raise ValueError("Image contains NaN or Infinity values")
            
            # Using robust min-max on percentiles
            p1, p99 = np.percentile(enhanced, (1, 99))
            normalized = np.clip(enhanced, p1, p99)
            normalized = cv2.normalize(normalized, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)

            job.stage = "resolution standardization"
            job.progress = 50
            db.commit()

            # 5. Resolution Standardization
            target_size = 1024
            scale = target_size / max(orig_h, orig_w)
            new_w, new_h = int(orig_w * scale), int(orig_h * scale)
            resized = cv2.resize(normalized, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
            
            # Pad
            padded = np.zeros((target_size, target_size), dtype=np.uint8)
            x_offset = (target_size - new_w) // 2
            y_offset = (target_size - new_h) // 2
            padded[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized

            job.stage = "quality assessment"
            job.progress = 60
            db.commit()

            # 6. Quality Assessment
            brightness = float(np.mean(padded))
            contrast = float(np.std(padded))
            sat_pixels = float(np.sum(padded >= 250) / padded.size * 100)
            missing_pixels = float(np.sum(padded <= 5) / padded.size * 100)
            
            overall_score = max(0, min(100, 100 - (sat_pixels * 2) - (missing_pixels * 1.5) + (contrast / 5)))
            category = "excellent" if overall_score > 80 else "good" if overall_score > 60 else "moderate" if overall_score > 40 else "poor"

            qa = {
                "overallScore": round(overall_score, 2),
                "category": category,
                "speckleNoise": "low" if contrast > 40 else "medium",
                "dataDropoutPercentage": round(missing_pixels, 2),
                "imageCoveragePercentage": 100 - round((target_size*target_size - new_w*new_h)/(target_size*target_size)*100, 2),
                "motionDistortion": "unavailable",
                "shadowVisibility": "fair",
                "missingRegionPercentage": round(missing_pixels, 2),
                "contrastScore": round(contrast, 2),
                "signalQuality": round(brightness, 2),
                "warnings": []
            }
            if sat_pixels > 10: qa["warnings"].append("High saturation detected.")

            job.stage = "quality mask generation"
            job.progress = 70
            db.commit()

            # 7. Quality mask generation
            mask = np.full((target_size, target_size), 2, dtype=np.uint8) # Default usable
            mask[padded <= 5] = 4 # missing/shadow candidate
            mask[padded >= 250] = 4 # saturated
            
            # Heuristic shadow
            _, shadow_thresh = cv2.threshold(padded, 40, 255, cv2.THRESH_BINARY_INV)
            mask[(shadow_thresh == 255) & (mask != 4)] = 3 # shadow candidate

            # Inference binary mask
            inf_mask = np.ones((target_size, target_size), dtype=np.uint8)
            inf_mask[mask == 4] = 0

            mask_stats = {
                "usablePercentage": float(np.sum(mask == 2) / mask.size * 100),
                "uncertainPercentage": float(np.sum(mask == 1) / mask.size * 100),
                "ignoredPercentage": float(np.sum(mask == 0) / mask.size * 100),
                "missingPercentage": float(np.sum(mask == 4) / mask.size * 100),
                "shadowPercentage": float(np.sum(mask == 3) / mask.size * 100)
            }

            job.stage = "shadow and object analysis"
            job.progress = 80
            db.commit()

            # 8. Shadow/Object analysis
            # Very heuristic placeholder as requested
            regions = []
            contours, _ = cv2.findContours(shadow_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for i, cnt in enumerate(contours):
                if cv2.contourArea(cnt) > 500:
                    x, y, w, h = cv2.boundingRect(cnt)
                    regions.append({
                        "id": f"candidate-{i}",
                        "label": "likely_shadow",
                        "objectConfidence": 0.2,
                        "shadowConfidence": 0.8,
                        "uncertainty": 0.3,
                        "boundingBox": {"x": float(x), "y": float(y), "width": float(w), "height": float(h)},
                        "features": {
                            "brightnessReturn": float(np.mean(padded[y:y+h, x:x+w])),
                            "shadowContinuity": 0.9,
                            "shapeScore": 0.7,
                            "textureScore": 0.5,
                            "seabedSimilarity": 0.4
                        },
                        "explanation": "Heuristic estimate: Large dark region indicative of acoustic shadow."
                    })

            job.stage = "saving results"
            job.progress = 90
            db.commit()

            # 9. Storage
            base_name = f"job_{job_id}"
            
            # Create color mask for visualization (0=black, 1=yellow, 2=green, 3=blue, 4=red)
            color_mask = np.zeros((target_size, target_size, 3), dtype=np.uint8)
            color_mask[mask == 1] = [0, 255, 255] # yellow
            color_mask[mask == 2] = [0, 255, 0] # green
            color_mask[mask == 3] = [255, 0, 0] # blue
            color_mask[mask == 4] = [0, 0, 255] # red

            job.processed_image_path = ImageProcessingService._save_file(padded, f"{base_name}_processed.png")
            job.quality_mask_path = ImageProcessingService._save_file(color_mask, f"{base_name}_qmask.png")
            job.inference_mask_path = ImageProcessingService._save_file(inf_mask, f"{base_name}_infmask.png")
            
            meta = {
                "originalWidth": int(orig_w),
                "originalHeight": int(orig_h),
                "processedWidth": target_size,
                "processedHeight": target_size,
                "normalizationMethod": "min-max robust",
                "noiseReductionMethod": "median filter",
                "contrastMethod": "CLAHE",
                "resizeMethod": "lanczos4-padded",
                "processingVersion": "1.0.0"
            }

            job.quality_assessment = json.dumps(qa)
            job.mask_statistics = json.dumps(mask_stats)
            job.region_analysis = json.dumps(regions)
            job.metadata_json = json.dumps(meta)
            job.warnings = json.dumps(qa["warnings"])
            
            job.processing_duration_ms = int((time.time() - start_time) * 1000)
            job.status = "completed"
            job.stage = "completed"
            job.progress = 100
            db.commit()

        except Exception as e:
            db.rollback()
            job.status = "failed"
            job.stage = "failed"
            job.warnings = json.dumps([str(e)])
            db.commit()
            print(f"Error processing image {job_id}: {e}")

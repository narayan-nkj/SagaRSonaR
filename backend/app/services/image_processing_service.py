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
            brightness = float(np.mean(resized))
            contrast = float(np.std(resized))
            sat_pixels = float(np.sum(resized >= 250) / resized.size * 100)
            missing_pixels = float(np.sum(resized <= 5) / resized.size * 100)
            
            overall_score = max(0, min(100, 100 - (sat_pixels * 2) - (missing_pixels * 1.5) + (contrast / 5)))
            category = "excellent" if overall_score > 80 else "good" if overall_score > 60 else "moderate" if overall_score > 40 else "poor"

            qa = {
                "overallScore": round(overall_score, 2),
                "category": category,
                "speckleNoise": "low" if contrast > 40 else "medium",
                "dataDropoutPercentage": round(missing_pixels, 2),
                "imageCoveragePercentage": round((new_w * new_h) / (target_size * target_size) * 100, 2),
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
            mask = np.zeros((target_size, target_size), dtype=np.uint8) # Default ignored (padding)
            
            valid_area = mask[y_offset:y_offset+new_h, x_offset:x_offset+new_w]
            valid_area[:] = 2 # Usable
            valid_area[resized <= 5] = 4 # missing/shadow candidate
            valid_area[resized >= 250] = 4 # saturated
            
            # Heuristic shadow
            _, shadow_thresh = cv2.threshold(resized, 40, 255, cv2.THRESH_BINARY_INV)
            valid_area[(shadow_thresh == 255) & (valid_area != 4)] = 3 # shadow candidate

            # Inference binary mask
            inf_mask = np.zeros((target_size, target_size), dtype=np.uint8)
            inf_mask_valid = inf_mask[y_offset:y_offset+new_h, x_offset:x_offset+new_w]
            inf_mask_valid[:] = 1
            inf_mask_valid[valid_area == 4] = 0

            mask_stats = {
                "usablePercentage": float(np.sum(mask == 2) / mask.size * 100),
                "uncertainPercentage": float(np.sum(mask == 1) / mask.size * 100),
                "ignoredPercentage": float(np.sum(mask == 0) / mask.size * 100),
                "missingPercentage": float(np.sum(mask == 4) / mask.size * 100),
                "shadowPercentage": float(np.sum(mask == 3) / mask.size * 100)
            }

            # 8. Storage for Step 1
            base_name = f"job_{job_id}"
            
            # Create color mask for visualization
            color_mask = np.zeros((target_size, target_size, 3), dtype=np.uint8)
            color_mask[mask == 1] = [255, 255, 0] # yellow
            color_mask[mask == 2] = [0, 255, 0] # green
            color_mask[mask == 3] = [0, 0, 255] # blue
            color_mask[mask == 4] = [255, 0, 0] # red

            job.processed_image_path = ImageProcessingService._save_file(padded, f"{base_name}_processed.png")
            job.quality_mask_path = ImageProcessingService._save_file(color_mask, f"{base_name}_qmask.png")
            
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
            job.metadata_json = json.dumps(meta)
            job.warnings = json.dumps(qa["warnings"])
            
            job.processing_duration_ms = int((time.time() - start_time) * 1000)
            job.status = "assessed"
            job.stage = "waiting for analysis"
            job.progress = 100
            db.commit()

        except Exception as e:
            db.rollback()
            job.status = "failed"
            job.stage = "failed"
            job.warnings = json.dumps([str(e)])
            db.commit()
            print(f"Error processing image {job_id}: {e}")

    @staticmethod
    def analyze_job(db: Session, job_id: str):
        job = db.query(ImageProcessingJob).filter(ImageProcessingJob.id == job_id).first()
        if not job:
            return

        start_time = time.time()
        job.status = "processing"
        job.stage = "running anomaly detection"
        job.progress = 50
        db.commit()

        try:
            processed_file_path = os.path.join(settings.UPLOAD_DIR, "processing_results", os.path.basename(job.processed_image_path))
            img = cv2.imread(processed_file_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                raise ValueError("Processed image not found for analysis.")
            
            regions = []
            
            try:
                from app.ml.model import DetectorService
                detector = DetectorService(model_path="models/sonar_detector.onnx")
                
                img_rgb = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
                img_resized = cv2.resize(img_rgb, (640, 640))
                img_tensor = img_resized.transpose(2, 0, 1)
                img_tensor = np.expand_dims(img_tensor, axis=0).astype(np.float32) / 255.0
                
                result = detector.infer(img_tensor)
                detections = result.get("detections", [])
                
                for i, det in enumerate(detections):
                    bbox = det.get("bbox", [0,0,0,0])
                    regions.append({
                        "id": f"anomaly-{i}",
                        "label": det.get("label", "anomaly"),
                        "objectConfidence": float(det.get("confidence", 0)),
                        "shadowConfidence": 0.0,
                        "uncertainty": 1.0 - float(det.get("confidence", 0)),
                        "boundingBox": {"x": float(bbox[0]), "y": float(bbox[1]), "width": float(bbox[2]-bbox[0]), "height": float(bbox[3]-bbox[1])},
                        "features": {},
                        "explanation": f"Detected {det.get('label', 'anomaly')} with {float(det.get('confidence', 0))*100:.1f}% confidence."
                    })
            except Exception as e:
                print(f"ONNX Model failed to load, falling back to heuristics: {e}")
                # Fallback heuristic
                _, shadow_thresh = cv2.threshold(img, 40, 255, cv2.THRESH_BINARY_INV)
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
                                "brightnessReturn": float(np.mean(img[y:y+h, x:x+w])),
                                "shadowContinuity": 0.9,
                                "shapeScore": 0.7,
                                "textureScore": 0.5,
                                "seabedSimilarity": 0.4
                            },
                            "explanation": "Heuristic estimate: Large dark region indicative of acoustic shadow."
                        })
                
            job.region_analysis = json.dumps(regions)
            
            # Inference binary mask could be generated here if needed
            inf_mask = np.zeros(img.shape, dtype=np.uint8)
            for reg in regions:
                bb = reg["boundingBox"]
                x, y, w, h = int(bb["x"]), int(bb["y"]), int(bb["width"]), int(bb["height"])
                # Map 640x640 bbox back to img.shape
                scale_x = img.shape[1] / 640.0
                scale_y = img.shape[0] / 640.0
                cv2.rectangle(inf_mask, (int(x*scale_x), int(y*scale_y)), (int((x+w)*scale_x), int((y+h)*scale_y)), 255, -1)
                
            base_name = f"job_{job_id}"
            job.inference_mask_path = ImageProcessingService._save_file(inf_mask, f"{base_name}_infmask.png")

            # Preserve duration from previous step
            job.processing_duration_ms = (job.processing_duration_ms or 0) + int((time.time() - start_time) * 1000)
            job.status = "completed"
            job.stage = "completed"
            job.progress = 100
            db.commit()

        except Exception as e:
            db.rollback()
            job.status = "failed"
            job.stage = "analysis failed"
            
            warnings = []
            if job.warnings:
                warnings = json.loads(job.warnings)
            warnings.append(f"Analysis Error: {str(e)}")
            job.warnings = json.dumps(warnings)
            
            db.commit()
            print(f"Error in analysis for job {job_id}: {e}")

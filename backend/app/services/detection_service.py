import time
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.database.models import Detection
from app.database.repositories import SonarImageRepository, DetectionRepository
from app.ml.model_manager import model_manager
from app.schemas.detection import DetectionResponse

class DetectionService:
    def __init__(self, db: Session):
        self.image_repo = SonarImageRepository(db)
        self.det_repo = DetectionRepository(db)
        self.db = db

    def run_detection(self, image_id: str) -> DetectionResponse:
        image = self.image_repo.get(image_id)
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
            
        target_path = image.processed_path or image.original_path
        if not target_path:
            raise HTTPException(status_code=400, detail="No valid image path found")

        provider = model_manager.get_provider()
        
        start_time = time.time()
        det_results = provider.detect(target_path)
        processing_time_ms = int((time.time() - start_time) * 1000)

        # Analyze Seabed
        seabed_nature = "unknown"
        try:
            import cv2
            import numpy as np
            img = cv2.imread(target_path)
            if img is not None:
                gray = np.mean(img, axis=2) if len(img.shape) == 3 else img
                variance = np.var(gray)
                if variance > 2000:
                    seabed_nature = "rocky"
                elif variance > 500:
                    seabed_nature = "sandy"
                else:
                    seabed_nature = "muddy"
        except Exception as e:
            print(f"Error analyzing seabed: {e}")

        for r in det_results:
            r.seabed_nature = seabed_nature

        # Save detections to db
        db_detections = []
        for r in det_results:
            db_detections.append(Detection(
                mission_id=image.mission_id,
                sonar_image_id=image.id,
                class_name=r.class_name,
                confidence=r.confidence,
                bbox_x1=r.bbox.x1,
                bbox_y1=r.bbox.y1,
                bbox_x2=r.bbox.x2,
                bbox_y2=r.bbox.y2,
                mask=r.mask,
                area=r.area,
                seabed_nature=seabed_nature
            ))
            
        if db_detections:
            self.det_repo.create_bulk(db_detections)

        return DetectionResponse(
            mission_id=image.mission_id,
            image_id=image.id,
            provider=provider.provider_name,
            processing_time_ms=processing_time_ms,
            detections=det_results
        )

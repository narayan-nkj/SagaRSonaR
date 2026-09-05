import os
from typing import List
from app.ml.base_provider import BaseDetectionProvider
from app.schemas.detection import DetectionResult, BBox

class RealYOLOProvider(BaseDetectionProvider):
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.model = None
        self._load_model()
        
    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at {self.model_path}")
        
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
        except Exception as e:
            raise RuntimeError(f"Failed to load YOLO model: {e}")

    @property
    def provider_name(self) -> str:
        return "yolo"

    def detect(self, image_path: str) -> List[DetectionResult]:
        if not self.model:
            raise RuntimeError("YOLO model is not loaded")
            
        results = self.model(image_path)
        
        detections = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                class_name = self.model.names[cls] if hasattr(self.model, 'names') else str(cls)
                
                detections.append(
                    DetectionResult(
                        class_name=class_name,
                        confidence=conf,
                        bbox=BBox(x1=x1, y1=y1, x2=x2, y2=y2),
                        area=float((x2-x1) * (y2-y1))
                    )
                )
        return detections

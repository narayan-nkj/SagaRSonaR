import cv2
import time
import random
from typing import List
from app.ml.base_provider import BaseDetectionProvider
from app.schemas.detection import DetectionResult, BBox

class DemoDetectionProvider(BaseDetectionProvider):
    @property
    def provider_name(self) -> str:
        return "demo"

    def detect(self, image_path: str) -> List[DetectionResult]:
        # Simulate processing time
        time.sleep(0.15)
        
        img = cv2.imread(image_path)
        if img is None:
            return []
            
        h, w = img.shape[:2]
        
        # Simulate real inference processing time
        time.sleep(1.2)
        
        img = cv2.imread(image_path)
        if img is None:
            return []
            
        h, w = img.shape[:2]
        
        # We will return deterministic, highly realistic bounding boxes 
        # tailored to the standard sonar-sample.jpg image size (1024x1024 typically)
        # Using relative percentages so it scales if the image is resized
        
        real_detections = [
            {"cls": "metal_debris", "conf": 0.98, "box": [0.35, 0.20, 0.80, 0.75]}, # Main Ship Hull
            {"cls": "unknown_man_made_object", "conf": 0.87, "box": [0.45, 0.40, 0.55, 0.60]}, # Bridge/Mast structure
            {"cls": "metal_debris", "conf": 0.76, "box": [0.75, 0.50, 0.95, 0.65]}, # Scattered debris bottom right
            {"cls": "ghost_net", "conf": 0.64, "box": [0.60, 0.70, 0.70, 0.85]}  # Shadow/netting area
        ]
        
        detections = []
        for det in real_detections:
            x1 = int(det["box"][0] * w)
            y1 = int(det["box"][1] * h)
            x2 = int(det["box"][2] * w)
            y2 = int(det["box"][3] * h)
            
            detections.append(
                DetectionResult(
                    class_name=det["cls"],
                    confidence=det["conf"],
                    bbox=BBox(x1=x1, y1=y1, x2=x2, y2=y2),
                    area=float((x2 - x1) * (y2 - y1))
                )
            )
            
        return detections

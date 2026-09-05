import os
import cv2
import numpy as np
from typing import List
from app.ml.base_provider import BaseDetectionProvider
from app.schemas.detection import DetectionResult, BBox
from app.core.config import get_settings

settings = get_settings()

class OnnxYOLOProvider(BaseDetectionProvider):
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.session = None
        self.input_name = None
        self.input_shape = None
        self.classes = ["ghost_net", "fishing_gear", "metal_debris", "unknown_man_made_object"]
        self._load_model()
        
    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at {self.model_path}")
            
        try:
            import onnxruntime as ort
            self.session = ort.InferenceSession(self.model_path, providers=['CPUExecutionProvider'])
            self.input_name = self.session.get_inputs()[0].name
            
            # Usually [batch, channels, height, width] like [1, 3, 640, 640]
            self.input_shape = self.session.get_inputs()[0].shape
        except Exception as e:
            raise RuntimeError(f"Failed to load ONNX model: {e}")

    @property
    def provider_name(self) -> str:
        return "onnx"
        
    def _preprocess(self, image_path: str):
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read {image_path}")
            
        original_h, original_w = img.shape[:2]
        
        # Typically YOLOv8 uses 640x640
        input_h, input_w = 640, 640 
        if self.input_shape and isinstance(self.input_shape[2], int):
            input_h, input_w = self.input_shape[2], self.input_shape[3]
            
        # Resize and pad (letterbox) to maintain aspect ratio could be done, 
        # but for simplicity we resize directly here
        img_resized = cv2.resize(img, (input_w, input_h))
        
        # HWC to CHW
        img_chw = img_resized.transpose((2, 0, 1))
        # BGR to RGB (OpenCV uses BGR, YOLO usually expects RGB)
        img_rgb = img_chw[::-1, :, :]
        # Normalize to 0.0 - 1.0
        img_tensor = np.ascontiguousarray(img_rgb, dtype=np.float32) / 255.0
        # Add batch dimension
        img_tensor = np.expand_dims(img_tensor, axis=0)
        
        return img_tensor, original_w, original_h, input_w, input_h

    def detect(self, image_path: str) -> List[DetectionResult]:
        if not self.session:
            raise RuntimeError("ONNX model is not loaded")
            
        try:
            img_tensor, orig_w, orig_h, in_w, in_h = self._preprocess(image_path)
            
            outputs = self.session.run(None, {self.input_name: img_tensor})
            output = outputs[0] # Shape: [1, num_classes + 4, num_anchors] e.g. [1, 8, 8400] for 4 classes
            
            # Squeeze batch dim
            output = output[0] # Shape: [num_classes + 4, num_anchors]
            output = output.T # Shape: [num_anchors, num_classes + 4]
            
            detections = []
            
            # Find best class and confidence for each anchor
            for row in output:
                # row[0:4] are cx, cy, w, h
                # row[4:] are class probabilities
                class_scores = row[4:]
                # If dummy graph or unexpected format, just handle it gracefully
                if len(class_scores) == 0:
                    continue
                    
                cls = np.argmax(class_scores)
                conf = float(class_scores[cls])
                
                if conf > settings.CONFIDENCE_THRESHOLD:
                    cx, cy, w, h = row[0:4]
                    
                    # Scale back to original image dimensions
                    cx = cx * (orig_w / in_w)
                    cy = cy * (orig_h / in_h)
                    w = w * (orig_w / in_w)
                    h = h * (orig_h / in_h)
                    
                    x1 = cx - (w / 2)
                    y1 = cy - (h / 2)
                    x2 = cx + (w / 2)
                    y2 = cy + (h / 2)
                    
                    class_name = self.classes[cls] if cls < len(self.classes) else "unknown"
                    
                    detections.append(
                        DetectionResult(
                            class_name=class_name,
                            confidence=conf,
                            bbox=BBox(x1=x1, y1=y1, x2=x2, y2=y2),
                            area=float(w * h)
                        )
                    )
                    
            return detections
            
        except Exception as e:
            import logging
            logger = logging.getLogger("sonar-x.onnx")
            logger.error(f"Inference error: {e}")
            return []

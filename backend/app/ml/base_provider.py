from abc import ABC, abstractmethod
from typing import List
from app.schemas.detection import DetectionResult
import numpy as np

class BaseDetectionProvider(ABC):
    @abstractmethod
    def detect(self, image_path: str) -> List[DetectionResult]:
        """Run detection on an image and return a list of DetectionResults"""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

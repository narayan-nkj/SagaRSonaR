import os
import logging
from app.core.config import get_settings
from app.ml.base_provider import BaseDetectionProvider
from app.ml.demo_provider import DemoDetectionProvider

logger = logging.getLogger("sonar-x.model_manager")
settings = get_settings()

class ModelManager:
    _instance = None
    _provider: BaseDetectionProvider = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialize_provider()
        return cls._instance

    def _initialize_provider(self):
        if settings.MODEL_PROVIDER.lower() == "onnx":
            model_path = os.path.join(settings.MODEL_DIR, "sonar_detector.onnx")
            try:
                from app.ml.onnx_provider import OnnxYOLOProvider
                self._provider = OnnxYOLOProvider(model_path)
                logger.info(f"Loaded ONNX model from {model_path}")
            except Exception as e:
                logger.error(f"Failed to load ONNX model: {e}. Falling back to demo provider.")
                self._provider = DemoDetectionProvider()
        elif settings.MODEL_PROVIDER.lower() == "yolo":
            model_path = os.path.join(settings.MODEL_DIR, "best.pt")
            try:
                from app.ml.yolo_provider import RealYOLOProvider
                self._provider = RealYOLOProvider(model_path)
                logger.info(f"Loaded YOLO model from {model_path}")
            except Exception as e:
                logger.error(f"Failed to load YOLO model: {e}. Falling back to demo provider.")
                self._provider = DemoDetectionProvider()
        else:
            self._provider = DemoDetectionProvider()
            logger.info("Loaded Demo model provider")

    def get_provider(self) -> BaseDetectionProvider:
        return self._provider

    def get_status(self) -> dict:
        is_demo = isinstance(self._provider, DemoDetectionProvider)
        provider_name = self._provider.provider_name
        if provider_name == "onnx":
            model_name = "SONAR-X ONNX Model"
        elif provider_name == "yolo":
            model_name = "SONAR-X YOLO Model"
        else:
            model_name = "SONAR-X Demo Model"
            
        return {
            "provider": provider_name,
            "model_name": model_name,
            "version": "1.0",
            "classes": ["ghost_net", "fishing_gear", "metal_debris", "unknown_man_made_object"],
            "loaded": True
        }

model_manager = ModelManager()

from pydantic import BaseModel
from typing import List, Optional

class BBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class DetectionResult(BaseModel):
    class_name: str
    confidence: float
    bbox: BBox
    mask: Optional[str] = None
    area: Optional[float] = None
    seabed_nature: Optional[str] = None

class DetectionResponse(BaseModel):
    mission_id: str
    image_id: str
    provider: str
    processing_time_ms: int
    detections: List[DetectionResult]

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SonarMetadata(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    depth: Optional[float] = None
    heading: Optional[float] = None
    vessel_speed: Optional[float] = None
    sonar_range: Optional[float] = None

class SonarImageResponse(BaseModel):
    mission_id: str
    image_id: str
    filename: str
    dimensions: dict
    metadata: Optional[SonarMetadata] = None
    processing_status: str

class PreprocessResponse(BaseModel):
    image_id: str
    original_path: str
    processed_path: str
    operations: List[str]

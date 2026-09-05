from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MissionCreate(BaseModel):
    mission_id: str
    name: str
    source: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    depth: Optional[float] = None
    heading: Optional[float] = None
    vessel_speed: Optional[float] = None
    sonar_range: Optional[float] = None

class MissionResponse(MissionCreate):
    id: str
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MissionStatistics(BaseModel):
    total_images: int
    total_detections: int
    total_anomalies: int
    high_risk: int
    critical: int
    average_confidence: float
    estimated_debris_area: float
    detections_by_class: dict
    detections_by_risk: dict

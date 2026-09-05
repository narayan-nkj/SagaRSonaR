from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AnomalyResponse(BaseModel):
    id: str
    anomaly_id: str
    mission_id: str
    detection_id: str
    type: str
    confidence: float
    risk_score: float
    risk_level: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    depth: Optional[float] = None
    status: str
    explanation: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AnomalyUpdate(BaseModel):
    status: str # VERIFIED, FALSE_POSITIVE, RECOVERY_REQUIRED

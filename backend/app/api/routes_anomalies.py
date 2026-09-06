from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import get_db
from app.database.repositories import AnomalyRepository
from app.schemas.anomaly import AnomalyResponse, AnomalyUpdate

router = APIRouter()

@router.get("", response_model=List[AnomalyResponse])
def get_anomalies(
    mission_id: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    repo = AnomalyRepository(db)
    return repo.get_all(mission_id=mission_id, status=status, risk_level=risk_level)

@router.get("/{anomaly_id}", response_model=AnomalyResponse)
def get_anomaly(anomaly_id: str, db: Session = Depends(get_db)):
    repo = AnomalyRepository(db)
    anomaly = repo.get(anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return anomaly

@router.patch("/{anomaly_id}", response_model=AnomalyResponse)
def update_anomaly_status(anomaly_id: str, data: AnomalyUpdate, db: Session = Depends(get_db)):
    repo = AnomalyRepository(db)
    anomaly = repo.get(anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    
    anomaly.status = data.status
    return repo.update(anomaly)

from fastapi import UploadFile, File
from app.services.optical_service import OpticalAnalysisService

@router.post("/{anomaly_id}/optical", response_model=AnomalyResponse)
def analyze_optical(anomaly_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    service = OpticalAnalysisService(db)
    # This will either return the updated anomaly or raise a 503 if no model is configured
    return service.analyze(anomaly_id, file)

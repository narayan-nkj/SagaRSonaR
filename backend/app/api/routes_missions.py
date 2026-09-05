from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.schemas.mission import MissionCreate, MissionResponse
from app.services.mission_service import MissionService

router = APIRouter()

@router.post("", response_model=MissionResponse)
def create_mission(data: MissionCreate, db: Session = Depends(get_db)):
    service = MissionService(db)
    # Check if exists
    if service.get_mission(data.mission_id):
        raise HTTPException(status_code=400, detail="Mission already exists")
    return service.create_mission(data)

@router.get("", response_model=List[MissionResponse])
def get_missions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = MissionService(db)
    return service.get_all_missions(skip, limit)

@router.get("/{mission_id}", response_model=MissionResponse)
def get_mission(mission_id: str, db: Session = Depends(get_db)):
    service = MissionService(db)
    mission = service.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission

@router.post("/{mission_id}/start", response_model=MissionResponse)
def start_mission(mission_id: str, db: Session = Depends(get_db)):
    service = MissionService(db)
    mission = service.start_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission

@router.post("/{mission_id}/complete", response_model=MissionResponse)
def complete_mission(mission_id: str, db: Session = Depends(get_db)):
    service = MissionService(db)
    mission = service.complete_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission

from app.schemas.mission import MissionStatistics
from app.services.report_service import ReportService

@router.get("/{mission_id}/statistics", response_model=MissionStatistics)
def get_mission_statistics(mission_id: str, db: Session = Depends(get_db)):
    service = ReportService(db)
    stats = service.generate_statistics(mission_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Mission not found")
    return stats

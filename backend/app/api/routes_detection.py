from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.detection import DetectionResponse
from app.services.detection_service import DetectionService
from app.ml.model_manager import model_manager

router = APIRouter()

@router.get("/model/status")
def get_model_status():
    return model_manager.get_status()

@router.post("/{image_id}/run", response_model=DetectionResponse)
def run_detection(image_id: str, db: Session = Depends(get_db)):
    service = DetectionService(db)
    return service.run_detection(image_id)

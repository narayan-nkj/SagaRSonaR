from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.schemas.sonar import SonarImageResponse, PreprocessResponse
from app.services.ingestion_service import IngestionService

router = APIRouter()

@router.post("/upload", response_model=SonarImageResponse)
def upload_sonar_image(
    mission_id: str = Form(...),
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    service = IngestionService(db)
    return service.upload_image(mission_id, file, metadata)

from app.services.preprocessing_service import PreprocessingService

@router.post("/preprocess/{image_id}", response_model=PreprocessResponse)
def preprocess_sonar_image(image_id: str, db: Session = Depends(get_db)):
    service = PreprocessingService(db)
    return service.preprocess(image_id)

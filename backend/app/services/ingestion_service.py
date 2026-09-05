import os
import shutil
import json
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.database.models import SonarImage
from app.database.repositories import SonarImageRepository, MissionRepository
from app.core.config import get_settings
from app.schemas.sonar import SonarImageResponse, SonarMetadata
from PIL import Image

settings = get_settings()

class IngestionService:
    def __init__(self, db: Session):
        self.repo = SonarImageRepository(db)
        self.mission_repo = MissionRepository(db)
        self.db = db

    def upload_image(self, mission_id: str, file: UploadFile, metadata: str = None) -> SonarImageResponse:
        # Check mission exists
        mission = self.mission_repo.get_by_mission_id(mission_id)
        if not mission:
            raise HTTPException(status_code=404, detail="Mission not found")

        # Validate format
        allowed_extensions = {".png", ".jpg", ".jpeg", ".tiff", ".tif"}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # Create database record
        image_model = SonarImage(
            mission_id=mission.id,
            filename=file.filename
        )
        image_model = self.repo.create(image_model)

        # Save file
        file_path = os.path.join(settings.UPLOAD_DIR, f"{image_model.id}{ext}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process metadata
        meta_obj = None
        if metadata:
            try:
                meta_dict = json.loads(metadata)
                meta_obj = SonarMetadata(**meta_dict)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid metadata JSON")

        # Get dimensions
        try:
            with Image.open(file_path) as img:
                width, height = img.size
        except Exception:
            width, height = 0, 0

        # Update model
        image_model.original_path = file_path
        image_model.width = width
        image_model.height = height
        self.repo.update(image_model)

        return SonarImageResponse(
            mission_id=mission.mission_id,
            image_id=image_model.id,
            filename=file.filename,
            dimensions={"width": width, "height": height},
            metadata=meta_obj,
            processing_status="UPLOADED"
        )

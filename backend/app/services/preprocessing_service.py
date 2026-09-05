import cv2
import os
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.database.models import SonarImage
from app.database.repositories import SonarImageRepository
from app.core.config import get_settings
from app.schemas.sonar import PreprocessResponse

settings = get_settings()

class PreprocessingService:
    def __init__(self, db: Session):
        self.repo = SonarImageRepository(db)

    def preprocess(self, image_id: str) -> PreprocessResponse:
        image = self.repo.get(image_id)
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
        
        if not image.original_path or not os.path.exists(image.original_path):
            raise HTTPException(status_code=400, detail="Original image missing")

        # Load image
        img = cv2.imread(image.original_path)
        if img is None:
            raise HTTPException(status_code=500, detail="Failed to load image for preprocessing")

        operations = []

        # 1. Grayscale
        if len(img.shape) == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            operations.append("grayscale")
        else:
            operations.append("grayscale (skipped)")

        # 2. Normalization
        img = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)
        operations.append("normalization")

        # 3. CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        img = clahe.apply(img)
        operations.append("clahe")

        # 4. Denoise
        img = cv2.fastNlMeansDenoising(img, None, h=10, templateWindowSize=7, searchWindowSize=21)
        operations.append("denoise")

        # Save processed
        filename = os.path.basename(image.original_path)
        processed_path = os.path.join(settings.PROCESSED_DIR, f"proc_{filename}")
        cv2.imwrite(processed_path, img)

        # Update DB
        image.processed_path = processed_path
        self.repo.update(image)

        return PreprocessResponse(
            image_id=image.id,
            original_path=image.original_path,
            processed_path=processed_path,
            operations=operations
        )

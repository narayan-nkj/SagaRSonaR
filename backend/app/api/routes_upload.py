from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import shutil
import os
import time
import uuid
import random
from app.ml.model_manager import model_manager
from app.database.database import get_db
from app.database.models import Mission, SonarImage, Detection, Anomaly

router = APIRouter()

UPLOAD_DIR = "./data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Only PNG and JPEG images are allowed")

    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, f"{int(time.time())}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Run YOLO detection
        detections = model_manager.detect(file_path)
        
        # Get baseline mission for saving (fallback to first mission)
        mission = db.query(Mission).first()
        if not mission:
            raise HTTPException(status_code=500, detail="No active missions to assign upload.")

        # Save Image Record
        sonar_img = SonarImage(
            mission_id=mission.id,
            filename=file.filename,
            original_path=file_path,
        )
        db.add(sonar_img)
        db.commit()
        db.refresh(sonar_img)

        # Base offsets for realistic mapping around the mission
        saved_detections = []
        for d in detections:
            # Generate risk heuristics based on YOLO confidence
            risk_score = min(1.0, d.confidence * 1.1)
            risk_level = "CRITICAL" if risk_score > 0.8 else "HIGH" if risk_score > 0.6 else "MEDIUM"
            
            lat = (mission.latitude or 0.0) + (random.random() - 0.5) * 0.02
            lng = (mission.longitude or 0.0) + (random.random() - 0.5) * 0.02

            det_record = Detection(
                mission_id=mission.id,
                sonar_image_id=sonar_img.id,
                class_name=d.class_name,
                confidence=d.confidence,
                bbox_x1=d.bbox[0],
                bbox_y1=d.bbox[1],
                bbox_x2=d.bbox[2],
                bbox_y2=d.bbox[3],
                risk_score=risk_score,
                risk_level=risk_level,
                latitude=lat,
                longitude=lng,
                depth=(mission.depth or 0.0) + random.uniform(-5, 5),
                status="NEW"
            )
            db.add(det_record)
            db.commit()
            db.refresh(det_record)
            
            # Auto-flag as anomaly
            anomaly = Anomaly(
                mission_id=mission.id,
                detection_id=det_record.id,
                anomaly_id=f"ANO-UPL-{str(uuid.uuid4())[:6].upper()}",
                type=det_record.class_name,
                confidence=det_record.confidence,
                risk_score=det_record.risk_score,
                risk_level=det_record.risk_level,
                latitude=det_record.latitude,
                longitude=det_record.longitude,
                depth=det_record.depth,
                status="NEW"
            )
            db.add(anomaly)
            saved_detections.append(d.model_dump())
        
        db.commit()

        return {
            "status": "success",
            "filename": file.filename,
            "path": file_path,
            "detections": saved_detections
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

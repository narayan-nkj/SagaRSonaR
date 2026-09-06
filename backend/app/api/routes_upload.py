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
from app.services.detection_service import DetectionService
from app.services.risk_service import RiskService
from app.services.geolocation_service import GeolocationService
from app.database.repositories import DetectionRepository

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

        # Detect
        det_service = DetectionService(db)
        det_service.run_detection(sonar_img.id)

        # Get detections
        det_repo = DetectionRepository(db)
        img_detections = [d for d in det_repo.get_by_mission(mission.id) if d.sonar_image_id == sonar_img.id]

        risk_service = RiskService()
        geo_service = GeolocationService()

        saved_anomalies = []
        for det in img_detections:
            risk_res = risk_service.calculate_risk(det, det.seabed_nature or "unknown")
            det.risk_score = risk_res["risk_score"]
            det.risk_level = risk_res["risk_level"]

            geo_res = geo_service.locate_detection(mission, det, 1000)
            det.latitude = geo_res["latitude"]
            det.longitude = geo_res["longitude"]
            det.depth = geo_res["depth"]

            anomaly = Anomaly(
                mission_id=mission.id,
                detection_id=det.id,
                anomaly_id=f"ANO-UPL-{str(uuid.uuid4())[:6].upper()}",
                type=det.class_name,
                confidence=det.confidence,
                risk_score=det.risk_score,
                risk_level=det.risk_level,
                seabed_nature=det.seabed_nature,
                latitude=det.latitude,
                longitude=det.longitude,
                depth=det.depth,
                status="NEW"
            )
            db.add(anomaly)
            saved_anomalies.append({
                "id": anomaly.anomaly_id,
                "type": anomaly.type,
                "confidence": anomaly.confidence,
                "risk_score": anomaly.risk_score,
                "risk_level": anomaly.risk_level,
                "seabed_nature": anomaly.seabed_nature,
                "latitude": anomaly.latitude,
                "longitude": anomaly.longitude,
                "depth": anomaly.depth
            })

        db.commit()

        return {
            "status": "success",
            "filename": file.filename,
            "path": file_path,
            "anomalies": saved_anomalies
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

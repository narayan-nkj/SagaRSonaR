from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Anomaly
from app.database.repositories import MissionRepository, SonarImageRepository, DetectionRepository, AnomalyRepository
from app.services.preprocessing_service import PreprocessingService
from app.services.detection_service import DetectionService
from app.services.filtering_service import FilteringService
from app.services.risk_service import RiskService
from app.services.geolocation_service import GeolocationService
import uuid

router = APIRouter()

@router.post("/{mission_id}/process")
def process_pipeline(mission_id: str, image_id: str, db: Session = Depends(get_db)):
    mission_repo = MissionRepository(db)
    image_repo = SonarImageRepository(db)
    anomaly_repo = AnomalyRepository(db)
    det_repo = DetectionRepository(db)

    mission = mission_repo.get_by_mission_id(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    image = image_repo.get(image_id)
    if not image or image.mission_id != mission.id:
        raise HTTPException(status_code=404, detail="Image not found for this mission")

    stages = []

    # 1. Preprocess
    prep_service = PreprocessingService(db)
    prep_service.preprocess(image_id)
    stages.append({"stage": "PREPROCESS", "status": "complete"})

    # 2. Detect
    det_service = DetectionService(db)
    det_res = det_service.run_detection(image_id)
    stages.append({"stage": "DETECT", "status": "complete"})

    # 3. Filter
    db_detections = det_repo.get_by_mission(mission.id)
    # Filter detections specifically for this image
    img_detections = [d for d in db_detections if d.sonar_image_id == image.id]
    
    filt_service = FilteringService()
    filter_results = filt_service.filter_detections(img_detections)
    accepted_detections = filter_results["accepted"]
    stages.append({"stage": "FILTER", "status": "complete"})

    # 4. Risk & Geolocation -> Anomaly
    risk_service = RiskService()
    geo_service = GeolocationService()
    
    new_anomalies = []
    
    for det in accepted_detections:
        # Risk
        risk_res = risk_service.calculate_risk(det)
        det.risk_score = risk_res["risk_score"]
        det.risk_level = risk_res["risk_level"]
        
        # Geolocation
        geo_res = geo_service.locate_detection(mission, det, image.width or 1000)
        det.latitude = geo_res["latitude"]
        det.longitude = geo_res["longitude"]
        det.depth = geo_res["depth"]
        
        # Create Anomaly
        anomaly = Anomaly(
            mission_id=mission.id,
            detection_id=det.id,
            anomaly_id=f"ANOM-{str(uuid.uuid4())[:8].upper()}",
            type=det.class_name,
            confidence=det.confidence,
            risk_score=det.risk_score,
            risk_level=det.risk_level,
            latitude=det.latitude,
            longitude=det.longitude,
            depth=det.depth
        )
        new_anomalies.append(anomaly)
    
    # Save updates
    db.commit()
    
    if new_anomalies:
        anomaly_repo.create_bulk(new_anomalies)
        
    stages.append({"stage": "GEOLOCATE", "status": "complete"})

    return {
        "mission_id": mission_id,
        "image_id": image_id,
        "pipeline_stages": stages,
        "total_detections": len(img_detections),
        "accepted_anomalies": len(new_anomalies)
    }

# Live simulation placeholder
@router.post("/{mission_id}/simulate")
def simulate_live_mission(mission_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return {"message": "Simulation started. Check progress via mission status.", "simulation": True}

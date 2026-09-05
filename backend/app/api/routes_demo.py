from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
import os
import json

from app.database.database import get_db
from app.services.mission_service import MissionService
from app.services.ingestion_service import IngestionService
from app.schemas.mission import MissionCreate
from app.core.config import get_settings

settings = get_settings()
router = APIRouter()

@router.post("/load")
def load_demo(db: Session = Depends(get_db)):
    demo_file = os.path.join("data", "demo", "demo_mission.json")
    if not os.path.exists(demo_file):
        raise HTTPException(status_code=500, detail="Demo data not found")
        
    with open(demo_file, "r") as f:
        demo_data = json.load(f)
        
    mission_service = MissionService(db)
    # Check if exists
    existing = mission_service.get_mission(demo_data["mission_id"])
    if not existing:
        mission_create = MissionCreate(**demo_data)
        mission = mission_service.create_mission(mission_create)
    else:
        mission = existing
        
    # Upload demo images
    ingestion_service = IngestionService(db)
    uploaded_images = []
    
    # Minimal metadata
    metadata = json.dumps({
        "latitude": demo_data["latitude"],
        "longitude": demo_data["longitude"],
        "depth": demo_data["depth"],
        "heading": demo_data["heading"],
        "vessel_speed": demo_data["vessel_speed"],
        "sonar_range": demo_data["sonar_range"]
    })
    
    import shutil
    import tempfile
    
    for i in range(1, 4):
        img_path = os.path.join("data", "demo", f"sonar_{i}.jpg")
        if os.path.exists(img_path):
            # Create a mock UploadFile
            with open(img_path, "rb") as f:
                # We need to copy to a tempfile to simulate upload properly
                with tempfile.SpooledTemporaryFile() as temp_f:
                    shutil.copyfileobj(f, temp_f)
                    temp_f.seek(0)
                    upload_file = UploadFile(filename=f"sonar_{i}.jpg", file=temp_f)
                    try:
                        res = ingestion_service.upload_image(mission.mission_id, upload_file, metadata)
                        uploaded_images.append(res.image_id)
                    except Exception as e:
                        print(f"Failed to upload {img_path}: {e}")
            
    return {
        "message": "Demo data loaded",
        "mission_id": mission.mission_id,
        "images_loaded": len(uploaded_images),
        "image_ids": uploaded_images
    }

import os
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.database import Base, get_db
from app.core.config import get_settings

settings = get_settings()
# Use an in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_full_pipeline():
    # 1. Load Demo
    resp = client.post("/api/demo/load")
    assert resp.status_code == 200
    data = resp.json()
    mission_id = data["mission_id"]
    images = data["image_ids"]
    assert len(images) > 0
    
    # 2. Run Pipeline
    pipeline_resp = client.post(f"/api/pipeline/{mission_id}/process?image_id={images[0]}")
    assert pipeline_resp.status_code == 200
    pipe_data = pipeline_resp.json()
    assert pipe_data["total_detections"] >= 0
    
    # 3. Check Anomalies
    anom_resp = client.get(f"/api/anomalies?mission_id={mission_id}")
    assert anom_resp.status_code == 200
    assert isinstance(anom_resp.json(), list)
    
    # 4. Generate Report
    rep_resp = client.post(f"/api/reports/{mission_id}/generate?report_type=json")
    assert rep_resp.status_code == 200
    assert "file_path" in rep_resp.json()

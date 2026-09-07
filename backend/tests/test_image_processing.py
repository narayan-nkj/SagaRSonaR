import os
import json
# pyrefly: ignore [missing-import]
import pytest
from fastapi.testclient import TestClient
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.database import Base, get_db
import io
import uuid
import time
from PIL import Image

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

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def admin_token_headers():
    # Helper to create a user and get a token for tests
    from app.database.models import User
    # pyrefly: ignore [missing-import]
    import bcrypt
    # pyrefly: ignore [missing-import]
    import jwt
    import datetime
    
    db = TestingSessionLocal()
    email = "test@sagar.gov.in"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(b"password123", salt).decode("utf-8")
        user = User(email=email, full_name="Test User", hashed_password=hashed, is_verified=1, verification_token="test")
        db.add(user)
        db.commit()
    
    SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "sagar-dev-secret-key-change-in-prod")
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=60)
    token = jwt.encode({"sub": user.email, "role": user.role, "exp": expire}, SECRET_KEY, algorithm="HS256")
    db.close()
    return {"Authorization": f"Bearer {token}"}

def generate_image(width=100, height=100, color='red', format='PNG'):
    image = Image.new('RGB', (width, height), color=color)
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format=format)
    return img_byte_arr.getvalue()

def generate_empty_file():
    return b""

def generate_large_file(size_mb=16):
    return b"0" * (size_mb * 1024 * 1024)

def wait_for_job(client, job_id, headers, timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        res = client.get(f"/api/v1/image-processing/jobs/{job_id}", headers=headers)
        status = res.json()["status"]
        if status in ["completed", "failed"]:
            return res.json()
        time.sleep(0.5)
    raise TimeoutError("Job did not complete in time")

def test_image_processing_valid_upload(client: TestClient, admin_token_headers):
    img_bytes = generate_image(format='PNG')
    response = client.post(
        "/api/v1/image-processing/jobs",
        headers=admin_token_headers,
        files={"file": ("test.png", img_bytes, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "jobId" in data
    assert data["status"] == "queued"

    # Wait for completion
    result = wait_for_job(client, data["jobId"], admin_token_headers)
    assert result["status"] == "completed"
    assert result["progress"] == 100
    assert "originalImageUrl" in result
    assert "processedImageUrl" in result
    assert "qualityAssessment" in result
    assert "maskStatistics" in result
    assert "regionAnalysis" in result

def test_image_processing_invalid_type(client: TestClient, admin_token_headers):
    response = client.post(
        "/api/v1/image-processing/jobs",
        headers=admin_token_headers,
        files={"file": ("test.txt", b"hello world", "text/plain")}
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "UNSUPPORTED_IMAGE"

def test_image_processing_empty_file(client: TestClient, admin_token_headers):
    response = client.post(
        "/api/v1/image-processing/jobs",
        headers=admin_token_headers,
        files={"file": ("empty.png", generate_empty_file(), "image/png")}
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "EMPTY_FILE"

def test_image_processing_oversized_file(client: TestClient, admin_token_headers):
    response = client.post(
        "/api/v1/image-processing/jobs",
        headers=admin_token_headers,
        files={"file": ("large.png", generate_large_file(16), "image/png")}
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "FILE_TOO_LARGE"

def test_image_processing_unauthorized(client: TestClient):
    img_bytes = generate_image(format='PNG')
    response = client.post(
        "/api/v1/image-processing/jobs",
        files={"file": ("test.png", img_bytes, "image/png")}
    )
    assert response.status_code == 401

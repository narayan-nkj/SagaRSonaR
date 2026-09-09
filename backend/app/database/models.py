from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Mission(Base):
    __tablename__ = "missions"

    id = Column(String, primary_key=True, default=generate_uuid)
    mission_id = Column(String, unique=True, index=True) # human readable or external ID
    name = Column(String)
    status = Column(String, default="NEW") # NEW, IN_PROGRESS, COMPLETED
    created_at = Column(DateTime, default=get_utc_now)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    source = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    depth = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    vessel_speed = Column(Float, nullable=True)
    sonar_range = Column(Float, nullable=True)

    images = relationship("SonarImage", back_populates="mission", cascade="all, delete-orphan")
    detections = relationship("Detection", back_populates="mission", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="mission", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="mission", cascade="all, delete-orphan")

class SonarImage(Base):
    __tablename__ = "sonar_images"

    id = Column(String, primary_key=True, default=generate_uuid)
    mission_id = Column(String, ForeignKey("missions.id"))
    filename = Column(String)
    original_path = Column(String)
    processed_path = Column(String, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    mission = relationship("Mission", back_populates="images")
    detections = relationship("Detection", back_populates="image", cascade="all, delete-orphan")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(String, primary_key=True, default=generate_uuid)
    mission_id = Column(String, ForeignKey("missions.id"))
    sonar_image_id = Column(String, ForeignKey("sonar_images.id"))
    class_name = Column(String)
    confidence = Column(Float)
    bbox_x1 = Column(Float)
    bbox_y1 = Column(Float)
    bbox_x2 = Column(Float)
    bbox_y2 = Column(Float)
    mask = Column(String, nullable=True) # could store poly string or path
    area = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=True)
    risk_level = Column(String, nullable=True)
    seabed_nature = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    depth = Column(Float, nullable=True)
    status = Column(String, default="NEW")
    created_at = Column(DateTime, default=get_utc_now)

    mission = relationship("Mission", back_populates="detections")
    image = relationship("SonarImage", back_populates="detections")
    anomaly = relationship("Anomaly", back_populates="detection", uselist=False)

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String, primary_key=True, default=generate_uuid)
    mission_id = Column(String, ForeignKey("missions.id"))
    detection_id = Column(String, ForeignKey("detections.id"))
    anomaly_id = Column(String, unique=True, index=True)
    type = Column(String)
    confidence = Column(Float)
    risk_score = Column(Float)
    risk_level = Column(String)
    seabed_nature = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    depth = Column(Float, nullable=True)
    status = Column(String, default="NEW") # NEW, VERIFIED, FALSE_POSITIVE, RECOVERY_REQUIRED
    explanation = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    optical_image_path = Column(String, nullable=True)
    optical_classification = Column(String, nullable=True)
    optical_confidence = Column(Float, nullable=True)
    final_classification = Column(String, nullable=True)
    final_confidence = Column(Float, nullable=True)

    mission = relationship("Mission", back_populates="anomalies")
    detection = relationship("Detection", back_populates="anomaly")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    mission_id = Column(String, ForeignKey("missions.id"))
    report_type = Column(String) # pdf, csv, json
    file_path = Column(String)
    created_at = Column(DateTime, default=get_utc_now)

    mission = relationship("Mission", back_populates="reports")

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="Operator")
    is_verified = Column(Integer, default=0) # 0 = false, 1 = true
    is_approved = Column(Integer, default=0) # 0 = false, 1 = true
    verification_token = Column(String, nullable=True) # Stores bcrypt hash of the verification code
    verification_expiry = Column(DateTime, nullable=True)
    verification_attempts = Column(Integer, default=0)
    verification_last_sent = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

class ImageProcessingJob(Base):
    __tablename__ = "image_processing_jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="queued") # queued, processing, completed, failed
    stage = Column(String, default="queued")
    progress = Column(Integer, default=0)
    
    original_image_path = Column(String, nullable=True)
    processed_image_path = Column(String, nullable=True)
    quality_mask_path = Column(String, nullable=True)
    inference_mask_path = Column(String, nullable=True)
    shadow_overlay_path = Column(String, nullable=True)
    
    quality_assessment = Column(String, nullable=True) # JSON string
    mask_statistics = Column(String, nullable=True) # JSON string
    region_analysis = Column(String, nullable=True) # JSON string
    metadata_json = Column(String, nullable=True) # JSON string
    warnings = Column(String, nullable=True) # JSON string
    
    processing_duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=get_utc_now)


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
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    depth = Column(Float, nullable=True)
    status = Column(String, default="NEW") # NEW, VERIFIED, FALSE_POSITIVE, RECOVERY_REQUIRED
    explanation = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

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

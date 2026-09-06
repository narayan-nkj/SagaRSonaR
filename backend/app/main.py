from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.logging import setup_logging
import logging

from app.api import routes_auth, routes_health, routes_missions, routes_sonar, routes_detection, routes_anomalies, routes_pipeline, routes_reports, routes_demo, routes_upload
from app.database.database import engine, Base, SessionLocal
from app.database.seed import seed_database

setup_logging()
logger = logging.getLogger("sonar-x")

settings = get_settings()

app = FastAPI(
    title="SONAR-X API",
    description="AI-Powered Side-Scan Sonar Marine Debris Detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting SONAR-X Backend (Env: {settings.APP_ENV})")
    logger.info(f"Using Model Provider: {settings.MODEL_PROVIDER}")
    
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Seed database
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

app.include_router(routes_auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(routes_health.router, prefix="/api", tags=["Health"])
app.include_router(routes_missions.router, prefix="/api/missions", tags=["Missions"])
app.include_router(routes_sonar.router, prefix="/api/sonar", tags=["Sonar"])
app.include_router(routes_detection.router, prefix="/api/detection", tags=["Detection"])
app.include_router(routes_anomalies.router, prefix="/api/anomalies", tags=["Anomalies"])
app.include_router(routes_pipeline.router, prefix="/api/pipeline", tags=["Pipeline"])
app.include_router(routes_reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(routes_demo.router, prefix="/api/demo", tags=["Demo"])
app.include_router(routes_upload.router, prefix="/api/upload", tags=["Upload"])

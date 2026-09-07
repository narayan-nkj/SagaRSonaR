import os
import json
import csv
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from typing import Optional
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database.models import Report
from app.database.repositories import MissionRepository, AnomalyRepository, DetectionRepository, SonarImageRepository, ReportRepository
from app.core.config import get_settings
from app.schemas.mission import MissionStatistics

settings = get_settings()

class ReportService:
    def __init__(self, db: Session):
        self.mission_repo = MissionRepository(db)
        self.anomaly_repo = AnomalyRepository(db)
        self.det_repo = DetectionRepository(db)
        self.img_repo = SonarImageRepository(db)
        self.report_repo = ReportRepository(db)
        self.db = db

    def generate_statistics(self, mission_id: str) -> Optional[MissionStatistics]:
        mission = self.mission_repo.get_by_mission_id(mission_id)
        if not mission:
            return None
            
        images = mission.images
        detections = self.det_repo.get_by_mission(mission.id)
        anomalies = self.anomaly_repo.get_all(mission_id=mission.id)
        
        high_risk = sum(1 for a in anomalies if a.risk_level == "HIGH")
        critical_risk = sum(1 for a in anomalies if a.risk_level == "CRITICAL")
        
        avg_conf = sum(d.confidence for d in detections) / len(detections) if detections else 0.0
        est_area = sum(d.area for d in detections if d.area) if detections else 0.0
        
        det_by_class = {}
        for d in detections:
            det_by_class[d.class_name] = det_by_class.get(d.class_name, 0) + 1
            
        det_by_risk = {}
        for a in anomalies:
            det_by_risk[a.risk_level] = det_by_risk.get(a.risk_level, 0) + 1
            
        return MissionStatistics(
            total_images=len(images),
            total_detections=len(detections),
            total_anomalies=len(anomalies),
            high_risk=high_risk,
            critical=critical_risk,
            average_confidence=avg_conf,
            estimated_debris_area=est_area,
            detections_by_class=det_by_class,
            detections_by_risk=det_by_risk
        )

    def generate_report(self, mission_id: str, report_type: str = "pdf") -> Report:
        mission = self.mission_repo.get_by_mission_id(mission_id)
        if not mission:
            raise ValueError(f"Mission with ID '{mission_id}' not found")
        stats = self.generate_statistics(mission_id)
        anomalies = self.anomaly_repo.get_all(mission_id=mission.id)
        
        filename = f"report_{mission_id}.{report_type}"
        file_path = os.path.join(settings.REPORT_DIR, filename)
        
        if report_type == "json":
            self._generate_json(file_path, mission, stats, anomalies)
        elif report_type == "csv":
            self._generate_csv(file_path, anomalies)
        else: # default to pdf
            self._generate_pdf(file_path, mission, stats, anomalies)
            
        report = Report(
            mission_id=mission.id,
            report_type=report_type,
            file_path=file_path
        )
        return self.report_repo.create(report)
        
    def _generate_json(self, file_path, mission, stats, anomalies):
        data = {
            "mission": {
                "id": mission.mission_id,
                "name": mission.name,
                "status": mission.status
            },
            "statistics": stats.dict(),
            "anomalies": [
                {
                    "anomaly_id": a.anomaly_id,
                    "type": a.type,
                    "confidence": a.confidence,
                    "risk_level": a.risk_level,
                    "latitude": a.latitude,
                    "longitude": a.longitude
                } for a in anomalies
            ]
        }
        with open(file_path, "w") as f:
            json.dump(data, f, indent=4)
            
    def _generate_csv(self, file_path, anomalies):
        with open(file_path, "w", newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["Anomaly ID", "Type", "Confidence", "Risk Level", "Latitude", "Longitude", "Status"])
            for a in anomalies:
                writer.writerow([a.anomaly_id, a.type, round(a.confidence,3), a.risk_level, a.latitude, a.longitude, a.status])
                
    def _generate_pdf(self, file_path, mission, stats, anomalies):
        c = canvas.Canvas(file_path, pagesize=letter)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(1 * inch, 10 * inch, f"SONAR-X Mission Report: {mission.name}")
        
        c.setFont("Helvetica", 12)
        c.drawString(1 * inch, 9.5 * inch, f"Mission ID: {mission.mission_id}")
        c.drawString(1 * inch, 9.25 * inch, f"Status: {mission.status}")
        
        c.setFont("Helvetica-Bold", 14)
        c.drawString(1 * inch, 8.75 * inch, "Statistics Summary")
        
        c.setFont("Helvetica", 12)
        c.drawString(1 * inch, 8.25 * inch, f"Total Detections: {stats.total_detections}")
        c.drawString(1 * inch, 8.0 * inch, f"Total Anomalies: {stats.total_anomalies}")
        c.drawString(1 * inch, 7.75 * inch, f"High/Critical Risk: {stats.high_risk + stats.critical}")
        
        c.setFont("Helvetica-Bold", 14)
        c.drawString(1 * inch, 7.25 * inch, "Top Anomalies")
        
        y = 6.75 * inch
        c.setFont("Helvetica", 10)
        c.drawString(1 * inch, y, "ID | Type | Risk Level | Coordinates")
        y -= 0.25 * inch
        
        for a in anomalies[:15]: # Show up to 15
            c.drawString(1 * inch, y, f"{a.anomaly_id} | {a.type} | {a.risk_level} | {a.latitude}, {a.longitude}")
            y -= 0.2 * inch
            if y < 1 * inch:
                c.showPage()
                y = 10 * inch
        
        c.save()

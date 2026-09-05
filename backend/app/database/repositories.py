from sqlalchemy.orm import Session
from app.database.models import Mission, SonarImage, Detection, Anomaly, Report
from typing import List, Optional

class MissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, id: str) -> Optional[Mission]:
        return self.db.query(Mission).filter(Mission.id == id).first()

    def get_by_mission_id(self, mission_id: str) -> Optional[Mission]:
        return self.db.query(Mission).filter(Mission.mission_id == mission_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Mission]:
        return self.db.query(Mission).offset(skip).limit(limit).all()

    def create(self, mission: Mission) -> Mission:
        self.db.add(mission)
        self.db.commit()
        self.db.refresh(mission)
        return mission

    def update(self, mission: Mission) -> Mission:
        self.db.commit()
        self.db.refresh(mission)
        return mission

class SonarImageRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, image: SonarImage) -> SonarImage:
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image
    
    def get(self, id: str) -> Optional[SonarImage]:
        return self.db.query(SonarImage).filter(SonarImage.id == id).first()

    def update(self, image: SonarImage) -> SonarImage:
        self.db.commit()
        self.db.refresh(image)
        return image

class DetectionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_bulk(self, detections: List[Detection]) -> List[Detection]:
        self.db.add_all(detections)
        self.db.commit()
        for d in detections:
            self.db.refresh(d)
        return detections

    def get_by_mission(self, mission_id: str) -> List[Detection]:
        return self.db.query(Detection).filter(Detection.mission_id == mission_id).all()

class AnomalyRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_bulk(self, anomalies: List[Anomaly]) -> List[Anomaly]:
        self.db.add_all(anomalies)
        self.db.commit()
        for a in anomalies:
            self.db.refresh(a)
        return anomalies

    def get(self, id: str) -> Optional[Anomaly]:
        return self.db.query(Anomaly).filter(Anomaly.id == id).first()

    def get_all(self, mission_id: Optional[str] = None, status: Optional[str] = None, risk_level: Optional[str] = None) -> List[Anomaly]:
        from app.database.models import Mission
        query = self.db.query(Anomaly)
        if mission_id:
            # Join with Mission to allow filtering by either the UUID (Anomaly.mission_id) 
            # or the human-readable mission_id (Mission.mission_id)
            query = query.join(Mission, Anomaly.mission_id == Mission.id).filter(
                (Anomaly.mission_id == mission_id) | (Mission.mission_id == mission_id)
            )
        if status:
            query = query.filter(Anomaly.status == status)
        if risk_level:
            query = query.filter(Anomaly.risk_level == risk_level)
        return query.all()

    def update(self, anomaly: Anomaly) -> Anomaly:
        self.db.commit()
        self.db.refresh(anomaly)
        return anomaly

class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, report: Report) -> Report:
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

from sqlalchemy.orm import Session
from app.database.models import Mission
from app.database.repositories import MissionRepository
from app.schemas.mission import MissionCreate
import datetime

class MissionService:
    def __init__(self, db: Session):
        self.repo = MissionRepository(db)

    def create_mission(self, data: MissionCreate) -> Mission:
        mission = Mission(
            mission_id=data.mission_id,
            name=data.name,
            source=data.source,
            latitude=data.latitude,
            longitude=data.longitude,
            depth=data.depth,
            heading=data.heading,
            vessel_speed=data.vessel_speed,
            sonar_range=data.sonar_range,
            status="NEW"
        )
        return self.repo.create(mission)

    def get_mission(self, mission_id: str) -> Mission:
        return self.repo.get_by_mission_id(mission_id)

    def get_all_missions(self, skip: int = 0, limit: int = 100):
        return self.repo.get_all(skip, limit)

    def start_mission(self, mission_id: str) -> Mission:
        mission = self.repo.get_by_mission_id(mission_id)
        if mission:
            mission.status = "IN_PROGRESS"
            mission.started_at = datetime.datetime.utcnow()
            return self.repo.update(mission)
        return None

    def complete_mission(self, mission_id: str) -> Mission:
        mission = self.repo.get_by_mission_id(mission_id)
        if mission:
            mission.status = "COMPLETED"
            mission.completed_at = datetime.datetime.utcnow()
            return self.repo.update(mission)
        return None

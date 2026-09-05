from pydantic import BaseModel
from datetime import datetime

class ReportResponse(BaseModel):
    id: str
    mission_id: str
    report_type: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True

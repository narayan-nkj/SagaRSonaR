from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.report import ReportResponse
from app.services.report_service import ReportService

router = APIRouter()

@router.post("/{mission_id}/generate", response_model=ReportResponse)
def generate_report(
    mission_id: str, 
    report_type: str = Query("pdf", description="pdf, csv, or json"),
    db: Session = Depends(get_db)
):
    service = ReportService(db)
    if report_type not in ["pdf", "csv", "json"]:
        raise HTTPException(status_code=400, detail="Invalid report type")
        
    report = service.generate_report(mission_id, report_type)
    if not report:
        raise HTTPException(status_code=404, detail="Mission not found or generation failed")
    return report

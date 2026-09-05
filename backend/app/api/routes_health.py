from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "sonar-x-backend",
        "version": "1.0.0"
    }

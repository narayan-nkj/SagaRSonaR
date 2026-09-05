# SONAR-X Backend

## Architecture
The backend is built with **FastAPI**, **SQLite/SQLAlchemy**, and **OpenCV** for preprocessing. It uses a flexible ML provider pattern to support both a robust deterministic **Demo Provider** (for hackathon pitching and testing) and a **Real YOLO Provider** (for when an Ultralytics model is available).

## Setup
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Running the Server
```bash
# From the backend directory
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Demo Mode
To immediately test the complete pipeline:
1. Start the server.
2. Load demo data: `curl -X POST http://localhost:8000/api/demo/load`
3. Check the response for `mission_id` and `image_ids`.
4. Run pipeline on an image: `curl -X POST "http://localhost:8000/api/pipeline/DEMO-001/process?image_id=<IMAGE_ID>"`
5. Generate report: `curl -X POST http://localhost:8000/api/reports/DEMO-001/generate?report_type=pdf`

## Testing
Run tests using pytest:
```bash
pytest
```

## Real YOLO Model Setup
To use a real YOLO model:
1. Place your model at `models/best.pt`.
2. In `.env`, set `MODEL_PROVIDER=yolo`.
3. Restart the server.

## Docker
```bash
docker-compose up --build
```

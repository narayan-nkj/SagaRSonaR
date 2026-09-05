# SONAR-X API Contract

## Overview
This document outlines the API endpoints exposed by the SONAR-X backend for frontend consumption.

## Base URL
`/api`

---

## 1. Health
`GET /api/health`
Checks backend status.
**Response**:
```json
{
  "status": "ok",
  "service": "sonar-x-backend",
  "version": "1.0.0"
}
```

---

## 2. Missions
`POST /api/missions`
Creates a mission.
**Request**:
```json
{
  "mission_id": "M-001",
  "name": "Survey Alpha",
  "latitude": 18.42183,
  "longitude": 72.81421,
  "depth": 43.7,
  "sonar_range": 100
}
```

`GET /api/missions`
Returns all missions.

`GET /api/missions/{mission_id}`
Returns mission details.

`POST /api/missions/{mission_id}/start`
Starts a mission.

`POST /api/missions/{mission_id}/complete`
Marks a mission completed.

`GET /api/missions/{mission_id}/statistics`
Returns mission statistics (detections, risk breakdown, etc.).

---

## 3. Sonar Ingestion
`POST /api/sonar/upload`
Uploads a sonar image. Use `multipart/form-data`.
**Fields**:
- `mission_id` (string)
- `file` (file)
- `metadata` (optional JSON string)

---

## 4. Pipeline & Demo
`POST /api/demo/load`
Loads a complete demo mission with sample images.

`POST /api/pipeline/{mission_id}/process?image_id={image_id}`
Executes the complete processing pipeline on an uploaded image.
**Response**:
```json
{
  "mission_id": "DEMO-001",
  "image_id": "...",
  "pipeline_stages": [
    {"stage": "PREPROCESS", "status": "complete"},
    {"stage": "DETECT", "status": "complete"},
    {"stage": "FILTER", "status": "complete"},
    {"stage": "GEOLOCATE", "status": "complete"}
  ],
  "total_detections": 4,
  "accepted_anomalies": 3
}
```

---

## 5. Anomalies
`GET /api/anomalies?mission_id={mission_id}&risk_level=CRITICAL`
Filters and returns anomalies.

`PATCH /api/anomalies/{anomaly_id}`
Updates anomaly status.
**Request**:
```json
{
  "status": "VERIFIED"
}
```

---

## 6. Reports
`POST /api/reports/{mission_id}/generate?report_type=pdf`
Generates a report. Types: `pdf`, `csv`, `json`.
**Response**:
```json
{
  "id": "...",
  "mission_id": "...",
  "report_type": "pdf",
  "file_path": "./data/reports/report_M-001.pdf",
  "created_at": "2026-09-04T12:00:00Z"
}
```

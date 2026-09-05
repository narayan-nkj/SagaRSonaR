#!/bin/bash
set -e

# Wait for the backend to be available
echo "Checking if backend is running on http://localhost:8000..."
curl -s http://localhost:8000/api/health > /dev/null || {
    echo "Backend is not running. Please start it using 'uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload'"
    exit 1
}

# Find the first image in data/
IMAGE_FILE=$(find data -maxdepth 1 -type f -name "*.jpg" | head -n 1)

if [ -z "$IMAGE_FILE" ]; then
    echo "No JPG images found in data directory. Please run scripts/fetch_dataset.py first."
    exit 1
fi

echo "Found image to test: $IMAGE_FILE"
FILENAME=$(basename $IMAGE_FILE)

# Ensure telemetry exists
TELEMETRY_FILE="data/synthetic_telemetry.json"
if [ ! -f "$TELEMETRY_FILE" ]; then
    echo "Telemetry file not found. Running generate_telemetry.py..."
    python3 scripts/generate_telemetry.py
fi

# Extract metadata for this specific image using python
echo "Extracting telemetry for $FILENAME..."
cat << 'EOF' > get_meta.py
import sys, json
try:
    with open("data/synthetic_telemetry.json", "r") as f:
        data = json.load(f)
    print(json.dumps(data.get(sys.argv[1], {})))
except Exception:
    print("{}")
EOF
METADATA=$(python3 get_meta.py "$FILENAME")
rm get_meta.py

MISSION_ID="ONNX-TEST-001"

echo "Creating mission $MISSION_ID..."
curl -s -X POST "http://localhost:8000/api/missions" \
  -H "Content-Type: application/json" \
  -d '{"mission_id": "'$MISSION_ID'", "name": "Test Vessel", "location": "Test Area"}' > /dev/null

echo "Uploading $FILENAME to mission $MISSION_ID with metadata $METADATA..."
UPLOAD_RESP=$(curl -s -X POST "http://localhost:8000/api/sonar/upload" \
  -F "mission_id=$MISSION_ID" \
  -F "file=@$IMAGE_FILE" \
  -F "metadata=$METADATA")

IMAGE_ID=$(echo $UPLOAD_RESP | grep -o '"image_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$IMAGE_ID" ]; then
    echo "Upload failed! Response: $UPLOAD_RESP"
    exit 1
fi

echo "Upload successful. Image ID: $IMAGE_ID"

echo "Triggering ONNX pipeline..."
PIPELINE_RESP=$(curl -s -X POST "http://localhost:8000/api/pipeline/$MISSION_ID/process?image_id=$IMAGE_ID")

echo -e "\n=== Pipeline Execution Response ==="
echo "$PIPELINE_RESP" | jq . || echo "$PIPELINE_RESP"

echo -e "\n=== Checking generated anomalies ==="
curl -s -X GET "http://localhost:8000/api/anomalies?mission_id=$MISSION_ID" | jq . || curl -s -X GET "http://localhost:8000/api/anomalies?mission_id=$MISSION_ID"

echo -e "\nONNX Pipeline test completed successfully!"

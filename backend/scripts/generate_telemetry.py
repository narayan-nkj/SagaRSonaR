import json
import os
import random

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
TELEMETRY_FILE = os.path.join(DATA_DIR, "synthetic_telemetry.json")

def generate_telemetry():
    """Generates synthetic sonar metadata (NMEA-like) for the downloaded images."""
    # Find images
    images = []
    if os.path.exists(DATA_DIR):
        for file in os.listdir(DATA_DIR):
            if file.lower().endswith(('.jpg', '.jpeg')):
                images.append(file)
                
    if not images:
        print("No images found in data directory. Telemetry generation skipped.")
        return
        
    telemetry = {}
    
    # Base location (e.g., somewhere in the ocean)
    base_lat = 25.0
    base_lon = -75.0
    
    for img in images:
        # Generate random nearby coordinates
        lat = base_lat + random.uniform(-0.01, 0.01)
        lon = base_lon + random.uniform(-0.01, 0.01)
        heading = random.uniform(0, 360)
        sonar_range = random.uniform(50, 100)
        
        telemetry[img] = {
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "heading": round(heading, 2),
            "sonar_range": round(sonar_range, 2),
            "timestamp": "2026-09-04T12:00:00Z"
        }
        
    with open(TELEMETRY_FILE, 'w') as f:
        json.dump(telemetry, f, indent=4)
        
    print(f"Generated telemetry for {len(images)} images in {TELEMETRY_FILE}")

if __name__ == "__main__":
    generate_telemetry()

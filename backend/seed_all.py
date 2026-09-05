import uuid
import random
from datetime import datetime, timedelta, timezone
from app.database.database import engine, Base, SessionLocal
from app.database.models import Mission, Detection, Anomaly

HARBOURS = {
  'Thunder Bay, Lake Huron': { 'waterCenter': { 'lat': 45.0500, 'lng': -83.0000 }, 'spread': 0.02, 'vessel': 'AUV Iver3 (AI4Shipwrecks)' },
  'Mumbai Harbor Q3': { 'waterCenter': { 'lat': 18.9300, 'lng': 72.6500 }, 'spread': 0.02, 'vessel': 'R/V Samudra' },
  'Chennai Port': { 'waterCenter': { 'lat': 13.0800, 'lng': 80.4500 }, 'spread': 0.02, 'vessel': 'R/V Sagar Kanya' },
  'Kochi Harbor': { 'waterCenter': { 'lat': 9.9500, 'lng': 76.0500 }, 'spread': 0.02, 'vessel': 'R/V Sindhu Sadhana' },
  'Visakhapatnam Port': { 'waterCenter': { 'lat': 17.5500, 'lng': 83.4500 }, 'spread': 0.02, 'vessel': 'R/V Gaveshani' },
  'Jawaharlal Nehru Port': { 'waterCenter': { 'lat': 18.8000, 'lng': 72.8000 }, 'spread': 0.02, 'vessel': 'R/V Sagar Nidhi' },
  'Kolkata Port': { 'waterCenter': { 'lat': 21.3000, 'lng': 88.0000 }, 'spread': 0.02, 'vessel': 'R/V Sagar Manjusha' }, 
  'Paradip Port': { 'waterCenter': { 'lat': 20.1000, 'lng': 86.8500 }, 'spread': 0.02, 'vessel': 'R/V Anveshani' },
}

CATEGORIES = [
    {"type": "Crab-Pot", "risk": "LOW", "notes": "Requires manual clearance.", "base_risk": 0.1},
    {"type": "Maybe-Crab-Pot", "risk": "MEDIUM", "notes": "Requires manual clearance.", "base_risk": 0.4},
    {"type": "Ghost Net", "risk": "CRITICAL", "notes": "Requires manual clearance.", "base_risk": 0.95},
    {"type": "Debris (Metal)", "risk": "HIGH", "notes": "Requires manual clearance.", "base_risk": 0.7},
    {"type": "Debris (Plastic)", "risk": "MEDIUM", "notes": "Requires manual clearance.", "base_risk": 0.5},
]

def seed_all():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for name, data in HARBOURS.items():
            mission_id = str(uuid.uuid4())
            mission = Mission(
                id=mission_id,
                mission_id=name,
                name=f"{name} Survey",
                status="COMPLETED",
                source=data["vessel"],
                latitude=data["waterCenter"]["lat"],
                longitude=data["waterCenter"]["lng"],
                depth=random.uniform(10.0, 50.0),
                heading=random.uniform(0, 360),
                vessel_speed=random.uniform(2.0, 6.0),
                sonar_range=50.0,
                created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))
            )
            db.add(mission)
            db.commit()

            # Seed 5 to 15 anomalies per harbour
            num_anomalies = random.randint(5, 15)
            for i in range(num_anomalies):
                cat = random.choice(CATEGORIES)
                conf = random.uniform(0.75, 0.99)
                det_id = str(uuid.uuid4())
                lat = data["waterCenter"]["lat"] + random.uniform(-data["spread"], data["spread"])
                lng = data["waterCenter"]["lng"] + random.uniform(-data["spread"], data["spread"])
                depth = random.uniform(5.0, 40.0)
                
                det = Detection(
                    id=det_id,
                    mission_id=mission_id,
                    class_name=cat["type"],
                    confidence=conf,
                    bbox_x1=0, bbox_y1=0, bbox_x2=100, bbox_y2=100,
                    risk_score=cat["base_risk"],
                    risk_level=cat["risk"],
                    latitude=lat,
                    longitude=lng,
                    depth=depth,
                    status="NEW",
                    created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 5))
                )
                db.add(det)
                db.commit()

                prefix = "".join(filter(str.isalpha, name))[:3].upper()
                ano = Anomaly(
                    id=str(uuid.uuid4()),
                    anomaly_id=f"ANO-{prefix}-{i+100}-{random.randint(10,99)}",
                    mission_id=mission_id,
                    detection_id=det_id,
                    type=cat["type"],
                    confidence=conf,
                    risk_score=cat["base_risk"],
                    risk_level=cat["risk"],
                    latitude=lat,
                    longitude=lng,
                    depth=depth,
                    status="NEW",
                    explanation=f"GhostVision AI detected {cat['type']} near {name} with {conf*100:.1f}% confidence.",
                    notes=cat["notes"],
                    created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 5))
                )
                db.add(ano)
            db.commit()
        print("Successfully seeded GhostVision dataset for ALL harbours!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()

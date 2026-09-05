import os
import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.database import engine, Base, SessionLocal
from app.database.models import Mission, Detection, Anomaly

# The exact payload provided by the user
PAYLOAD = [
  {"id":"69dd35d7-c0c7-4e25-9aa4-605d2a69bf98","anomaly_id":"ANO-TBAY-100","mission_id":"b68294d6-d0ce-4ba7-bcdd-9e0b5f63f552","detection_id":"6cc4068d-f4ac-4f2a-bf1c-f133920364f7","type":"Shipwreck (Nordmeer)","confidence":0.98,"risk_score":0.95,"risk_level":"CRITICAL","latitude":45.136,"longitude":-83.1598,"depth":12.0,"status":"NEW","explanation":"Acoustic shadow indicates a large steel-hulled vessel approx 143m long. Heavy structural degradation evident. Strong geometric regularity with sharp right angles characteristic of manufactured hull plating.","notes":"Nordmeer was a German freighter that ran aground on Thunder Bay Island Shoal in 1966. Its shallow depth (40 ft) makes it highly susceptible to ice damage, which has significantly broken the wreck apart.","created_at":"2026-09-05T15:05:22.283856"},
  {"id":"21b70b12-d2d6-4a29-910f-f4b9bfb66af8","anomaly_id":"ANO-TBAY-101","mission_id":"b68294d6-d0ce-4ba7-bcdd-9e0b5f63f552","detection_id":"6fe0adba-6a89-46e7-8294-0a9c073b483f","type":"Shipwreck (Grecian)","confidence":0.96,"risk_score":0.85,"risk_level":"HIGH","latitude":44.9683,"longitude":-83.1999,"depth":30.0,"status":"NEW","explanation":"Sonar sweep reveals a massive contiguous structure with a distinct bow and stern separation. The midsection appears collapsed. Acoustic reflectivity suggests a steel bulk freighter.","notes":"Grecian sank in 1906 while being towed for repairs. It lies in about 100 feet of water. The site is notable for intact bow and stern sections, separated by a collapsed midship.","created_at":"2026-09-05T15:05:22.284846"},
  {"id":"b0ea64b9-f5df-4760-847d-98a9eeba4935","anomaly_id":"ANO-TBAY-102","mission_id":"b68294d6-d0ce-4ba7-bcdd-9e0b5f63f552","detection_id":"0fbadfac-1063-4017-b509-e00a87418273","type":"Shipwreck (Monohansett)","confidence":0.94,"risk_score":0.9,"risk_level":"HIGH","latitude":45.0333,"longitude":-83.1998,"depth":5.5,"status":"NEW","explanation":"Shallow water target showing fragmented linear features consistent with scattered wooden timbers. Fire damage is not directly visible via sonar but the scattered debris field matches historical accounts.","notes":"Monohansett was a wooden steam barge that burned and sank in 1907. Lying in just 18 feet of water, it is very accessible but heavily deteriorated.","created_at":"2026-09-05T15:05:22.285652"},
  {"id":"1adb8ff3-d782-4e1f-a4d8-f6364a585ac6","anomaly_id":"ANO-TBAY-103","mission_id":"b68294d6-d0ce-4ba7-bcdd-9e0b5f63f552","detection_id":"23faebca-97e9-4312-8d27-8e0a39af6c99","type":"Shipwreck (Defiance)","confidence":0.99,"risk_score":0.7,"risk_level":"MEDIUM","latitude":45.2343,"longitude":-83.2785,"depth":56.4,"status":"NEW","explanation":"Exceptionally well-preserved two-masted schooner profile detected. The hull is fully intact with masts reportedly still standing, casting long, sharp acoustic shadows.","notes":"Sank in 1854 following a collision in fog. Resting in 185 feet of water, it is one of the most remarkably intact wooden schooner shipwrecks in the world.","created_at":"2026-09-05T15:05:22.286320"},
  {"id":"0d4f0657-243f-464d-aca3-f08d24681bd5","anomaly_id":"ANO-TBAY-104","mission_id":"b68294d6-d0ce-4ba7-bcdd-9e0b5f63f552","detection_id":"0f5434c0-6e9f-474c-b48d-e5245a260e9e","type":"Shipwreck (John J. Audubon)","confidence":0.97,"risk_score":0.75,"risk_level":"MEDIUM","latitude":45.2889,"longitude":-83.3392,"depth":51.8,"status":"NEW","explanation":"Target shows a complete brigantine hull with a large gash amidships, consistent with collision damage. Debris scatter is minimal, localized near the point of impact.","notes":"Sank in 1854 in the same collision event as the Defiance. The vessel is mostly intact at 170 feet depth, serving as a pristine time capsule.","created_at":"2026-09-05T15:05:22.286807"},
  {"id":"0f6842dd-910f-45c2-9b28-d6fe85034e33","anomaly_id":"ANO-JN-100","mission_id":"ee9eca97-1613-4129-9d03-7c7358ea00cb","detection_id":"9e427cbc-df57-4ca1-a179-acdb6bed9f2b","type":"Crab-Pot","confidence":0.8647526370014863,"risk_score":0.1,"risk_level":"LOW","latitude":18.94576256811293,"longitude":72.92916903554983,"depth":16.902531225335984,"status":"NEW","explanation":"GhostVision AI detected Crab-Pot near JN Port with 86.5% confidence.","notes":"Requires manual clearance.","created_at":"2026-09-05T15:07:52.546693"},
  {"id":"6b68379b-5734-48a5-a34a-5872513a9a84","anomaly_id":"ANO-JN-101","mission_id":"ee9eca97-1613-4129-9d03-7c7358ea00cb","detection_id":"18291d98-12ce-4b8f-a8ee-6de9c4001c8f","type":"Ghost Net","confidence":0.7676346301854572,"risk_score":0.85,"risk_level":"CRITICAL","latitude":18.93093807754745,"longitude":72.92880315549337,"depth":18.024557578916884,"status":"NEW","explanation":"GhostVision AI detected Ghost Net near JN Port with 76.8% confidence.","notes":"Requires manual clearance.","created_at":"2026-09-05T15:07:52.547564"},
  {"id":"77a04c34-2a05-4205-9eaa-43fc88c08bdf","anomaly_id":"ANO-JN-102","mission_id":"ee9eca97-1613-4129-9d03-7c7358ea00cb","detection_id":"775009aa-1c16-44d4-8519-c56ad42f67d0","type":"Maybe-Crab-Pot","confidence":0.7863507234359223,"risk_score":0.4,"risk_level":"MEDIUM","latitude":18.93550354301805,"longitude":72.93710973874539,"depth":29.283855023494908,"status":"NEW","explanation":"GhostVision AI detected Maybe-Crab-Pot near JN Port with 78.6% confidence.","notes":"Requires manual clearance.","created_at":"2026-09-05T15:07:52.548460"},
  {"id":"f4b2ba94-3cdb-4b2a-a0b5-60129d2d9c26","anomaly_id":"ANO-JN-103","mission_id":"ee9eca97-1613-4129-9d03-7c7358ea00cb","detection_id":"56d34114-28ec-44a5-ac56-b9efb145ea2f","type":"Debris (Metal)","confidence":0.9398481443899149,"risk_score":0.7,"risk_level":"HIGH","latitude":18.93829537933954,"longitude":72.93799993615335,"depth":25.29062696224052,"status":"NEW","explanation":"GhostVision AI detected Debris (Metal) near JN Port with 94.0% confidence.","notes":"Requires manual clearance.","created_at":"2026-09-05T15:07:52.549271"},
  {"id":"dde3e96b-a0bf-46e4-817f-485819d6465e","anomaly_id":"ANO-JN-104","mission_id":"ee9eca97-1613-4129-9d03-7c7358ea00cb","detection_id":"60217710-b416-4b30-a527-25ff1a92bb6e","type":"Ghost Net","confidence":0.9513918731155815,"risk_score":0.95,"risk_level":"CRITICAL","latitude":18.949361944278486,"longitude":72.9263137808364,"depth":20.409101558919748,"status":"NEW","explanation":"GhostVision AI detected Ghost Net near JN Port with 95.1% confidence.","notes":"Requires manual clearance.","created_at":"2026-09-05T15:07:52.550558"},
  {"id":"abaa7997-31e4-4170-ac4d-2bf579bc418c","anomaly_id":"ANO-JN-105","mission_id":"ee9eca97-1613-4129-9d03-7c7358ea00cb","detection_id":"0670d541-7530-4ce3-8f0c-f780910c185b","type":"Crab-Pot","confidence":0.8935209053581886,"risk_score":0.15,"risk_level":"LOW","latitude":18.934365313533156,"longitude":72.92515182999401,"depth":10.410175199028416,"status":"NEW","explanation":"GhostVision AI detected Crab-Pot near JN Port with 89.4% confidence.","notes":"Requires manual clearance.","created_at":"2026-09-05T15:07:52.551274"},
  {"id":"919b9b14-88d0-46d1-b38a-d68668273a08","anomaly_id":"ANO-JN-106","mission_id":"ee9eca97-1613-4129-9d03-7c7358ea00cb","detection_id":"dcf1dc19-3bb6-4847-b0b2-e451506683e6","type":"Debris (Plastic)","confidence":0.8659863698938814,"risk_score":0.5,"risk_level":"MEDIUM","latitude":18.935846153078842,"longitude":72.93862202644074,"depth":24.060109130042115,"status":"NEW","explanation":"GhostVision AI detected Debris (Plastic) near JN Port with 86.6% confidence.","notes":"Requires manual clearance.","created_at":"2026-09-05T15:07:52.551724"}
]

def seed_exact_anomalies():
    print("Initializing Database Tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Clear out old entries for a clean run if necessary
        # We will just ensure the parent missions exist, and if they don't, create them.
        
        # Mission 1: Jawaharlal Nehru Port Survey
        mission_jn = db.query(Mission).filter_by(id="ee9eca97-1613-4129-9d03-7c7358ea00cb").first()
        if not mission_jn:
            mission_jn = Mission(
                id="ee9eca97-1613-4129-9d03-7c7358ea00cb",
                mission_id="Jawaharlal Nehru Port",
                name="Jawaharlal Nehru Port Survey",
                status="COMPLETED",
                source="GhostVision AUV",
                latitude=18.9500,
                longitude=72.9500,
                depth=25.0,
                heading=90.0,
                vessel_speed=4.5,
                sonar_range=50.0,
                created_at=datetime.utcnow()
            )
            db.add(mission_jn)

        # Mission 2: Thunder Bay Sanctuary Survey
        mission_tb = db.query(Mission).filter_by(id="b68294d6-d0ce-4ba7-bcdd-9e0b5f63f552").first()
        if not mission_tb:
            mission_tb = Mission(
                id="b68294d6-d0ce-4ba7-bcdd-9e0b5f63f552",
                mission_id="Thunder Bay",
                name="Thunder Bay Sanctuary Survey",
                status="COMPLETED",
                source="AUV Iver3 (AI4Shipwrecks)",
                latitude=45.1360,
                longitude=-83.1598,
                depth=30.0,
                heading=0.0,
                vessel_speed=3.0,
                sonar_range=50.0,
                created_at=datetime.utcnow()
            )
            db.add(mission_tb)
            
        db.commit()

        # Seed the exact payload
        for entry in PAYLOAD:
            # Check if anomaly exists by anomaly_id
            existing = db.query(Anomaly).filter_by(anomaly_id=entry["anomaly_id"]).first()
            if not existing:
                # We need a detection to map to since anomaly has foreign key detection_id
                det = db.query(Detection).filter_by(id=entry["detection_id"]).first()
                if not det:
                    det = Detection(
                        id=entry["detection_id"],
                        mission_id=entry["mission_id"],
                        class_name=entry["type"],
                        confidence=entry["confidence"],
                        bbox_x1=0, bbox_y1=0, bbox_x2=100, bbox_y2=100, # Mocked
                        risk_score=entry["risk_score"],
                        risk_level=entry["risk_level"],
                        latitude=entry["latitude"],
                        longitude=entry["longitude"],
                        depth=entry["depth"],
                        status=entry["status"],
                        created_at=datetime.fromisoformat(entry["created_at"])
                    )
                    db.add(det)
                    db.commit()

                ano = Anomaly(
                    id=entry["id"],
                    anomaly_id=entry["anomaly_id"],
                    mission_id=entry["mission_id"],
                    detection_id=entry["detection_id"],
                    type=entry["type"],
                    confidence=entry["confidence"],
                    risk_score=entry["risk_score"],
                    risk_level=entry["risk_level"],
                    latitude=entry["latitude"],
                    longitude=entry["longitude"],
                    depth=entry["depth"],
                    status=entry["status"],
                    explanation=entry["explanation"],
                    notes=entry["notes"],
                    created_at=datetime.fromisoformat(entry["created_at"])
                )
                db.add(ano)
        
        db.commit()
        print("Successfully seeded EXACT dataset into test.db (SQLite)!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_exact_anomalies()

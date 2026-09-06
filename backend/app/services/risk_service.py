from app.database.models import Detection

class RiskService:
    def calculate_risk(self, detection: Detection, seabed_nature: str = "unknown") -> dict:
        score = 0.0
        score += (detection.confidence * 50)
        
        class_weights = {
            "ghost_net": 30,
            "fishing_gear": 25,
            "metal_debris": 15,
            "unknown_man_made_object": 10,
            "plastic": 20,
            "tyres": 15,
            "nets": 30,
            "metal": 15,
            "Crab-Pot": 20,
            "Maybe-Crab-Pot": 10
        }
        
        effective_class = getattr(detection, "debris_classification", detection.class_name)
        score += class_weights.get(effective_class, 5)
        
        area = detection.area or 1000
        size_factor = min(20, (area / 50000) * 20)
        score += size_factor
        
        if seabed_nature == "sandy":
            score = score * 1.2
        elif seabed_nature == "rocky":
            score = score * 0.8
            
        score = min(100.0, score)
        
        if score < 25:
            level = "LOW"
        elif score < 50:
            level = "MEDIUM"
        elif score < 75:
            level = "HIGH"
        else:
            level = "CRITICAL"
            
        factors = {
            "confidence_contribution": round(detection.confidence * 50, 1),
            "class_contribution": class_weights.get(effective_class, 5),
            "size_contribution": round(size_factor, 1),
            "seabed_nature_adjusted": seabed_nature
        }
        
        return {
            "risk_score": round(score, 1),
            "risk_level": level,
            "risk_factors": factors
        }

from app.database.models import Detection

class RiskService:
    def calculate_risk(self, detection: Detection) -> dict:
        """
        Prototype risk scoring
        Weights: Confidence (50%), Class (30%), Size (20%)
        """
        score = 0.0
        
        # Confidence factor (0 to 50)
        score += (detection.confidence * 50)
        
        # Class factor (0 to 30)
        class_weights = {
            "ghost_net": 30,
            "fishing_gear": 25,
            "metal_debris": 15,
            "unknown_man_made_object": 10
        }
        score += class_weights.get(detection.class_name, 5)
        
        # Size factor (0 to 20) - Assuming typical image size of ~1000x1000, max area ~1,000,000
        # If area is None, use a default
        area = detection.area or 1000
        size_factor = min(20, (area / 50000) * 20)
        score += size_factor
        
        # Cap at 100
        score = min(100.0, score)
        
        # Determine level
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
            "class_contribution": class_weights.get(detection.class_name, 5),
            "size_contribution": round(size_factor, 1)
        }
        
        return {
            "risk_score": round(score, 1),
            "risk_level": level,
            "risk_factors": factors
        }

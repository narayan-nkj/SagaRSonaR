from typing import List, Dict, Any
from app.database.models import Detection
from app.core.config import get_settings

settings = get_settings()

def compute_iou(box1: Detection, box2: Detection) -> float:
    # box: (x1, y1, x2, y2)
    x_left = max(box1.bbox_x1, box2.bbox_x1)
    y_top = max(box1.bbox_y1, box2.bbox_y1)
    x_right = min(box1.bbox_x2, box2.bbox_x2)
    y_bottom = min(box1.bbox_y2, box2.bbox_y2)

    if x_right < x_left or y_bottom < y_top:
        return 0.0

    intersection_area = (x_right - x_left) * (y_bottom - y_top)
    box1_area = (box1.bbox_x2 - box1.bbox_x1) * (box1.bbox_y2 - box1.bbox_y1)
    box2_area = (box2.bbox_x2 - box2.bbox_x1) * (box2.bbox_y2 - box2.bbox_y1)

    iou = intersection_area / float(box1_area + box2_area - intersection_area)
    return iou

class FilteringService:
    def __init__(self, confidence_threshold: float = settings.CONFIDENCE_THRESHOLD):
        self.conf_thresh = confidence_threshold

    def filter_detections(self, detections: List[Detection]) -> Dict[str, Any]:
        accepted = []
        rejected = []

        # 1. Confidence filter
        for d in detections:
            if d.confidence < self.conf_thresh:
                rejected.append({"detection": d, "reason": "confidence_below_threshold"})
            else:
                accepted.append(d)

        # 2. Simple NMS (Non-Maximum Suppression)
        # Sort by confidence
        accepted = sorted(accepted, key=lambda x: x.confidence, reverse=True)
        final_accepted = []
        
        for d in accepted:
            discard = False
            for keep_d in final_accepted:
                if compute_iou(d, keep_d) > 0.5: # 50% overlap threshold
                    discard = True
                    break
            
            if discard:
                rejected.append({"detection": d, "reason": "high_overlap_nms"})
            else:
                final_accepted.append(d)

        return {
            "accepted": final_accepted,
            "rejected": rejected
        }

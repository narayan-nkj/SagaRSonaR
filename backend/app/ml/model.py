import onnxruntime as ort
import numpy as np
import uuid
import random

class DetectorService:
    def __init__(self, model_path="models/sonar_detector.onnx", alpha=0.7, noise_filter_pred_cnt=3):
        self.model_path = model_path
        self.alpha = alpha
        self.noise_filter_pred_cnt = noise_filter_pred_cnt
        self.session = ort.InferenceSession(self.model_path, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name
        
        self.labels = {
            0: "Crab-Pot",
            1: "Maybe-Crab-Pot"
        }
        
        self.temporal_state = {}

    def analyze_seabed(self, sss_image: np.ndarray) -> str:
        if sss_image is None:
            return "unknown"
        gray = np.mean(sss_image, axis=2) if len(sss_image.shape) == 3 else sss_image
        variance = np.var(gray)
        if variance > 2000:
            return "rocky"
        elif variance > 500:
            return "sandy"
        else:
            return "muddy"

    def classify_optical(self, optical_image: np.ndarray) -> str:
        debris_classes = ["plastic", "tyres", "nets", "metal"]
        return random.choice(debris_classes)

    def _calculate_iou(self, box1, box2):
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        inter_area = max(0, x2 - x1) * max(0, y2 - y1)
        
        box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
        box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union_area = box1_area + box2_area - inter_area
        
        return inter_area / union_area if union_area > 0 else 0

    def postprocess(self, output_data, confidence_threshold=0.45):
        raw_detections = []
        for row in output_data:
            scores = row[4:6]
            if len(scores) == 0:
                continue
                
            cls_idx = int(np.argmax(scores))
            conf = float(scores[cls_idx])
            
            if conf > confidence_threshold:
                cx, cy, w, h = row[0:4]
                x1 = cx - (w / 2)
                y1 = cy - (h / 2)
                x2 = cx + (w / 2)
                y2 = cy + (h / 2)
                
                raw_detections.append({
                    "bbox": [float(x1), float(y1), float(x2), float(y2)],
                    "confidence": conf,
                    "label": self.labels.get(cls_idx, "Maybe-Crab-Pot")
                })
                
        final_detections = []
        new_state = {}
        
        for det in raw_detections:
            matched_id = None
            best_iou = 0.4
            
            for obj_id, state in self.temporal_state.items():
                iou = self._calculate_iou(det["bbox"], state["bbox"])
                if iou > best_iou:
                    best_iou = iou
                    matched_id = obj_id
                    
            if matched_id is not None:
                prev_state = self.temporal_state[matched_id]
                new_pred_cnt = prev_state["pred_cnt"] + 1
                
                combined_conf = (self.alpha * det["confidence"]) + ((1 - self.alpha) * prev_state["conf"])
                
                final_label = "Crab-Pot" if combined_conf > 0.75 else "Maybe-Crab-Pot"
                
                new_state[matched_id] = {
                    "bbox": det["bbox"],
                    "conf": combined_conf,
                    "pred_cnt": new_pred_cnt,
                    "label": final_label
                }
                
                if new_pred_cnt >= self.noise_filter_pred_cnt:
                    final_detections.append({
                        "label": final_label,
                        "confidence": combined_conf,
                        "bbox": det["bbox"]
                    })
            else:
                new_id = str(uuid.uuid4())
                new_state[new_id] = {
                    "bbox": det["bbox"],
                    "conf": det["confidence"],
                    "pred_cnt": 1,
                    "label": det["label"]
                }
                
        self.temporal_state = new_state
        return final_detections

    def infer(self, img_tensor, ping_timestamp=None, sss_image=None, optical_image=None):
        outputs = self.session.run(None, {self.input_name: img_tensor})
        output = outputs[0][0].T 
        
        detections = self.postprocess(output)
        
        seabed_nature = "unknown"
        if sss_image is not None:
            seabed_nature = self.analyze_seabed(sss_image)

        debris_classification = None
        if optical_image is not None:
            debris_classification = self.classify_optical(optical_image)
            for det in detections:
                det["debris_classification"] = debris_classification
        
        return {
            "status": "success",
            "ping_timestamp": ping_timestamp,
            "detections": detections,
            "seabed_nature": seabed_nature
        }

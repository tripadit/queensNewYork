from ultralytics import YOLO
import cv2

class DetectionService:
    def __init__(self, model_path="yolo11n.pt"):
        # Load YOLOv11 model
        # It will automatically download weights if not found
        self.model = YOLO(model_path)

    def detect_and_track(self, frame, conf_threshold=0.5):
        """
        Run YOLOv11 detection and ByteTrack tracking.
        Returns a list of dicts: {'id': int, 'bbox': [x1, y1, x2, y2], 'class': str}
        Only returns 'person' class (class_id=0).
        """
        # Run tracking
        # persist=True is important for tracking to work across frames
        results = self.model.track(
            source=frame,
            persist=True,
            tracker="bytetrack.yaml",
            conf=conf_threshold,
            classes=[0],  # Filter for 'person' class only
            verbose=False
        )

        detections = []
        if results and results[0].boxes:
            boxes = results[0].boxes
            for box in boxes:
                # Check if we have a track ID (might be None for first frame or lost tracks)
                if box.id is not None:
                    track_id = int(box.id.item())
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    cls_id = int(box.cls.item())
                    
                    detections.append({
                        "id": track_id,
                        "bbox": [int(x1), int(y1), int(x2), int(y2)],
                        "class": "person"
                    })
        
        return detections

detection_service = DetectionService()

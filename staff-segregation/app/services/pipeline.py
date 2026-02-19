import cv2
import time
from app.services.detection import detection_service
from app.services.recognition import recognition_service
from app.core.database import db

class PipelineService:
    def __init__(self):
        # Cache for track IDs processed: {track_id: {'label': str, 'name': str}}
        self.track_cache = {}
        # Set of IDs that have been processed for face recognition to avoid re-running every frame
        self.processed_ids = set()
        # Storage for latest annotated frame for streaming
        self.latest_frame = None
        # Stats for current frame
        self.current_stats = {"Staff": 0, "Customer": 0, "Unknown": 0}

    def process_frame(self, frame):
        if frame is None:
            return None

        # Detect and Track
        detections = detection_service.detect_and_track(frame)
        
        annotated_frame = frame.copy()
        
        current_frame_ids = set()
        
        # Reset stats for this frame
        stats = {"Staff": 0, "Customer": 0, "Unknown": 0}

        for det in detections:
            track_id = det['id']
            bbox = det['bbox']
            current_frame_ids.add(track_id)
            
            # If new ID, run recognition
            if track_id not in self.processed_ids:
                x1, y1, x2, y2 = bbox
                # Ensure coordinates are within frame bounds
                h, w, _ = frame.shape
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)
                
                if x2 > x1 and y2 > y1:
                    face_crop = frame[y1:y2, x1:x2]
                    
                    # Get embedding
                    embedding = recognition_service.get_embedding(face_crop)
                    print(f"DEBUG: Track ID {track_id} - Embedding extracted: {embedding is not None}")
                    
                    if embedding:
                        label, name = recognition_service.identify_person(embedding)
                        self.track_cache[track_id] = {'label': label, 'name': name}
                        
                        # Log to DB
                        self.log_detection(track_id, label)
                    else:
                        # Could not detect face/embedding, maybe back of head
                        pass
                
                # Setup retry logic or just mark as processed after success
                if track_id in self.track_cache:
                    self.processed_ids.add(track_id)
            
            # Draw annotation
            label_info = self.track_cache.get(track_id, {'label': 'Unknown', 'name': None})
            label_text = f"ID: {track_id} | {label_info['label']}"
            if label_info['name']:
                label_text += f" ({label_info['name']})"
            
            # Update stats
            stats[label_info['label']] += 1
            
            color = (0, 255, 0) if label_info['label'] == 'Staff' else (0, 0, 255)
            
            cv2.rectangle(annotated_frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), color, 2)
            cv2.putText(annotated_frame, label_text, (bbox[0], bbox[1] - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # Optional: Clean up cache for IDs no longer in frame (or keep for sometime)
        # self.cleanup_cache(current_frame_ids)
        
        self.latest_frame = annotated_frame
        self.current_stats = stats

        return annotated_frame

    def get_active_stats(self):
        return self.current_stats

    def log_detection(self, track_id, label):
        query = """
        INSERT INTO detections_log (tracking_id, label, confidence)
        VALUES (%s, %s, %s);
        """
        # Confidence is not strictly available from recognition decision (it's binary threshold), 
        # but we could store the distance if we changed the logic. For now use dummy confidence 1.0.
        try:
            with db.get_cursor() as cursor:
                cursor.execute(query, (track_id, label, 1.0))
        except Exception as e:
            print(f"Error logging detection: {e}")

    def reset(self):
        """Clear all tracking state"""
        self.track_cache = {}
        self.processed_ids = set()
        self.current_stats = {"Staff": 0, "Customer": 0, "Unknown": 0}
        self.latest_frame = None

pipeline_service = PipelineService()

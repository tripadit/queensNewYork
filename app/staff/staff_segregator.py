import cv2
import time
import numpy as np
from sqlalchemy import select, text
from app.db import StaffProfile, DetectionsLog
from app.core.database import SessionLocal
from app.face.insightface_embedder import InsightFaceEmbedder
from app.video.face_buffer import FaceBuffer
from ultralytics import YOLO

class StaffSegregator:
    def __init__(self, observe_seconds=2.0):
        self.detector = YOLO("yolo11n.pt").to("cpu")
        self.embedder = InsightFaceEmbedder()
        self.face_buffer = FaceBuffer(observe_seconds=observe_seconds)
        
        # Cache for track IDs processed: {track_id: {'label': str, 'name': str}}
        self.track_cache = {}
        # Set of IDs that have been fully identified to avoid re-running recognition
        self.identified_ids = set()
        
        # Latest stats for the dashboard
        self.current_stats = {"Staff": 0, "Customer": 0, "Unknown": 0}

    def get_embedding(self, face_image):
        """
        Extract 512-d embedding from face image using InsightFace.
        """
        try:
            embedding, confidence = self.embedder.extract(face_image)
            if embedding is not None:
                return embedding.tolist()
            return None
        except Exception as e:
            return None

    def identify_person(self, embedding, session, threshold=0.45):
        """
        Identify person from embedding using DB search.
        Returns: (label, name)
        """
        if embedding is None:
            return "Customer", None

        query = text("""
            SELECT name, embedding <=> CAST(:emb AS vector) AS distance
            FROM staff_profiles
            ORDER BY distance ASC
            LIMIT 1;
        """)
        
        try:
            result = session.execute(query, {"emb": embedding}).fetchone()
            if result:
                name, distance = result
                if distance < threshold:
                    return "Staff", name
            else:
                pass
        except Exception as e:
            print(f"[StaffSegregator] Error identifying person: {e}")

        return "Customer", None

    def process(self, frame):
        if frame is None:
            return

        # Detect and Track using YOLOv11 built-in tracker
        results = self.detector.track(
            source=frame,
            persist=True,
            tracker="bytetrack.yaml",
            conf=0.5,
            classes=[0],  # person only
            verbose=False
        )
        
        stats = {"Staff": 0, "Customer": 0, "Unknown": 0}
        session = SessionLocal()

        if results and results[0].boxes:
            for box in results[0].boxes:
                if box.id is not None:
                    track_id = int(box.id.item())
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    
                    # 1. If already identified, just use the cached result
                    if track_id in self.identified_ids:
                        res = self.track_cache.get(track_id, {"label": "Customer", "name": None})
                        stats[res["label"]] += 1
                        continue

                    # 2. Otherwise, crop the face and calculate quality score
                    # Ensure coordinates are within frame
                    h, w = frame.shape[:2]
                    t, b, l, r = max(0, y1), min(h, y2), max(0, x1), min(w, x2)
                    crop = frame[t:b, l:r]
                    
                    if crop.size == 0:
                        continue

                    # Get quality score (face detection confidence)
                    score = self.embedder.detect_only(crop)

                    # 3. Update the face buffer (Observe for X seconds)
                    # We use a min_score of 0.4 to ensure we only identify on clear faces
                    best_face = self.face_buffer.update(track_id, crop, score, min_score=0.4)

                    # 4. If buffer returns a "Best Face", identify the person
                    if best_face is not None:
                        embedding = self.get_embedding(best_face)
                        label, name = self.identify_person(embedding, session)
                        
                        # Cache the result
                        self.track_cache[track_id] = {"label": label, "name": name}
                        self.identified_ids.add(track_id)
                        
                        # Log the detection to the DB ONCE
                        self.log_detection(track_id, label, session)
                        stats[label] += 1
                        print(f"[StaffSegregator] ID {track_id} identified as {label} ({name or 'N/A'})")
                    else:
                        # Still observing or quality too low
                        stats["Unknown"] += 1

        self.current_stats = stats
        session.close()

    def log_detection(self, track_id, label, session):
        """Log the result to the database."""
        try:
            log = DetectionsLog(tracking_id=track_id, label=label, confidence=1)
            session.add(log)
            session.commit()
        except Exception as e:
            print(f"[StaffSegregator] DB Log Error: {e}")

    def get_stats(self):
        return self.current_stats

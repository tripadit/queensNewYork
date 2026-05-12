"""
Main video pipeline:
YOLO11 → DeepSort → Face capture → Identity logic → Handover → Loitering
"""

import cv2
import numpy as np
import time
from datetime import datetime
from deep_sort_realtime.deepsort_tracker import DeepSort
from app.core.models import registry
from app.face.insightface_embedder import InsightFaceEmbedder
from app.face.age_gender_predictor import AgeGenderPredictor
from app.video.face_buffer import FaceBuffer
from app.services.identity_manager import IdentityManager
from app.services.handover_manager import handover_manager
from app.services.loitering_service import loitering_service
from app.core.config import HANDOVER_CONFIG, LOITERING_THRESHOLD_SECONDS
from app.db import DetectionsLog

from sqlalchemy import text
from app.core.database import SessionLocal
from shapely.geometry import Point, Polygon

class VideoProcessor:

    def __init__(self, channel_id: str = "1"):
        self.channel_id = channel_id
        self.detector = registry.yolo_person
        self.tracker = DeepSort(max_age=15)
        self.embedder = InsightFaceEmbedder()
        self.age_gender_predictor = AgeGenderPredictor()
        self.face_buffer = FaceBuffer()
        self.identity_manager = IdentityManager()
        self.confidence_threshold = 0.45  
        
        # Staff segregation state
        self.track_cache = {} # track_id: {'label': str, 'name': str, 'embedding': np.array, 'face_img': img}
        self.logged_tracks = set() # track_id set to avoid duplicate logs
        self.current_stats = {"Staff": 0, "Customer": 0, "Unknown": 0}
        
        # Handover & Loitering state
        self.prev_track_ids = set()
        self.active_tracks_data = {} # track_id: {data, last_ltrb, in_exit_zone, loitering_start, loitering_log_id}
        
        # Initialize zones
        self.entry_zones = []
        self.exit_zones = []
        self.loitering_zones = []
        self._load_zones()

    def _load_zones(self):
        config = HANDOVER_CONFIG.get(self.channel_id, {})
        # Entry/Exit Zones
        for ez in config.get("entry_zones", []):
            if len(ez["polygon"]) >= 3:
                self.entry_zones.append({
                    "id": ez["id"],
                    "polygon": Polygon(ez["polygon"]),
                    "sources": ez.get("sources", [])
                })
        for exz in config.get("exit_zones", []):
            if len(exz["polygon"]) >= 3:
                self.exit_zones.append({
                    "id": exz["id"],
                    "polygon": Polygon(exz["polygon"])
                })
        # Loitering Zones
        for lz in config.get("loitering_zones", []):
            if len(lz["polygon"]) >= 3:
                self.loitering_zones.append({
                    "id": lz["id"],
                    "polygon": Polygon(lz["polygon"])
                })
        print(f"[VideoProcessor-{self.channel_id}] Zones: {len(self.entry_zones)} Entry, {len(self.exit_zones)} Exit, {len(self.loitering_zones)} Loitering.")

    def _get_bottom_center(self, ltrb):
        l, t, r, b = ltrb
        return Point((l + r) / 2.0, b)

    def identify_as_staff(self, embedding, threshold=0.45):
        if embedding is None: return "Customer", None
        session = SessionLocal()
        query = text("SELECT name, embedding <=> CAST(:emb AS vector) AS distance FROM staff_profiles ORDER BY distance ASC LIMIT 1;")
        try:
            result = session.execute(query, {"emb": embedding.tolist()}).fetchone()
            if result:
                name, distance = result
                if distance < threshold:
                    session.close()
                    return "Staff", name
        except Exception as e:
            print(f"[VideoProcessor-Staff] DB Error: {e}")
        finally:
            session.close()
        return "Customer", None

    def log_detection(self, track_id, label):
        """Log the result to the database asynchronously."""
        from app.core.db_worker import db_worker
        print(f"[VideoProcessor] Queuing log_detection for track {track_id} as {label}")
        def _logic():
            try:
                session = SessionLocal()
                log = DetectionsLog(channel_id=self.channel_id, tracking_id=track_id, label=label, confidence=1)
                session.add(log)
                session.commit()
                session.close()
                print(f"[VideoProcessor] log_detection SUCCESS for track {track_id}")
            except Exception as e:
                print(f"[VideoProcessor-Log] DB Log Error: {e}")
        db_worker.submit(_logic)

    def get_embedding(self, face_image):
        """
        Extract 512-d embedding from face image using InsightFace.
        """
        try:
            embedding, confidence = self.embedder.extract(face_image)
            if embedding is not None:
                return embedding # Return as numpy array for consistency
            return None
        except Exception as e:
            print(f"[VideoProcessor-Emb] Error: {e}")
            return None

    def process(self, frame):
        detections = []
        stats = {"Staff": 0, "Customer": 0, "Unknown": 0}
        now_ts = time.time()

        results = self.detector(frame)[0]
        for box in results.boxes:
            if int(box.cls) == 0 and box.conf.item() >= self.confidence_threshold:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                detections.append(([x1, y1, x2-x1, y2-y1], box.conf.item(), "person"))

        tracks = self.tracker.update_tracks(detections, frame=frame)
        current_track_ids = set()

        # Draw zones (Visual feedback)
        self._draw_overlay(frame)

        for track in tracks:
            # Only count tracks that have been seen consistently and are active
            if not track.is_confirmed() or track.time_since_update > 1:
                continue
            
            # Require a minimum hit streak to avoid ghost tracks
            if track.hits < 2:
                continue
                
            track_id = track.track_id
            current_track_ids.add(track_id)
            ltrb = track.to_ltrb()
            bottom_pt = self._get_bottom_center(ltrb)

            # 1. --- Handover Match (Entry) ---
            if track_id not in self.track_cache:
                for ez in self.entry_zones:
                    if ez["polygon"].contains(bottom_pt):
                        match = handover_manager.find_match(self.channel_id, ez["id"], ez["sources"])
                        if match:
                            print(f"[VideoProcessor-{self.channel_id}] Handover: Instant identity for track {track_id} -> {match.get('name', 'Customer')}")
                            self.track_cache[track_id] = match
                            # Inherit loitering state
                            if match.get("loitering_start_time"):
                                self.active_tracks_data[track_id] = {
                                    "loitering_start": match["loitering_start_time"],
                                    "loitering_log_id": match["loitering_log_id"]
                                }
                            if match["label"] == "Customer":
                                self.identity_manager.resolve_customer(match["embedding"], track_id=track_id)
                            break

            # 2. --- Loitering Logic ---
            in_loiter_zone = False
            for lz in self.loitering_zones:
                if lz["polygon"].contains(bottom_pt):
                    in_loiter_zone = True
                    # Initialize or Update Loitering
                    if track_id not in self.active_tracks_data:
                        self.active_tracks_data[track_id] = {}
                    
                    data = self.active_tracks_data[track_id]
                    if "loitering_start" not in data or data["loitering_start"] is None:
                        data["loitering_start"] = now_ts
                        # Async start DB log
                        def _set_log_id(lid): data["loitering_log_id"] = lid
                        loitering_service.start_event(track_id, self.channel_id, datetime.utcnow(), callback=_set_log_id)
                    
                    elapsed = now_ts - data["loitering_start"]
                    is_alert = elapsed >= LOITERING_THRESHOLD_SECONDS
                    
                    # Update DB (throttled to every 5 seconds to reduce load)
                    if int(elapsed) % 5 == 0 and "loitering_log_id" in data:
                        loitering_service.update_event(data["loitering_log_id"], elapsed, is_alert)
                    
                    # Draw visual timer
                    self._draw_loiter_info(frame, ltrb, elapsed, is_alert)
                    break
            
            # If they left the loitering zone but are still in frame
            if not in_loiter_zone and track_id in self.active_tracks_data:
                data = self.active_tracks_data[track_id]
                if data.get("loitering_start"):
                    elapsed = now_ts - data["loitering_start"]
                    if data.get("loitering_log_id"):
                        loitering_service.end_event(data["loitering_log_id"], elapsed, status="moved")
                    data["loitering_start"] = None
                    data["loitering_log_id"] = None

            # 3. --- Identity / Stats ---
            if track_id in self.track_cache:
                label = self.track_cache[track_id]['label']
                stats[label] += 1
                if track_id not in self.active_tracks_data: self.active_tracks_data[track_id] = {}
                self.active_tracks_data[track_id].update({
                    "data": self.track_cache[track_id],
                    "in_exit_zone": next((exz["id"] for exz in self.exit_zones if exz["polygon"].contains(bottom_pt)), None)
                })
            else:
                stats["Unknown"] += 1
                if track_id not in self.logged_tracks:
                    self.log_detection(track_id, "Unknown")
                    self.identity_manager.register_anonymous_sighting(track_id)
                    self.logged_tracks.add(track_id)

            # 4. --- Face Processing (if needed) ---
            if track_id not in self.track_cache:
                l, t, r, b = map(int, ltrb)
                # Ensure crop is within frame boundaries
                h, w = frame.shape[:2]
                l, t, r, b = max(0, l), max(0, t), min(w, r), min(h, b)
                crop = frame[t:b, l:r]
                
                if crop.size > 0 and (b-t) > 20 and (r-l) > 20:
                    try:
                        score = self.embedder.detect_only(crop)
                        
                        best_face = self.face_buffer.update(track_id, crop, score, min_score=0.25)
                        if best_face:
                            embedding, conf = self.embedder.extract(best_face)
                            if embedding is not None:
                                label, name = self.identify_as_staff(embedding)
                                person_data = {"label": label, "name": name, "embedding": embedding, "face_img": best_face}
                                self.track_cache[track_id] = person_data
                                
                                # Log detection to DB (ONLY ONCE per track)
                                if track_id not in self.logged_tracks:
                                    self.log_detection(track_id, label)
                                    self.logged_tracks.add(track_id)

                                if label == "Customer":
                                    gender_age = self.age_gender_predictor.predict(best_face)
                                    self.identity_manager.resolve_customer(embedding, gender_age, track_id=track_id)
                    except Exception as e:
                        print(f"[VideoProcessor-FaceError] Track {track_id}: {e}")

        # --- Handover Registration (Exit) ---
        gone_ids = self.prev_track_ids - current_track_ids
        for gid in gone_ids:
            if gid in self.active_tracks_data:
                info = self.active_tracks_data[gid]
                if info.get("in_exit_zone") and info.get("data"):
                    handover_manager.register_exit(
                        info["data"], self.channel_id, info["in_exit_zone"],
                        loitering_start_time=info.get("loitering_start"),
                        loitering_log_id=info.get("loitering_log_id")
                    )
                # Finalize loitering log if they vanished
                if info.get("loitering_log_id"):
                    elapsed = now_ts - info["loitering_start"]
                    loitering_service.end_event(info["loitering_log_id"], elapsed, status="left")
                del self.active_tracks_data[gid]
            if gid in self.track_cache: del self.track_cache[gid]
            if gid in self.logged_tracks: self.logged_tracks.remove(gid)

        self.prev_track_ids = current_track_ids
        self.current_stats = stats
        return frame

    def set_loitering_polygons(self, coords: list):
        """Update loitering zones from a list of coordinates [[x,y], [x,y], ...]."""
        if len(coords) < 3:
            return
        
        # In this implementation, we handle one dynamic polygon per channel
        # that can be updated via the frontend console.
        self.loitering_zones = [{
            "id": f"dynamic_{self.channel_id}",
            "polygon": Polygon(coords)
        }]
        print(f"[VideoProcessor-{self.channel_id}] Updated loitering zone with {len(coords)} points.")

    def get_loitering_polygons(self):
        """Return the current loitering zone coordinates."""
        if not self.loitering_zones:
            return []
        # Return the first zone's coordinates
        poly = self.loitering_zones[0]["polygon"]
        return [[int(x), int(y)] for x, y in poly.exterior.coords[:-1]]

    def _draw_overlay(self, frame):
        for lz in self.loitering_zones:
            pts = np.array(lz["polygon"].exterior.coords, np.int32)
            cv2.polylines(frame, [pts], True, (0, 255, 255), 2) # Yellow for loitering zones
        for exz in self.exit_zones:
            pts = np.array(exz["polygon"].exterior.coords, np.int32)
            cv2.polylines(frame, [pts], True, (0, 0, 255), 1) # Red for exits

    def _draw_loiter_info(self, frame, ltrb, elapsed, is_alert):
        l, t, r, b = map(int, ltrb)
        color = (0, 0, 255) if is_alert else (0, 255, 255)
        text = f"LOITERING: {int(elapsed)}s"
        cv2.putText(frame, text, (l, t - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        cv2.rectangle(frame, (l, t), (r, b), color, 2)

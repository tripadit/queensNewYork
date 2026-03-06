import time
from collections import defaultdict, deque
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from shapely.geometry import Point, Polygon
from ultralytics import YOLO

from app.db import LoiteringLog
from app.core.database import SessionLocal

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
LOITER_THRESHOLD_SEC = 10  # 10 seconds for testing
BREADCRUMB_MAX_LEN = 200   # max trail points per track
PERSON_CLASS_ID = 0         # COCO class 0 = person

# Colours (BGR)
GREEN = (0, 255, 0)
RED = (0, 0, 255)
YELLOW = (0, 255, 255)
CYAN = (255, 255, 0)
POLYGON_FILL = (0, 0, 255)  # semi-transparent red overlay


# ---------------------------------------------------------------------------
# Helper — Point-in-Polygon via Shapely
# ---------------------------------------------------------------------------
def point_in_polygon(px: float, py: float, polygon: Polygon) -> bool:
    """Return True if (px, py) is inside the polygon."""
    return polygon.contains(Point(px, py))


def bottom_center(box: List[float]) -> Tuple[float, float]:
    """Return the bottom-center point of a bounding box [x1, y1, x2, y2]."""
    x1, y1, x2, y2 = box
    return ((x1 + x2) / 2.0, y2)


# ---------------------------------------------------------------------------
# LoiteringProcessor class
# ---------------------------------------------------------------------------
class LoiteringProcessor:
    """Encapsulates YOLO detection, tracking, polygon logic, and drawing."""

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        polygon_coords: Optional[List[Tuple[int, int]]] = None,
        confidence: float = 0.35,
        on_alert=None,  # callback: (alert_dict) -> None
    ):
        # Load YOLO model
        self.model = YOLO(model_path).to("cpu")
        self.confidence = confidence

        # Polygon zone (default covers nothing until set)
        self._polygon_coords: List[Tuple[int, int]] = polygon_coords or []
        self._polygon: Optional[Polygon] = None
        if self._polygon_coords:
            self._build_polygon()

        # Tracking state  {track_id: entry_timestamp}
        self.entry_times: Dict[int, float] = {}
        # Breadcrumb trails {track_id: deque([(x,y), ...])}
        self.trails: Dict[int, deque] = defaultdict(
            lambda: deque(maxlen=BREADCRUMB_MAX_LEN)
        )
        # Set of track IDs already flagged (to avoid duplicate DB writes)
        self.alerted_ids: set = set()
        # Tracks currently inside the polygon
        self.inside_ids: set = set()

        # External alert callback
        self.on_alert = on_alert

        # DB-logged events cache {track_id: log_id}
        self._log_ids: Dict[int, int] = {}

    # ------------------------------------------------------------------
    # Polygon management
    # ------------------------------------------------------------------
    def set_polygon(self, coords: List[Tuple[int, int]]):
        """Set / update the restricted-zone polygon."""
        self._polygon_coords = coords
        self._build_polygon()
        # Reset tracking state on polygon change
        self.entry_times.clear()
        self.trails.clear()
        self.alerted_ids.clear()
        self.inside_ids.clear()
        self._log_ids.clear()

    def _build_polygon(self):
        if len(self._polygon_coords) >= 3:
            self._polygon = Polygon(self._polygon_coords)
        else:
            self._polygon = None

    def get_polygon(self) -> List[Tuple[int, int]]:
        return self._polygon_coords

    # ------------------------------------------------------------------
    # Per-frame processing
    # ------------------------------------------------------------------
    def process_frame(self, frame: np.ndarray) -> np.ndarray:
        """Run detection + tracking on a single frame, return annotated copy."""
        annotated = frame.copy()

        # Draw polygon overlay first (so it's behind boxes)
        self._draw_polygon(annotated)

        if self._polygon is None:
            return annotated

        # Run YOLO with ByteTrack tracker
        results = self.model.track(
            frame,
            persist=True,
            tracker="bytetrack.yaml",
            conf=self.confidence,
            classes=[PERSON_CLASS_ID],
            verbose=False,
        )

        if results and results[0].boxes is not None and results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            track_ids = results[0].boxes.id.cpu().numpy().astype(int)
            self._update_state(annotated, boxes, track_ids)
        else:
            # No detections — everyone left
            self._handle_all_left()

        return annotated

    # ------------------------------------------------------------------
    # State machine
    # ------------------------------------------------------------------
    def _update_state(self, frame, boxes, track_ids):
        now = time.time()
        current_inside: set = set()

        for box, tid in zip(boxes, track_ids):
            tid = int(tid)
            bx, by = bottom_center(box.tolist())
            inside = point_in_polygon(bx, by, self._polygon)

            if inside:
                current_inside.add(tid)
                # Record trail
                self.trails[tid].append((int(bx), int(by)))

                # Start timer if new
                if tid not in self.entry_times:
                    self.entry_times[tid] = now
                    self._db_start_event(tid)

                elapsed = now - self.entry_times[tid]
                is_loitering = elapsed >= LOITER_THRESHOLD_SEC

                # Fire alert once
                if is_loitering and tid not in self.alerted_ids:
                    self.alerted_ids.add(tid)
                    self._db_flag_alert(tid, elapsed)
                    if self.on_alert:
                        self.on_alert(
                            {
                                "track_id": tid,
                                "duration": round(elapsed, 2),
                                "timestamp": datetime.utcnow().isoformat(),
                            }
                        )

                # Update duration in DB periodically for live tracking
                if tid in self._log_ids and is_loitering:
                    self._db_update_duration(tid, elapsed)

                # Draw bounding box
                colour = RED if is_loitering else GREEN
                self._draw_box(frame, box, tid, elapsed, colour)
                # Draw breadcrumbs
                self._draw_trail(frame, tid, colour)
            else:
                # Person detected but outside polygon
                if tid in self.entry_times:
                    # They left the zone — reset timer
                    elapsed = now - self.entry_times[tid]
                    self._db_end_event(tid, elapsed)
                    del self.entry_times[tid]
                    self.alerted_ids.discard(tid)
                    self.inside_ids.discard(tid)
                    # Keep trail a bit for visual, then clear
                    if tid in self.trails:
                        del self.trails[tid]

                # Draw green box outside zone
                self._draw_box(frame, box, tid, 0, GREEN)

        # Handle IDs that disappeared entirely
        gone = set(self.entry_times.keys()) - set(int(t) for t in track_ids)
        for tid in gone:
            elapsed = now - self.entry_times[tid]
            self._db_end_event(tid, elapsed)
            del self.entry_times[tid]
            self.alerted_ids.discard(tid)
            if tid in self.trails:
                del self.trails[tid]

        self.inside_ids = current_inside

    def _handle_all_left(self):
        now = time.time()
        for tid in list(self.entry_times.keys()):
            elapsed = now - self.entry_times[tid]
            self._db_end_event(tid, elapsed)
        self.entry_times.clear()
        self.alerted_ids.clear()
        self.trails.clear()
        self.inside_ids.clear()

    # ------------------------------------------------------------------
    # Database helpers
    # ------------------------------------------------------------------
    def _db_start_event(self, tid: int):
        try:
            db = SessionLocal()
            log = LoiteringLog(
                track_id=tid,
                start_time=datetime.utcnow(),
                is_alert=False,
                status="tracking",
            )
            db.add(log)
            db.commit()
            db.refresh(log)
            self._log_ids[tid] = log.id
            db.close()
        except Exception as e:
            print(f"Error start event: {e}")

    def _db_flag_alert(self, tid: int, elapsed: float):
        try:
            db = SessionLocal()
            log_id = self._log_ids.get(tid)
            if log_id:
                log = db.query(LoiteringLog).get(log_id)
                if log:
                    log.is_alert = True
                    log.status = "loitering"
                    log.duration = elapsed
                    db.commit()
            db.close()
        except Exception:
            pass

    def _db_update_duration(self, tid: int, elapsed: float):
        try:
            db = SessionLocal()
            log_id = self._log_ids.get(tid)
            if log_id:
                log = db.query(LoiteringLog).get(log_id)
                if log:
                    log.duration = elapsed
                    db.commit()
            db.close()
        except Exception:
            pass

    def _db_end_event(self, tid: int, elapsed: float):
        try:
            db = SessionLocal()
            log_id = self._log_ids.get(tid)
            if log_id:
                log = db.query(LoiteringLog).get(log_id)
                if log:
                    log.end_time = datetime.utcnow()
                    log.duration = elapsed
                    log.status = "left"
                    db.commit()
                del self._log_ids[tid]
            db.close()
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Drawing helpers
    # ------------------------------------------------------------------
    def _draw_polygon(self, frame):
        if not self._polygon_coords or len(self._polygon_coords) < 3:
            return
        pts = np.array(self._polygon_coords, dtype=np.int32)
        overlay = frame.copy()
        cv2.fillPoly(overlay, [pts], POLYGON_FILL)
        cv2.addWeighted(overlay, 0.25, frame, 0.75, 0, frame)
        cv2.polylines(frame, [pts], isClosed=True, color=RED, thickness=2)

    def _draw_box(self, frame, box, tid, elapsed, colour):
        x1, y1, x2, y2 = map(int, box)
        cv2.rectangle(frame, (x1, y1), (x2, y2), colour, 2)
        minutes = int(elapsed // 60)
        seconds = int(elapsed % 60)
        label = f"ID:{tid}  {minutes}m{seconds:02d}s"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(frame, (x1, y1 - th - 8), (x1 + tw + 4, y1), colour, -1)
        cv2.putText(
            frame, label, (x1 + 2, y1 - 4),
            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA,
        )

    def _draw_trail(self, frame, tid, colour):
        trail = self.trails.get(tid)
        if not trail or len(trail) < 2:
            return
        pts = list(trail)
        for i in range(1, len(pts)):
            # Fade older points
            alpha = i / len(pts)
            c = tuple(int(v * alpha) for v in colour)
            cv2.line(frame, pts[i - 1], pts[i], c, 2, cv2.LINE_AA)
        # Draw dots
        for pt in pts:
            cv2.circle(frame, pt, 3, CYAN, -1)

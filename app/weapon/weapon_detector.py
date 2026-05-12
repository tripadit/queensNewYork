import logging
import cv2
from ultralytics import YOLO
from datetime import datetime, timedelta
import os
import platform
from app.core.database import SessionLocal
from app.db import WeaponDetectionLog
from app.core.models import registry
from app.core.db_worker import db_worker

# It's good practice to use a specific logger for security events.
# This logger can be configured independently in your main application entrypoint
# to write to a specific file, send emails, etc.
security_logger = logging.getLogger("security")

ALERTS_DIR = "app/alerts/weapon_snapshots"

from collections import deque

class WeaponDetector:
    """
    A dedicated class for detecting weapons in video frames and triggering alerts.
    """
    def __init__(self, channel_id: str = "1"):
        """
        Initializes the WeaponDetector using the shared model registry.
        """
        self.channel_id = channel_id
        self.model = registry.yolo_weapon
        self.confidence_threshold = 0.8  # 80% confidence
        self.last_log_time = {} # Track last log time per class
        
        # New Persistence Logic: Sliding Window Hit-Ratio
        # We track the last 10 frames. If a class is seen in >= 6 of them, we alert.
        self.window_size = 10
        self.hit_threshold = 6
        self.hit_history = {} # {class_name: deque([bool, bool, ...])}
        self.min_bbox_area = 500 # Ignore detections smaller than 500 pixels (noise)

    def detect(self, frame):
        """
        Detects weapons in a single video frame with robust persistence checking.
        """
        weapons_found = []
        results = self.model(frame, verbose=False)[0]
        seen_this_frame = set()

        for box in results.boxes:
            conf = float(box.conf.item())
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            area = (x2 - x1) * (y2 - y1)

            if conf >= self.confidence_threshold and area >= self.min_bbox_area:
                try:
                    class_name = self.model.names[int(box.cls)]
                except (IndexError, KeyError):
                    class_name = f"Unknown Class ({int(box.cls)})"
                
                seen_this_frame.add(class_name)
                
                # Initialize history for new classes
                if class_name not in self.hit_history:
                    self.hit_history[class_name] = deque(maxlen=self.window_size)
                
                self.hit_history[class_name].append(True)
                
                # Check hit ratio
                hits = sum(self.hit_history[class_name])
                if hits >= self.hit_threshold:
                    alert_info = {
                        "class": class_name,
                        "confidence": conf,
                        "timestamp": datetime.now().isoformat()
                    }
                    weapons_found.append(alert_info)
                    self._trigger_alert_actions(frame, alert_info, box.xyxy[0])
                    security_logger.info(f"CONFIRMED WEAPON: {class_name} (Hits: {hits}/{len(self.hit_history[class_name])})")

        # Update history for classes NOT seen in this frame
        for class_name, history in self.hit_history.items():
            if class_name not in seen_this_frame:
                history.append(False)

        return weapons_found

    def _trigger_alert_actions(self, frame, alert_info, box_coords):
        """
        Private method to orchestrate all actions taken when an alert is triggered.
        """
        # 1. Log the Critical Event
        message = f"WEAPON DETECTED: Class '{alert_info['class']}' (Confidence: {alert_info['confidence']:.2f})"
        security_logger.critical(message)

        # 2. Save Visual Evidence
        self._save_alert_snapshot(frame, alert_info, box_coords)
        
        # 3. Play Local Sound Alert (FOR LOCAL DEBUGGING ONLY)
        self._play_local_alert_sound()

        # 4. Signal to Frontend (Placeholder for WebSocket)
        self._signal_frontend_alert(alert_info)

        # 5. Log to Database (with 5-second cooldown per class)
        self._log_to_db(alert_info)

    def _log_to_db(self, alert_info):
        """
        Submits the weapon detection log to the background worker.
        """
        now = datetime.now()
        weapon_class = alert_info['class']

        if weapon_class not in self.last_log_time or (now - self.last_log_time[weapon_class]) > timedelta(seconds=30):
            self.last_log_time[weapon_class] = now
            db_worker.submit(self._log_to_db_logic, alert_info, now)

    def _log_to_db_logic(self, alert_info, now):
        """
        The actual DB write logic for weapon detection.
        """
        try:
            session = SessionLocal()
            new_log = WeaponDetectionLog(
                channel_id=self.channel_id,
                label=alert_info['class'],
                confidence=alert_info['confidence'],
                timestamp=now
            )
            session.add(new_log)
            session.commit()
            session.close()
            security_logger.info(f"Background logged weapon detection to DB: {alert_info['class']} (Cam {self.channel_id})")
        except Exception as e:
            security_logger.error(f"Failed to background log weapon detection: {e}")

    def _save_alert_snapshot(self, frame, alert_info, box_coords):
        """
        Saves a snapshot of the frame with the detected weapon highlighted.
        """
        try:
            # Create a unique filename
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            filename = os.path.join(ALERTS_DIR, f"weapon_{alert_info['class']}_{timestamp_str}.jpg")
            
            # Draw a red bounding box on a copy of the frame
            alert_frame = frame.copy()
            x1, y1, x2, y2 = map(int, box_coords)
            cv2.rectangle(alert_frame, (x1, y1), (x2, y2), (0, 0, 255), 2) # BGR for Red
            
            # Add text for context
            label = f"{alert_info['class']}: {alert_info['confidence']:.2%}"
            cv2.putText(alert_frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            
            cv2.imwrite(filename, alert_frame)
            security_logger.info(f"Saved weapon alert snapshot to {filename}")
        except Exception as e:
            security_logger.error(f"Failed to save alert snapshot. Error: {e}", exc_info=True)

    def _play_local_alert_sound(self):
        """
        Plays a system sound for immediate, local-only alerts.
        
        *** WARNING: This is a temporary, OS-specific feature for debugging. ***
        It is not a substitute for a proper frontend WebSocket-based notification
        and will only work on the machine running this script.
        """
        system = platform.system()
        if system == "Darwin": # macOS
            try:
                # Use a standard macOS sound. The '&' runs the command in the background
                # so it doesn't block the video processing loop.
                os.system("afplay /System/Library/Sounds/Submarine.aiff &")
                security_logger.warning("Played local alert sound (macOS only). This is a debug feature.")
            except Exception as e:
                security_logger.error(f"Failed to play local sound on macOS. Error: {e}")

    def _signal_frontend_alert(self, alert_info):
        """
        Placeholder for sending a real-time signal to the frontend.
        In a real application, this would call a WebSocket manager to broadcast a message.
        """
        # For now, we log that this action would occur. This is how the backend
        # would trigger the sound to play on the frontend.
        security_logger.info(f"WEBSOCKET SIGNAL (Placeholder): Broadcasting 'weapon_alert' to frontend.")

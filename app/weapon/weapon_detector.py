import logging
import cv2
from ultralytics import YOLO
from datetime import datetime, timedelta
import os
import platform # <-- 1. IMPORT PLATFORM
from app.core.database import SessionLocal
from app.db import WeaponDetectionLog

# It's good practice to use a specific logger for security events.
# This logger can be configured independently in your main application entrypoint
# to write to a specific file, send emails, etc.
security_logger = logging.getLogger("security_alerts")

# Directory to save visual evidence of alerts.
ALERTS_DIR = "app/alerts/weapon_snapshots"

class WeaponDetector:
    """
    A dedicated class for detecting weapons in video frames and triggering alerts.
    """
    def __init__(self, model_path="app/dual_models/bestgun.pt"):
        """
        Initializes the WeaponDetector.

        Args:
            model_path (str): Path to the YOLO model file for weapon detection.
        """
        try:
            self.model = YOLO(model_path)
            # Ensure the model is loaded to the correct device, e.g., "cpu" or "cuda"
            self.model.to("cpu") 
            security_logger.info(f"Weapon detection model loaded from {model_path}")
        except Exception as e:
            security_logger.error(f"FATAL: Could not load weapon detection model from {model_path}. Error: {e}", exc_info=True)
            # Depending on the application's requirements, you might want to raise the exception
            # to prevent the application from starting without a critical component.
            raise
            
        self.confidence_threshold = 0.5  # Minimum confidence to trigger an alert.
        self.last_log_time = {} # Track last log time per class to avoid flooding

    def detect(self, frame):
        """
        Detects weapons in a single video frame.

        Args:
            frame: The video frame (NumPy array) to process.

        Returns:
            list: A list of dictionaries, where each dictionary contains
                  information about a detected weapon.
        """
        weapons_found = []
        
        # Run inference
        results = self.model(frame, verbose=False)[0]

        for box in results.boxes:
            if box.conf.item() >= self.confidence_threshold:
                try:
                    class_name = self.model.names[int(box.cls)]
                except (IndexError, KeyError):
                    class_name = f"Unknown Class ({int(box.cls)})"
                
                alert_info = {
                    "class": class_name,
                    "confidence": float(box.conf.item()),
                    "timestamp": datetime.now().isoformat()
                }
                weapons_found.append(alert_info)

                # --- Trigger All Alert Actions ---
                self._trigger_alert_actions(frame, alert_info, box.xyxy[0])

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
        Logs the weapon detection to the database.
        """
        now = datetime.now()
        weapon_class = alert_info['class']
        
        if weapon_class not in self.last_log_time or (now - self.last_log_time[weapon_class]) > timedelta(seconds=5):
            try:
                session = SessionLocal()
                new_log = WeaponDetectionLog(
                    label=weapon_class,
                    confidence=alert_info['confidence'],
                    timestamp=now
                )
                session.add(new_log)
                session.commit()
                session.close()
                self.last_log_time[weapon_class] = now
                security_logger.info(f"Logged weapon detection to DB: {weapon_class}")
            except Exception as e:
                security_logger.error(f"Failed to log weapon detection to DB: {e}")

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
        # elif system == "Linux":
        #     os.system("aplay /path/to/sound.wav &")
        # elif system == "Windows":
        #     # Windows sound playing is more complex and might require 'winsound' library
        #     import winsound
        #     winsound.PlaySound("SystemAsterisk", winsound.SND_ASYNC)


    def _signal_frontend_alert(self, alert_info):
        """
        Placeholder for sending a real-time signal to the frontend.
        In a real application, this would call a WebSocket manager to broadcast a message.
        """
        # --- PRODUCTION IMPLEMENTATION ---
        # A call would be made here to a WebSocket manager, e.g.:
        #
        # from app.core.websocket_manager import websocket_manager
        # await websocket_manager.broadcast(json.dumps({
        #     "type": "weapon_alert",
        #     "data": alert_info
        # }))
        #
        # This requires the application to run in an async context and have the manager available.
        # ---------------------------------

        # For now, we log that this action would occur. This is how the backend
        # would trigger the sound to play on the frontend.
        security_logger.info(f"WEBSOCKET SIGNAL (Placeholder): Broadcasting 'weapon_alert' to frontend.")

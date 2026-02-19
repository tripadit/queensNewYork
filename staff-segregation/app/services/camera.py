import cv2
import time
from app.core.config import settings

class CameraService:
    def __init__(self, source=None):
        self.source = source if source is not None else settings.RTSP_URL
        self.cap = None
        self.camera_thread = None

    def start(self):
        if self.cap is not None and self.cap.isOpened():
            print("DEBUG: Camera already open")
            return

        # If source is an integer string, convert to int (for webcam)
        src = self.source
        if isinstance(src, str) and src.isdigit():
            src = int(src)
            
        print(f"DEBUG: Attempting to open camera source: {src} (Type: {type(src)})")
        self.cap = cv2.VideoCapture(src)
        if not self.cap.isOpened():
            print(f"ERROR: Could not open video source: {self.source}")
            # Try forcing DirectShow on Windows if index 0 fails
            if src == 0:
                print("DEBUG: Retrying with cv2.CAP_DSHOW...")
                self.cap = cv2.VideoCapture(src, cv2.CAP_DSHOW)
                if not self.cap.isOpened():
                    print("ERROR: Still could not open camera with CAP_DSHOW")
        else:
            print("DEBUG: Camera opened successfully")

    def stop(self):
        if self.cap:
            self.cap.release()
            self.cap = None

    def get_frame(self):
        if not self.cap or not self.cap.isOpened():
            return None
        
        ret, frame = self.cap.read()
        if not ret:
            # Try to reconnect
            print("Frame read failed. Reconnecting...")
            self.cap.release()
            time.sleep(1)
            self.start()
            return None
            
        return frame

camera_service = CameraService()

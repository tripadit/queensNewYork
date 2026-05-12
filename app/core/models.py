"""
Centralized model registry to ensure models are loaded once as singletons.
"""

from ultralytics import YOLO
import insightface
import threading

class ModelRegistry:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ModelRegistry, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        # Load YOLO models
        # Note: YOLO("path") loads the model into memory. 
        # We store them here so all threads use the same instance.
        self.yolo_person = YOLO("yolo11n.pt")
        self.yolo_person.to("cpu")
        
        self.yolo_weapon = YOLO("app/dual_models/bestgun.pt")
        self.yolo_weapon.to("cpu")

        # Load InsightFace
        self.face_app = insightface.app.FaceAnalysis(
            name="buffalo_l",
            providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
        )
        self.face_app.prepare(ctx_id=-1, det_size=(640, 640))

        self._initialized = True

# Global singleton
registry = ModelRegistry()

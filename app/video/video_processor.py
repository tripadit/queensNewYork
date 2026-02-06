"""
Main video pipeline:
YOLO11 → DeepSort → Face capture → Identity logic
"""

import cv2
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

from app.face.insightface_embedder import InsightFaceEmbedder
from app.video.face_buffer import FaceBuffer
from app.services.identity_manager import IdentityManager

class VideoProcessor:

    def __init__(self):
        self.detector = YOLO("yolo11n.pt").to("cpu")
        self.tracker = DeepSort(max_age=30)
        self.embedder = InsightFaceEmbedder()
        self.face_buffer = FaceBuffer()
        self.identity_manager = IdentityManager()
        self.confidence_threshold = 0.35  # Filter out low-confidence detections

    def process(self, frame):
        detections = []

        results = self.detector(frame)[0]
        for box in results.boxes:
            if int(box.cls) == 0 and box.conf.item() >= self.confidence_threshold:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                detections.append(([x1, y1, x2-x1, y2-y1], box.conf.item(), "person"))

        tracks = self.tracker.update_tracks(detections, frame=frame)

        for track in tracks:
            if not track.is_confirmed():
                continue

            l, t, r, b = map(int, track.to_ltrb())
            crop = frame[t:b, l:r]

            if crop.size == 0:
                continue

            embedding, score = self.embedder.extract(crop)
            if embedding is None:
                continue

            best_face = self.face_buffer.update(track.track_id, crop, score)

            if best_face is not None:
                self.identity_manager.sync_detection_to_db(
                    embedding, track.track_id
                )

        return frame

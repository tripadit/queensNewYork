"""
Buffers face samples per Track_ID.
Ensures only ONE best face is used per person.
"""

import time

class FaceBuffer:

    def __init__(self, observe_seconds=2.0):
        self.observe_seconds = observe_seconds
        self.buffer = {}

    def update(self, track_id, face_img, score):
        now = time.time()

        if track_id not in self.buffer:
            self.buffer[track_id] = {
                "start": now,
                "best_score": score,
                "best_face": face_img,
                "locked": False
            }
            return None

        track = self.buffer[track_id]

        if track["locked"]:
            return None

        if score > track["best_score"]:
            track["best_face"] = face_img
            track["best_score"] = score

        if now - track["start"] >= self.observe_seconds:
            track["locked"] = True
            return track["best_face"]

        return None

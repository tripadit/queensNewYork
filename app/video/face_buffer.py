"""
Buffers face samples per Track_ID.
Ensures only ONE best face is used per person.
"""

import time

class FaceBuffer:

    def __init__(self, observe_seconds=1.0):
        self.observe_seconds = observe_seconds
        self.buffer = {}

    def update(self, track_id, face_img, score, min_score=0.4):
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
            # Check if we have a face that meets the minimum quality threshold
            if track["best_score"] >= min_score:
                track["locked"] = True
                return track["best_face"]
            else:
                # If quality is too low, extend observation by 1 second to try and get a better face
                # This prevents accepting a blurry/poor face just because time is up.
                track["start"] = now - (self.observe_seconds - 1.0)
                return None

        return None

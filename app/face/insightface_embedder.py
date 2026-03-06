"""
Face detection + embedding using InsightFace.
Returns a normalized 512-d vector.
"""

import insightface
import numpy as np

class InsightFaceEmbedder:

    def __init__(self):
        self.app = insightface.app.FaceAnalysis(
            name="buffalo_l",
            providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
        )
        self.app.prepare(ctx_id=-1, det_size=(640, 640))

    def extract(self, image: np.ndarray):
        """
        Detect faces and return best one.

        Mathematics:
        - Embedding is L2-normalized
        - Cosine similarity later reduces to dot product

        Returns:
            embedding (512,), confidence
        """
        faces = self.app.get(image)
        if not faces:
            return None, None

        best_face = max(faces, key=lambda f: f.det_score)
        return best_face.normed_embedding, best_face.det_score

    def detect_only(self, image: np.ndarray):
        """
        Detect faces and return the highest detection score.
        """
        faces = self.app.get(image)
        if not faces:
            return 0.0
        
        best_face = max(faces, key=lambda f: f.det_score)
        return best_face.det_score

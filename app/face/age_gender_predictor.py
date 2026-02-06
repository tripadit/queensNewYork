"""
Age and Gender detection using a fine-tuned YOLO model.
"""

from ultralytics import YOLO
import numpy as np

class AgeGenderPredictor:
    def __init__(self, model_path="app/dual_models/bestage.pt"):
        self.model = YOLO(model_path)
        self.class_names = [
            'Female Age- 1', 'Female Age- 2', 'Female Age- 22', 'Female Age- 24', 
            'Female Age- 25', 'Female Age- 28', 'Female Age- 30', 'Female Age- 35', 
            'Female Age- 45', 'Female Age- 50', 'Female Age- 60', 'Female Age- 75', 
            'Female Age-3', 'Female Age-40', 'Male Age- 1', 'Male Age- 2', 
            'Male Age- 22', 'Male Age- 24', 'Male Age- 25', 'Male Age- 28', 
            'Male Age- 3', 'Male Age- 30', 'Male Age- 35', 'Male Age- 40', 
            'Male Age- 45', 'Male Age- 50', 'Male Age- 60', 'Male Age- 75'
        ]

    def predict(self, image: np.ndarray):
        """
        Predict age and gender from a face crop.
        Returns: String (e.g., 'Female Age- 25') or None
        """
        results = self.model(image, verbose=False)[0]
        if len(results.boxes) == 0:
            return None
        
        # Take the detection with the highest confidence
        best_idx = results.boxes.conf.argmax()
        class_id = int(results.boxes.cls[best_idx])
        
        if class_id < len(self.class_names):
            return self.class_names[class_id]
        
        return None

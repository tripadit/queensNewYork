import cv2
import numpy as np
from deepface import DeepFace
from app.core.database import db

class RecognitionService:
    def __init__(self, model_name="Facenet512", database_path=":memory:"):
        self.model_name = model_name
        # Trigger download of weights if needed
        # DeepFace.build_model(model_name) 

    def get_embedding(self, face_image):
        """
        Extract 512-d embedding from face image using DeepFace.
        face_image: numpy array (BGR)
        """
        try:
            # DeepFace expects RGB
            face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            
            # represent returns a list of dicts
            embedding_objs = DeepFace.represent(
                img_path=face_rgb,
                model_name=self.model_name,
                enforce_detection=False,
                detector_backend="skip" # Face is already detected/cropped
            )
            
            if embedding_objs:
                return embedding_objs[0]["embedding"]
            return None
        except Exception as e:
            print(f"Error getting embedding: {e}")
            return None

    def identify_person(self, embedding, threshold=0.7):
        """
        Identify person from embedding using DB search.
        Returns: (label, name)
        """
        if not embedding:
            return "Customer", None

        # Use Cosine Distance (<=>)
        query = """
        SELECT name, embedding <=> %s::vector AS distance
        FROM staff_profiles
        ORDER BY distance ASC
        LIMIT 1;
        """
        
        try:
            with db.get_cursor() as cursor:
                cursor.execute(query, (embedding,))
                result = cursor.fetchone()
                
                if result:
                    name, distance = result
                    print(f"DEBUG: Closest match: {name}, Distance: {distance}, Threshold: {threshold}")
                    if distance < threshold:
                        return "Staff", name
                else:
                    print("DEBUG: No match found in DB")
        except Exception as e:
            print(f"Error identifying person: {e}")

        return "Customer", None

    def register_staff(self, name, image_path):
        """
        Register a new staff member.
        Resize image to 500x500 before storing.
        """
        img = cv2.imread(image_path)
        if img is None:
            print(f"Error reading image: {image_path}")
            return False

        # Resize
        img_resized = cv2.resize(img, (500, 500))
        
        # Get embedding
        embedding = self.get_embedding(img_resized)
        if not embedding:
            print("Could not extract embedding from image")
            return False
            
        # Encode image to bytes for storage
        _, img_encoded = cv2.imencode('.jpg', img_resized)
        img_bytes = img_encoded.tobytes()

        query = """
        INSERT INTO staff_profiles (name, embedding, image)
        VALUES (%s, %s, %s);
        """
        
        try:
            with db.get_cursor() as cursor:
                cursor.execute(query, (name, embedding, img_bytes))
            print(f"Staff member {name} registered successfully.")
            return True
        except Exception as e:
            print(f"Error registering staff: {e}")
            return False

recognition_service = RecognitionService()

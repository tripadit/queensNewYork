import sys
sys.path.insert(0, '.')

from app.core.database import db
from app.services.recognition import recognition_service
import cv2

# Connect to DB
db.connect()

# Get all staff profiles
print("=" * 50)
print("REGISTERED STAFF PROFILES:")
print("=" * 50)

with db.get_cursor() as cursor:
    cursor.execute("SELECT id, name, created_at FROM staff_profiles")
    profiles = cursor.fetchall()
    
    for profile in profiles:
        print(f"ID: {profile[0]}, Name: {profile[1]}, Registered: {profile[2]}")

print("\n" + "=" * 50)
print("TESTING RECOGNITION WITH WEBCAM:")
print("=" * 50)

# Open webcam
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("ERROR: Could not open webcam")
    sys.exit(1)

print("Webcam opened. Press 'q' to quit, 's' to test recognition on current frame")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break
    
    cv2.imshow('Webcam Test - Press S to test recognition', frame)
    
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('s'):
        print("\nTesting recognition on current frame...")
        
        # Get embedding from full frame
        embedding = recognition_service.get_embedding(frame)
        
        if embedding:
            print(f"✓ Embedding extracted successfully (length: {len(embedding)})")
            
            # Test against all staff
            with db.get_cursor() as cursor:
                cursor.execute("""
                    SELECT name, embedding <=> %s::vector AS distance
                    FROM staff_profiles
                    ORDER BY distance ASC
                """, (embedding,))
                
                results = cursor.fetchall()
                print("\nMatching results:")
                for name, distance in results:
                    status = "✓ MATCH" if distance < 0.7 else "✗ NO MATCH"
                    print(f"  {name}: {distance:.4f} {status}")
        else:
            print("✗ Could not extract embedding from frame")

cap.release()
cv2.destroyAllWindows()
db.close()
print("\nTest complete!")

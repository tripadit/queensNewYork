import sys
sys.path.insert(0, '.')

from app.core.database import db
from app.services.recognition import recognition_service
import cv2
import numpy as np

# Connect to DB
db.connect()

print("=" * 60)
print("STAFF PROFILE CHECK")
print("=" * 60)

with db.get_cursor() as cursor:
    # Get staff profile
    cursor.execute("SELECT id, name, image, embedding FROM staff_profiles WHERE name = 'Ashim Nepal'")
    result = cursor.fetchone()
    
    if not result:
        print("ERROR: No profile found for 'Ashim Nepal'")
        sys.exit(1)
    
    staff_id, name, image_bytes, stored_embedding = result
    print(f"✓ Found profile: {name} (ID: {staff_id})")
    print(f"✓ Stored embedding length: {len(stored_embedding)}")
    
    # Decode the stored image
    nparr = np.frombuffer(image_bytes, np.uint8)
    stored_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    print(f"✓ Stored image shape: {stored_image.shape}")
    
    # Re-extract embedding from stored image
    print("\nRe-extracting embedding from stored image...")
    new_embedding = recognition_service.get_embedding(stored_image)
    
    if new_embedding:
        print(f"✓ New embedding extracted (length: {len(new_embedding)})")
        
        # Calculate distance between stored and re-extracted
        cursor.execute("""
            SELECT embedding <=> %s::vector AS distance
            FROM staff_profiles
            WHERE name = 'Ashim Nepal'
        """, (new_embedding,))
        
        distance = cursor.fetchone()[0]
        print(f"\n{'='*60}")
        print(f"SELF-MATCH TEST (same person, re-extracted embedding):")
        print(f"{'='*60}")
        print(f"Distance: {distance:.6f}")
        print(f"Current threshold: 0.7")
        
        if distance < 0.7:
            print(f"✓ MATCH - This should work!")
        else:
            print(f"✗ NO MATCH - Threshold too strict!")
            print(f"Recommended threshold: {distance * 1.5:.2f}")
    else:
        print("✗ Could not extract embedding from stored image")

db.close()
print("\nTest complete!")

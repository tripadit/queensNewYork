import requests
import cv2
import numpy as np
import os
import time

BASE_URL = "http://localhost:8001"

def create_dummy_image(filename="dummy_staff.jpg"):
    # Create a simple image (black square)
    img = np.zeros((500, 500, 3), dtype=np.uint8)
    # Draw a circle to make it not completely empty
    cv2.circle(img, (250, 250), 100, (255, 255, 255), -1)
    cv2.imwrite(filename, img)
    return filename

def test_api():
    print("Waiting for server to start...")
    time.sleep(5) # Wait for uvicorn
    
    # 1. Test Root/Docs (Health check)
    try:
        resp = requests.get(f"{BASE_URL}/docs")
        if resp.status_code == 200:
            print("✅ Server is running (Docs available)")
        else:
            print(f"❌ Server returned {resp.status_code} for /docs")
            return
    except Exception as e:
        print(f"❌ Could not connect to server: {e}")
        return

    # 2. Register Staff
    img_path = create_dummy_image()
    try:
        with open(img_path, 'rb') as f:
            files = {'file': (img_path, f, 'image/jpeg')}
            data = {'name': 'TestUser'}
            resp = requests.post(f"{BASE_URL}/staff/register", data=data, files=files)
            
        if resp.status_code == 200:
            print(f"✅ Registered staff: {resp.json()}")
        else:
            print(f"❌ Registration failed: {resp.text}")
    except Exception as e:
        print(f"❌ Registration error: {e}")
    finally:
        if os.path.exists(img_path):
            os.remove(img_path)

    # 3. Start Processing (will likely fail or warn if no camera, but tests endpoint)
    try:
        resp = requests.post(f"{BASE_URL}/start")
        print(f"✅ Start processing response: {resp.json()}")
        
        time.sleep(5) # Let it run for a bit
        
        resp = requests.post(f"{BASE_URL}/stop")
        print(f"✅ Stop processing response: {resp.json()}")
    except Exception as e:
        print(f"❌ Processing control error: {e}")

    # 4. Check Logs
    try:
        resp = requests.get(f"{BASE_URL}/logs")
        if resp.status_code == 200:
            logs = resp.json()
            print(f"✅ Retrieved {len(logs)} logs")
        else:
            print(f"❌ Failed to get logs: {resp.text}")
    except Exception as e:
        print(f"❌ Logs error: {e}")

if __name__ == "__main__":
    test_api()

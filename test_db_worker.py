import time
import logging
from app.core.db_worker import db_worker
from app.core.database import SessionLocal
from app.db import WeaponDetectionLog
from datetime import datetime

# Configure logging to see output
logging.basicConfig(level=logging.INFO)

def test_log():
    print("Submitting test log to db_worker...")
    
    def _logic():
        print("Executing _logic in db_worker thread...")
        try:
            session = SessionLocal()
            log = WeaponDetectionLog(
                channel_id="TEST",
                label="TEST_WEAPON",
                confidence=0.99,
                timestamp=datetime.now()
            )
            session.add(log)
            session.commit()
            session.close()
            print("Successfully committed test log to DB.")
        except Exception as e:
            print(f"Error in _logic: {e}")

    db_worker.submit(_logic)
    print("Submitted.")
    
    # Wait for the worker to process
    time.sleep(2)
    print("Done waiting.")

if __name__ == "__main__":
    test_log()

"""
Unified Loitering Service.
Handles DB logging and state for cross-camera loitering.
"""

from datetime import datetime
from typing import Optional
from app.db import LoiteringLog
from app.core.database import SessionLocal
from app.core.db_worker import db_worker

class LoiteringService:
    def start_event(self, track_id: int, channel_id: str, start_time: datetime, callback=None):
        """Create a new loitering log entry in the background."""
        def _logic():
            try:
                db = SessionLocal()
                log = LoiteringLog(
                    track_id=track_id,
                    channel_id=channel_id,
                    start_time=start_time,
                    status="tracking",
                    is_alert=False
                )
                db.add(log)
                db.commit()
                db.refresh(log)
                log_id = log.id
                db.close()
                if callback:
                    callback(log_id)
            except Exception as e:
                print(f"[LoiteringService] Start error: {e}")
        
        db_worker.submit(_logic)

    def update_event(self, log_id: int, duration: float, is_alert: bool):
        """Update an existing loitering log entry."""
        def _logic():
            try:
                db = SessionLocal()
                log = db.get(LoiteringLog, log_id)
                if log:
                    log.duration = duration
                    log.is_alert = is_alert
                    log.status = "loitering" if is_alert else "tracking"
                    db.commit()
                db.close()
            except Exception as e:
                print(f"[LoiteringService] Update error: {e}")
        
        db_worker.submit(_logic)

    def end_event(self, log_id: int, duration: float, status: str = "left"):
        """Finalize a loitering log entry."""
        def _logic():
            try:
                db = SessionLocal()
                log = db.get(LoiteringLog, log_id)
                if log:
                    log.duration = duration
                    log.status = status
                    log.end_time = datetime.utcnow()
                    db.commit()
                db.close()
            except Exception as e:
                print(f"[LoiteringService] End error: {e}")
        
        db_worker.submit(_logic)

# Global singleton
loitering_service = LoiteringService()

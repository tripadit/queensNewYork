"""
Asynchronous Database Worker.
Handles DB writes in a background thread to prevent video stuttering.
"""

import queue
import threading
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

logger = logging.getLogger("db_worker")

class DatabaseWorker:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DatabaseWorker, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.task_queue = queue.Queue()
        self.worker_thread = threading.Thread(target=self._run, daemon=True)
        self.worker_thread.start()
        self._initialized = True
        logger.info("Database background worker started.")

    def submit(self, func, *args, **kwargs):
        """Submit a function to be executed by the DB worker."""
        # print(f"[DB-Worker] Task submitted: {func.__name__}")
        self.task_queue.put((func, args, kwargs))

    def _run(self):
        while True:
            try:
                func, args, kwargs = self.task_queue.get()
                try:
                    # print(f"[DB-Worker] Executing: {func.__name__}")
                    # Execute the task
                    func(*args, **kwargs)
                    # print(f"[DB-Worker] Success: {func.__name__}")
                except Exception as e:
                    print(f"[DB-Worker] ERROR in {func.__name__}: {e}")
                    logger.error(f"Error executing background DB task {func.__name__}: {e}", exc_info=True)
                finally:
                    self.task_queue.task_done()
            except Exception as e:
                logger.error(f"Critical error in DB worker loop: {e}")

# Global singleton
db_worker = DatabaseWorker()

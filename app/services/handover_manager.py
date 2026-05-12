"""
Global Handover Manager.
Tracks persons "in transit" between cameras to allow instant identity resolution.
"""

import time
import threading
from typing import Dict, List, Optional

class HandoverManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(HandoverManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, ttl_seconds: float = 15.0):
        if self._initialized:
            return
        
        # transit_pool: {exit_zone_id: [{person_data, timestamp, from_channel}]}
        self.transit_pool: Dict[str, List[dict]] = {}
        self.ttl = ttl_seconds
        self.pool_lock = threading.Lock()
        
        # Cleanup thread
        self.stop_event = threading.Event()
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.cleanup_thread.start()
        
        self._initialized = True
        print(f"[HandoverManager] Initialized with TTL {self.ttl}s")

    def register_exit(self, person_data: dict, from_channel: str, exit_zone_id: str, 
                      loitering_start_time: Optional[float] = None, 
                      loitering_log_id: Optional[int] = None):
        """Register a person who just exited a camera's view."""
        with self.pool_lock:
            if exit_zone_id not in self.transit_pool:
                self.transit_pool[exit_zone_id] = []
            
            # Embed loitering state into person_data for the next camera
            person_data["loitering_start_time"] = loitering_start_time
            person_data["loitering_log_id"] = loitering_log_id

            entry = {
                "person_data": person_data,
                "timestamp": time.time(),
                "from_channel": from_channel
            }
            self.transit_pool[exit_zone_id].append(entry)
            print(f"[HandoverManager] Registered exit: {person_data.get('name', 'Unknown')} from Cam {from_channel} (Zone: {exit_zone_id})")

    def find_match(self, to_channel: str, entry_zone_id: str, source_zones: List[str]) -> Optional[dict]:
        """
        Check if any person who recently exited from source_zones is entering entry_zone_id.
        source_zones: List of zone IDs that feed into this entry zone.
        """
        now = time.time()
        with self.pool_lock:
            for sz in source_zones:
                if sz in self.transit_pool:
                    # Look for the most recent exit that hasn't expired
                    # We iterate in reverse to find the latest
                    for i in range(len(self.transit_pool[sz]) - 1, -1, -1):
                        entry = self.transit_pool[sz][i]
                        if now - entry["timestamp"] <= self.ttl:
                            # Match found! Remove from pool and return
                            matched_person = self.transit_pool[sz].pop(i)
                            print(f"[HandoverManager] Match FOUND: {matched_person['person_data'].get('name', 'Unknown')} "
                                  f"from Cam {matched_person['from_channel']} to Cam {to_channel}")
                            return matched_person["person_data"]
            
        return None

    def _cleanup_loop(self):
        """Periodically remove expired transit records."""
        while not self.stop_event.is_set():
            time.sleep(5)
            now = time.time()
            with self.pool_lock:
                for zone_id in list(self.transit_pool.keys()):
                    self.transit_pool[zone_id] = [
                        e for e in self.transit_pool[zone_id] 
                        if now - e["timestamp"] <= self.ttl
                    ]
                    if not self.transit_pool[zone_id]:
                        del self.transit_pool[zone_id]

# Global singleton
handover_manager = HandoverManager()

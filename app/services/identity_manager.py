"""
Identity resolution logic.
Handles Ram vs Shyam and 20-minute rule.
"""

import threading
import time
import numpy as np
from datetime import datetime, timedelta, date
from sqlalchemy import select
from scipy.spatial.distance import cosine
from app.db import Person, Visit, DailyAnalytics
from app.core.database import SessionLocal
from app.core.config import FACE_SIMILARITY_THRESHOLD, REENTRY_TIME_MINUTES

from app.core.db_worker import db_worker

class IdentityManager:
    _global_lock = threading.Lock()
    _recent_processed = {}  # {track_id_hash: timestamp} to prevent double-processing
    
    # Cross-camera short-term memory to prevent double counting in overlapping FOVs
    # Format: [{"person_id": uuid, "embedding": np.array, "timestamp": float}]
    _short_term_cache = []
    _cache_ttl = 60.0 # 60 seconds
    _cache_threshold = 0.60 # Lenient threshold for simultaneous cross-camera sightings

    def register_anonymous_sighting(self, track_id):
        """Register a sighting even if no face is detected yet."""
        db_worker.submit(self._anonymous_logic, track_id)

    def _anonymous_logic(self, track_id):
        session = SessionLocal()
        try:
            self._update_daily(session, unique=False)
            session.commit()
        except Exception as e:
            print(f"[Identity-Anonymous] ERROR: {e}")
            session.rollback()
        finally:
            session.close()

    def resolve_customer(self, embedding, gender=None, age_group=None, track_id=None):
        """Submit identity synchronization to a background worker."""
        print(f"[IdentityManager] Resolving customer for track {track_id}")
        if gender and age_group:
            gender_age = f"{gender} ({age_group})"
        else:
            gender_age = gender
            
        db_worker.submit(self._sync_logic, embedding, track_id, gender_age)

    def _sync_logic(self, embedding, track_id, gender_age=None):
        """The actual DB-intensive identity resolution logic with race-condition protection."""
        print(f"[IdentityManager] Starting DB sync logic for track {track_id}")
        # with open("face_debug.log", "a") as f:
        #    f.write(f"[{datetime.utcnow()}] IdentityManager: Starting _sync_logic for track {track_id}\n")
        with self._global_lock:
            now = datetime.utcnow()
            now_ts = time.time()
            session = SessionLocal()
            try:
                # 1. --- Short-term RAM Cache Check ---
                # This prevents double counting when Cam A and Cam B see the same person at once.
                self._cleanup_cache(now_ts)
                matched_person_id = self._check_cache(embedding)
                
                best_person = None
                if matched_person_id:
                    print(f"[Identity-Cache] Match FOUND in RAM for track {track_id} -> {matched_person_id}")
                    best_person = session.get(Person, matched_person_id)
                    best_score = 1.0 # Force match
                else:
                    # 2. --- Database Vector Search ---
                    best_person = session.query(Person).order_by(
                        Person.face_embedding.cosine_distance(embedding)
                    ).first()

                    best_score = 0
                    if best_person:
                        distance = session.scalar(
                            select(Person.face_embedding.cosine_distance(embedding))
                            .where(Person.id == best_person.id)
                        )
                        best_score = 1 - distance
                        print(f"[Identity-Async] Best DB similarity for track {track_id}: {best_score:.4f} vs threshold {FACE_SIMILARITY_THRESHOLD}")

                # 3. --- Identity Resolution Logic ---
                if not best_person or best_score < FACE_SIMILARITY_THRESHOLD:
                    print(f"[Identity-Async] Creating NEW person for track {track_id} (Score: {best_score:.4f})")
                    person = Person(
                        face_embedding=embedding,
                        first_seen=now,
                        last_seen=now,
                        last_visit_date=now.date(),
                        gender_age=gender_age
                    )
                    session.add(person)
                    session.flush() # Get the ID
                    
                    visit = Visit(
                        person_id=person.id,
                        start_time=now,
                        end_time=now + timedelta(seconds=1)
                    )
                    session.add(visit)
                    self._update_daily(session, unique=True)
                    
                    # Add to cache for other cameras to find
                    self._add_to_cache(person.id, embedding, now_ts)

                else:
                    person = best_person
                    person.last_seen = now
                    if gender_age:
                        person.gender_age = gender_age

                    last_visit = session.execute(
                        select(Visit)
                        .where(Visit.person_id == person.id)
                        .order_by(Visit.end_time.desc())
                    ).scalars().first()

                    if not last_visit or (now - last_visit.end_time) > timedelta(minutes=REENTRY_TIME_MINUTES):
                        # Fresh visit
                        session.add(Visit(
                            person_id=person.id,
                            start_time=now,
                            end_time=now + timedelta(seconds=1)
                        ))
                        if person.last_visit_date != now.date():
                            person.daily_visit_count = 1
                        else:
                            person.daily_visit_count += 1
                        person.last_visit_date = now.date()
                        person.visit_count += 1
                        self._update_daily(session, unique=True)
                    else:
                        # Ongoing visit - just update end time
                        last_visit.end_time = now
                    
                    # Update cache with latest sighting to keep it fresh
                    self._add_to_cache(person.id, embedding, now_ts)

                session.commit()
            except Exception as e:
                print(f"[Identity-Async] ERROR: {e}")
                session.rollback()
            finally:
                session.close()

    def _cleanup_cache(self, now_ts):
        self._short_term_cache = [
            item for item in self._short_term_cache 
            if now_ts - item["timestamp"] <= self._cache_ttl
        ]

    def _add_to_cache(self, person_id, embedding, timestamp):
        # Update if exists, or append
        for item in self._short_term_cache:
            if item["person_id"] == person_id:
                item["timestamp"] = timestamp
                item["embedding"] = embedding
                return
        self._short_term_cache.append({
            "person_id": person_id,
            "embedding": embedding,
            "timestamp": timestamp
        })

    def _check_cache(self, embedding):
        """Check if embedding matches anyone seen in the last 60s on ANY camera."""
        best_match = None
        best_sim = 0
        
        for item in self._short_term_cache:
            # Cosine similarity for normalized vectors is just the dot product
            sim = np.dot(embedding, item["embedding"])
            if sim > self._cache_threshold and sim > best_sim:
                best_sim = sim
                best_match = item["person_id"]
        
        return best_match

    def _update_daily(self, session, unique=False):

        today = datetime.utcnow().date()
        stats = session.get(DailyAnalytics, today)

        if not stats:
            stats = DailyAnalytics(day=today)
            session.add(stats)

        # stats.total_flow += 1
        stats.total_flow = (stats.total_flow or 0) + 1
        if unique:
            stats.unique_count = (stats.unique_count or 0) + 1
            # stats.unique_count += 1

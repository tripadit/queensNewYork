"""
Identity resolution logic.
Handles Ram vs Shyam and 20-minute rule.
"""

from datetime import datetime, timedelta, date
from sqlalchemy import select
from scipy.spatial.distance import cosine
from app.db import Person, Visit, DailyAnalytics
from app.core import SessionLocal
from app.core import FACE_SIMILARITY_THRESHOLD, REENTRY_TIME_MINUTES

class IdentityManager:

    def sync_detection_to_db(self, embedding, track_id):
        now = datetime.utcnow()
        session = SessionLocal()

        people = session.execute(select(Person)).scalars().all()

        best_person = None
        best_score = 0

        # Mathematical logic:
        # cosine_similarity = 1 - cosine_distance
        for person in people:
            score = 1 - cosine(embedding, person.face_embedding)
            if score > best_score:
                best_score = score
                best_person = person

        if best_score < FACE_SIMILARITY_THRESHOLD:
            person = Person(
                face_embedding=embedding,
                first_seen=now,
                last_seen=now,
                last_visit_date=now.date()
            )
            session.add(person)
            session.flush()

            visit = Visit(
                person_id=person.id,
                start_time=now,
                end_time=now + timedelta(seconds=1)
            )
            session.add(visit)
            self._update_daily(session, unique=True)

        else:
            person = best_person
            person.last_seen = now

            last_visit = session.execute(
                select(Visit)
                .where(Visit.person_id == person.id)
                .order_by(Visit.end_time.desc())
            ).scalars().first()

            if (now - last_visit.end_time) > timedelta(minutes=REENTRY_TIME_MINUTES):
                # Re-entry: treat as new visit session
                session.add(Visit(
                    person_id=person.id,
                    start_time=now,
                    end_time=now + timedelta(seconds=1)
                ))
                
                # Reset daily_visit_count if it's a new day
                if person.last_visit_date != now.date():
                    person.daily_visit_count = 1
                    person.last_visit_date = now.date()
                else:
                    person.daily_visit_count += 1
                
                # Increment lifetime visit count
                person.visit_count += 1
                
                self._update_daily(session, unique=True)
            else:
                last_visit.end_time = now

        session.commit()
        session.close()

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

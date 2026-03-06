"""
Database schema.
Person = permanent identity
Visit = session-based presence
DailyAnalytics = aggregated counts
"""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, DateTime, Date, Integer, ForeignKey, Boolean, LargeBinary, String, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from pgvector.sqlalchemy import Vector

Base = declarative_base()

class Person(Base):
    __tablename__ = "people"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    face_embedding = Column(Vector(512))  # InsightFace output
    name_label = Column(String, default="Unknown")
    is_staff = Column(Boolean, default=False)
    staff_name = Column(String)
    first_seen = Column(DateTime)  # Set explicitly when person is first detected
    last_seen = Column(DateTime)   # Updated on each detection
    visit_count = Column(Integer, default=1)  # Total visits lifetime
    daily_visit_count = Column(Integer, default=1)  # Visits today
    last_visit_date = Column(Date)  # Track last visit date for daily reset
    gender_age = Column(String)  # Age and gender prediction (e.g., "Female Age- 25")

    visits = relationship("Visit", back_populates="person")


class StaffProfile(Base):
    __tablename__ = "staff_profiles"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    embedding = Column(Vector(512))  # DeepFace Facenet512 or InsightFace output
    image = Column(LargeBinary) # Store the face image for reference
    created_at = Column(DateTime, default=datetime.utcnow)


class DetectionsLog(Base):
    __tablename__ = "detections_log"

    id = Column(Integer, primary_key=True)
    tracking_id = Column(Integer)
    label = Column(String(50)) # 'Staff', 'Customer', 'Unknown'
    confidence = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)


class WeaponDetectionLog(Base):
    __tablename__ = "weapon_detection_logs"

    id = Column(Integer, primary_key=True)
    label = Column(String(50)) # 'Handgun', 'Weapon', etc.
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)


class LoiteringLog(Base):
    __tablename__ = "loitering_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    track_id = Column(Integer, nullable=False, index=True)
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration = Column(Float, nullable=True)
    is_alert = Column(Boolean, default=False)
    status = Column(String, default="tracking") # tracking | loitering | left


class Visit(Base):
    __tablename__ = "visits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)

    person = relationship("Person", back_populates="visits")


class DailyAnalytics(Base):
    __tablename__ = "daily_analytics"

    day = Column(Date, primary_key=True)
    total_flow = Column(Integer, default=0)
    unique_count = Column(Integer, default=0)

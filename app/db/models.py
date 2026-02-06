"""
Database schema.
Person = permanent identity
Visit = session-based presence
DailyAnalytics = aggregated counts
"""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, DateTime, Date, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy import String

Base = declarative_base()

class Person(Base):
    __tablename__ = "people"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    face_embedding = Column(Vector(512))  # InsightFace output
    name_label = Column(String, default="Unknown")
    first_seen = Column(DateTime)  # Set explicitly when person is first detected
    last_seen = Column(DateTime)   # Updated on each detection
    visit_count = Column(Integer, default=1)  # Total visits lifetime
    daily_visit_count = Column(Integer, default=1)  # Visits today
    last_visit_date = Column(Date)  # Track last visit date for daily reset

    visits = relationship("Visit", back_populates="person")


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

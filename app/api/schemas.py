"""
Pydantic schemas for API responses.
"""
from pydantic import BaseModel
from datetime import datetime, date
import uuid

class Person(BaseModel):
    id: uuid.UUID
    name_label: str
    first_seen: datetime
    last_seen: datetime
    visit_count: int
    daily_visit_count: int
    last_visit_date: date

    class Config:
        from_attributes = True

class Visit(BaseModel):
    id: uuid.UUID
    person_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    person: Person

    class Config:
        from_attributes = True

class DailyAnalytics(BaseModel):
    day: date
    total_flow: int
    unique_count: int

    class Config:
        from_attributes = True

class AnalyticsSummary(BaseModel):
    total_visits_today: int
    unique_visitors_today: int
    conversion_rate: float

class HourlyFlow(BaseModel):
    hour: int
    count: int

class RecentVisit(BaseModel):
    person_name: str
    start_time: datetime
    end_time: datetime

class CustomerStats(BaseModel):
    new_customers: int
    returning_customers: int

class TopCustomer(BaseModel):
    name: str
    visits: int

class VisitDurationDistribution(BaseModel):
    duration_range: str
    count: int

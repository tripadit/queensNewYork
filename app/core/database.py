"""
SQLAlchemy 2.0 database setup.
Uses scoped session to avoid connection leaks during streaming.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core import DATABASE_URL

engine = create_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

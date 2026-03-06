"""
Run this ONCE to create tables in PostgreSQL.
"""

from app.core.database import engine
from app.db.models import Base

from sqlalchemy import text

print("Creating tables...")
with engine.connect() as connection:
    
    connection.commit()

Base.metadata.create_all(bind=engine)
print("Tables created successfully.")

# Create pgvector extension if not exists
with engine.connect() as connection:
    connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    connection.commit()
    print("Vector extension checked.")

# Add new columns to existing people table
print("Adding new columns to people table...")
with engine.connect() as connection:
    connection.execute(text("""
        ALTER TABLE people 
        ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS daily_visit_count INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS last_visit_date DATE,
        ADD COLUMN IF NOT EXISTS gender_age VARCHAR,
        ADD COLUMN IF NOT EXISTS is_staff BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS staff_name VARCHAR;
    """))
    connection.commit()
    print("Columns added successfully.")

# Create loitering_logs table if not exists
print("Creating loitering_logs table...")
with engine.connect() as connection:
    connection.execute(text("""
        CREATE TABLE IF NOT EXISTS loitering_logs (
            id SERIAL PRIMARY KEY,
            track_id INTEGER NOT NULL,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP,
            duration FLOAT,
            is_alert BOOLEAN DEFAULT FALSE,
            status VARCHAR DEFAULT 'tracking'
        );
    """))
    connection.commit()
    print("Loitering table checked.")

# Initialize visit counts for existing people
print("Initializing visit counts...")
with engine.connect() as connection:
    # Set visit_count based on number of visits per person
    connection.execute(text("""
        UPDATE people 
        SET visit_count = COALESCE((SELECT COUNT(*) FROM visits WHERE visits.person_id = people.id), 1),
            daily_visit_count = COALESCE((SELECT COUNT(*) FROM visits WHERE visits.person_id = people.id AND DATE(visits.start_time) = CURRENT_DATE), 1),
            last_visit_date = (SELECT DATE(MAX(end_time)) FROM visits WHERE visits.person_id = people.id);
    """))
    connection.commit()
    print("Visit counts initialized.")

# Update first_seen and last_seen to be set from visits
print("Updating first_seen and last_seen timestamps...")
with engine.connect() as connection:
    connection.execute(text("""
        UPDATE people 
        SET first_seen = (SELECT MIN(start_time) FROM visits WHERE visits.person_id = people.id),
            last_seen = (SELECT MAX(end_time) FROM visits WHERE visits.person_id = people.id)
        WHERE first_seen IS NULL OR last_seen IS NULL;
    """))
    connection.commit()
    print("Timestamps updated successfully.")

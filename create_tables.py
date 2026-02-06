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

# Add new columns to existing people table
print("Adding new columns to people table...")
with engine.connect() as connection:
    connection.execute(text("""
        ALTER TABLE people 
        ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS daily_visit_count INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS last_visit_date DATE;
    """))
    connection.commit()
    print("Columns added successfully.")

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

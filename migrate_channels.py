"""
Database Migration Script: Add channel_id columns.
"""
from sqlalchemy import create_engine, text
from app.core.config import DATABASE_URL

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Starting migration: Adding channel_id columns...")
        
        tables = ["detections_log", "weapon_detection_logs", "loitering_logs"]
        
        for table in tables:
            try:
                # Add column if it doesn't exist
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS channel_id VARCHAR(50);"))
                conn.commit()
                print(f"Successfully updated table: {table}")
            except Exception as e:
                print(f"Error updating table {table}: {e}")
        
    print("Migration complete.")

if __name__ == "__main__":
    migrate()

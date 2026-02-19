import sys
import os
import time

# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import db

def init_db():
    retries = 5
    while retries > 0:
        try:
            db.connect()
            break
        except Exception as e:
            print(f"Database connection failed. Retrying in 5 seconds... ({retries} retries left)")
            time.sleep(5)
            retries -= 1
    
    if not db.connection_pool:
        print("Failed to connect to the database.")
        return

    commands = [
        "CREATE EXTENSION IF NOT EXISTS vector;",
        """
        CREATE TABLE IF NOT EXISTS staff_profiles (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            embedding VECTOR(512),
            image BYTEA,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS detections_log (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            tracking_id INT,
            label TEXT,
            confidence FLOAT
        );
        """,
        "CREATE INDEX IF NOT EXISTS staff_embedding_idx ON staff_profiles USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);"
    ]

    try:
        with db.get_cursor() as cursor:
            for command in commands:
                cursor.execute(command)
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Error initializing database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()

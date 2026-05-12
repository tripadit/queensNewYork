from sqlalchemy import create_engine, inspect, text
from app.core.config import DATABASE_URL

engine = create_engine(DATABASE_URL)

def check_db():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables in database: {tables}")
    
    with engine.connect() as conn:
        for table in tables:
            try:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"Table '{table}' has {count} rows.")
            except Exception as e:
                print(f"Error querying table '{table}': {e}")

if __name__ == "__main__":
    check_db()

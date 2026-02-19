import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from app.core.config import settings

class Database:
    def __init__(self):
        self.connection_pool = None

    def connect(self):
        if not self.connection_pool:
            try:
                self.connection_pool = psycopg2.pool.SimpleConnectionPool(
                    1, 20,
                    dsn=settings.DATABASE_URL
                )
                print("Database connection pool created successfully")
            except (Exception, psycopg2.DatabaseError) as error:
                print("Error while connecting to PostgreSQL", error)

    def close(self):
        if self.connection_pool:
            self.connection_pool.closeall()
            print("Database connection pool closed")

    @contextmanager
    def get_cursor(self):
        conn = self.connection_pool.getconn()
        try:
            cursor = conn.cursor()
            yield cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            self.connection_pool.putconn(conn)

db = Database()

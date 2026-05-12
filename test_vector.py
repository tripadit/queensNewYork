from sqlalchemy import create_engine, text
from app.core.config import DATABASE_URL
import numpy as np

engine = create_engine(DATABASE_URL)

def test_vector():
    print("Testing pgvector...")
    embedding = np.random.rand(512).astype(np.float32).tolist()
    
    with engine.connect() as conn:
        try:
            # Try a simple vector operation
            result = conn.execute(text("SELECT CAST(:emb AS vector) <=> CAST(:emb AS vector)"), {"emb": embedding}).scalar()
            print(f"Vector distance to itself: {result}")
            if result == 0:
                print("pgvector basic operation successful.")
            else:
                print(f"pgvector basic operation returned unexpected result: {result}")
        except Exception as e:
            print(f"pgvector basic operation FAILED: {e}")

if __name__ == "__main__":
    test_vector()

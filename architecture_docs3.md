# Architecture Documentation (Current vs. Target)

## 1. Current Workflow (The "3 Frame" Logic)
Each channel (8, 4, 16) operates in a siloed thread but shares a database.

```mermaid
graph TD
    subgraph "Video Sources"
        C8[Cam 8]
        C4[Cam 4]
        C16[Cam 16]
    end

    subgraph "Parallel Processing (High Resource Usage)"
        subgraph "Thread 8"
            Y8[YOLO 11] --> D8[DeepSort] --> F8[InsightFace]
        end
        subgraph "Thread 4"
            Y4[YOLO 11] --> D4[DeepSort] --> F4[InsightFace]
        end
        subgraph "Thread 16"
            Y16[YOLO 11] --> D16[DeepSort] --> F16[InsightFace]
        end
    end

    subgraph "Shared Identity Layer"
        IDM[IdentityManager]
        SIM[Scipy Cosine Similarity - Python Side]
    end

    C8 --> Y8
    C4 --> Y4
    C16 --> Y16

    F8 & F4 & F16 --> IDM
    IDM --> SIM
    SIM --> DB[(PostgreSQL)]
```

## 2. Why they "catch" people differently
*   **Spatial Coverage:** Each camera sees a different zone.
*   **Independent Tracking:** A "Track ID" is local to a camera. Track #1 on Cam 8 is NOT the same as Track #1 on Cam 4.
*   **Global Resolution:** They only "become the same person" once the Face Embedding is extracted and matched in the `IdentityManager`.

## 3. Required Changes (The "To-Do" List)

| Feature | Current State | Target State |
| :--- | :--- | :--- |
| **Face Search** | Linear scan in Python (Slow) | `pgvector` similarity search in SQL (Fast) |
| **Model Memory** | 3x instances of YOLO/Face Models | Shared Model Pool or Singleton |
| **Handover** | Purely face-based | Spatio-temporal logic (if Cam 8 sees exit, expect Cam 4 entry) |
| **Database** | Synchronous writes (blocks video) | Background task / Queue for DB logs |

## 4. Next Step: pgvector Implementation
The most critical change is moving `app/services/identity_manager.py` away from `scipy.spatial.distance.cosine` and using `vector <=> embedding` in the SQL query.

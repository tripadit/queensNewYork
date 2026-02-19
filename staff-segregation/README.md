# Staff Segregation System

## Project Description
The **Staff Segregation System** is a real-time computer vision application designed to distinguish between staff members and customers in a video stream. It leverages **YOLOv11** for robust person detection and **DeepFace (Facenet512)** for precise facial recognition. The system automatically tracks individuals, re-identifies staff members based on stored biometric profiles, and updates real-time statistics. This solution is ideal for retail analytics, secure area monitoring, and workforce management.

## Frontend Interface
The application features a clean, responsive web dashboard that provides:
-   **Live Video Feed**: A real-time stream from the connected camera (Webcam or RTSP) with bounding box annotations:
    -   **Green Box**: Identified Staff.
    -   **Red Box**: Detected Customer / Unknown.
-   **Real-time Statistics**: Live counters displaying the number of "Staff" and "Customers" currently in the frame.
-   **System Controls**: Simple **Start** and **Stop** buttons to control the background video processing pipeline, allowing you to pause resource-intensive tasks when monitoring is not required.

## Architecture
See [architecture.md](architecture.md) for a detailed mermaid diagram of the system architecture.

## Prerequisites
- **Python 3.10+** (Recommended)
- **PostgreSQL** with `pgvector` extension installed.
- **Git**

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository_url>
cd Staff-nonstaff
```

### 2. Set up Python Environment
Create a virtual environment to manage dependencies:
```bash
python -m venv venv
# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

Install the required packages:
```bash
pip install -r requirements.txt
```

### 3. Database Setup
This project requires a PostgreSQL database with the `pgvector` extension enabled.

1.  **Create a Database**: Log in to your PostgreSQL server and create a new database (e.g., `staff_db`).
2.  **Run Setup Script**: Execute the `setup_db.sql` script included in this repository to create the necessary tables and extensions.
    ```bash
    psql -U <username> -d staff_db -f setup_db.sql
    ```
    *Note: Ensure you have superuser privileges or sufficient permissions to create extensions.*

### 4. Configuration
Create a `.env` file in the project root directory with the following variables:

```ini
# Database Connection String
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/staff_db

# Camera Source (0 for webcam, or RTSP URL)
RTSP_URL=0
```

## Running the Application

Start the FastAPI server using `uvicorn`:

```bash
uvicorn app.main:app --port 8001
```

The API will be available at [http://localhost:8001](http://localhost:8001).

## Usage Guide

### 1. Web Dashboard
Open **[http://localhost:8001](http://localhost:8001)** in your browser.
1.  **Start System**: Click the **Start System** button to begin detecting and identifying people.
2.  **Monitor**: View the live video feed and real-time statistics (Staff vs Customer counts).
3.  **Logs**: View detection logs at [http://localhost:8001/logs](http://localhost:8001/logs).

### 2. API Control & Registration

#### Start Processing
**Linux / Git Bash:**
```bash
curl -X POST http://localhost:8001/start
```

**Windows (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:8001/start" -Method Post
# OR using curl.exe explicitly
curl.exe -X POST http://localhost:8001/start
```

#### Register Staff
Upload a clear photo of the staff member to register them.

**Linux / Git Bash:**
```bash
curl -X POST -F "name=Alice" -F "file=@/path/to/alice.jpg" http://localhost:8001/staff/register
```

**Windows (PowerShell):**
```powershell
# Requires curl.exe for multipart uploads
curl.exe -X POST -F "name=Alice" -F "file=@C:\path\to\alice.jpg" http://localhost:8001/staff/register
```

#### View Logs
```bash
curl http://localhost:8001/logs
```

#### Reset Cache (Troubleshooting)
If someone is incorrectly identified (e.g., registered as Staff but showing as Customer), use this to clear the tracking cache and force re-identification:

**Linux / Git Bash:**
```bash
curl -X POST http://localhost:8001/reset
```

**Windows (PowerShell):**
```powershell
curl.exe -X POST http://localhost:8001/reset
```

After resetting, move away from the camera and return to get a new tracking ID.

## Troubleshooting

### Person Not Recognized After Registration
**Symptom**: You registered as Staff but the system still shows you as Customer.

**Cause**: The system caches tracking IDs to avoid re-running face recognition every frame. If you were detected before registration, you're cached as "Customer".

**Solution**:
1. Call the reset endpoint: `curl.exe -X POST http://localhost:8001/reset`
2. Move out of camera view
3. Return to camera view - you'll get a new tracking ID and be recognized correctly

### Camera Access Issues
**Symptom**: "Failed to grab frame" or camera errors.

**Cause**: Another application (including another instance of this app) is using the camera.

**Solution**: Close other applications using the camera, or restart the system.

### Recognition Threshold
The system uses **Cosine Similarity** with a threshold of **0.7**. Distances below 0.7 are considered matches. If you experience false positives/negatives, you can adjust the threshold in `app/services/recognition.py` (line 36).

## License
[MIT License](LICENSE)

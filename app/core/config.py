"""
Central configuration file.
Replace database credentials before running.
"""

DATABASE_URL = "postgresql+psycopg2://cctv_user:cctv_pass@localhost:5432/diamond_db"

# Identity thresholds
FACE_SIMILARITY_THRESHOLD = 0.70   # cosine similarity
REENTRY_TIME_MINUTES = 20
LOITERING_THRESHOLD_SECONDS = 30

# Video
# CAMERA_INDEX = 0   # use RTSP URL later
RtSP_URL = "rtsp://admin:123456@192.168.1.149:554/stream1"

# Handover Zones (Polygons)
# These are now empty by default. Use the Loitering Console to draw them.
HANDOVER_CONFIG = {
    "stream1": { 
        "exit_zones": [],
        "entry_zones": [],
        "loitering_zones": []
    },
    "stream2": { 
        "exit_zones": [],
        "entry_zones": [],
        "loitering_zones": []
    },
    "3": { 
        "exit_zones": [],
        "entry_zones": [],
        "loitering_zones": []
    }
}

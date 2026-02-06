"""
Central configuration file.
Replace database credentials before running.
"""

DATABASE_URL = "postgresql+psycopg2://cctv_user:cctv_pass@localhost:5432/diamond_db"

# Identity thresholds
FACE_SIMILARITY_THRESHOLD = 0.80   # cosine similarity
REENTRY_TIME_MINUTES = 20

# Video
# CAMERA_INDEX = 0   # use RTSP URL later

RtSP_URL = "rtsp://admin:Seethos123@192.168.1.90:554/Streaming/Channels/101"
# RtSP_URL = "rtsp://testuser:qwert123@98.14.165.74:554/cam/realmonitor?channel=8&subtype=0"
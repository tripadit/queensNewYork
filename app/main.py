"""
FastAPI entrypoint.
"""
import asyncio
import cv2
import threading
import uuid
from contextlib import asynccontextmanager
from typing import List
from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from app.video import VideoProcessor
from app.core.config import RtSP_URL
from app.db import models
from datetime import date, timedelta
from sqlalchemy import func
from app.api import schemas
from app.core.database import SessionLocal
from fastapi.middleware.cors import CORSMiddleware

# A lock to ensure thread-safe access to the output frame
frame_lock = threading.Lock()
output_frame = None
stop_event = threading.Event()

def video_processing_thread():
    """
    The main video processing loop, running in a separate thread.
    """
    global output_frame
    
    # cap = cv2.VideoCapture(f"{RtSP_URL}?rtsp_transport=udp", cv2.CAP_FFMPEG)
    cap = cv2.VideoCapture(RtSP_URL, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    processor = VideoProcessor()

    while not stop_event.is_set():
        # Flush buffered frames
        for _ in range(3):
            cap.grab()
        #  Retrieve the latest frame
        ret, frame = cap.retrieve()
        if not ret:
            print("Failed to retrieve frame from camera.")
            # Optional: Add a small delay to prevent a tight loop on continuous failure
            stop_event.wait(1) 
            continue
        
        # 3️ Process only the latest frame
        processed_frame = processor.process(frame)
        
        with frame_lock:
            global output_frame
            output_frame = processed_frame.copy()

    cap.release()
    print("Video processing thread stopped.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Application startup: starting video processing background thread.")
    processing_thread = threading.Thread(target=video_processing_thread)
    processing_thread.start()
    yield
    # Shutdown
    print("Application shutdown: stopping video processing background thread.")
    stop_event.set()
    processing_thread.join()
    print("Background thread stopped successfully.")

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def generate_frames():
    """
    A generator function that yields the latest processed frame.
    """
    while True:
        with frame_lock:
            if output_frame is None:
                # If the first frame isn't ready yet, wait a bit and continue
                await asyncio.sleep(0.1)
                continue
            
            # Encode the frame as a JPEG
            (flag, encodedImage) = cv2.imencode(".jpg", output_frame)
            if not flag:
                continue

        # Yield the encoded frame
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' +
               bytearray(encodedImage) + b'\r\n')
        # Control the frame rate at which frames are sent to the client
        await asyncio.sleep(0.03) # ~30fps

@app.get("/stream")
async def stream():
    """
    The endpoint to stream the processed video.
    """
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/people", response_model=List[schemas.Person])
def get_people(db: Session = Depends(get_db)):
    return db.query(models.Person).all()

@app.put("/api/people/{person_id}", response_model=schemas.Person)
def update_person_name(person_id: uuid.UUID, name: str, db: Session = Depends(get_db)):
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    person.name_label = name
    db.commit()
    db.refresh(person)
    return person

@app.get("/api/visits", response_model=List[schemas.Visit])
def get_visits(db: Session = Depends(get_db)):
    return db.query(models.Visit).options(joinedload(models.Visit.person)).all()

@app.get("/api/daily_analytics", response_model=List[schemas.DailyAnalytics])
def get_daily_analytics(db: Session = Depends(get_db)):
    return db.query(models.DailyAnalytics).all()

@app.get("/api/analytics/summary", response_model=schemas.AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    today = date.today()
    
    total_visits_today = db.query(func.sum(models.Person.daily_visit_count)).filter(models.Person.last_visit_date == today).scalar() or 0
    
    unique_visitors_today = db.query(func.count(models.Person.id)).filter(models.Person.last_visit_date == today).scalar() or 0
    
    total_unique_visitors = db.query(func.count(models.Person.id)).scalar() or 0
    
    conversion_rate = (unique_visitors_today / total_unique_visitors) * 100 if total_unique_visitors > 0 else 0
    
    return schemas.AnalyticsSummary(
        total_visits_today=total_visits_today,
        unique_visitors_today=unique_visitors_today,
        conversion_rate=conversion_rate,
    )

@app.get("/api/analytics/hourly_flow", response_model=List[schemas.HourlyFlow])
def get_hourly_flow(db: Session = Depends(get_db)):
    today = date.today()
    
    hourly_flow = (
        db.query(
            func.extract("hour", models.Visit.start_time).label("hour"),
            func.count(models.Visit.id).label("count"),
        )
        .filter(func.date(models.Visit.start_time) == today)
        .group_by("hour")
        .order_by("hour")
        .all()
    )
    
    return [schemas.HourlyFlow(hour=h, count=c) for h, c in hourly_flow]

@app.get("/api/analytics/recent_visits", response_model=List[schemas.RecentVisit])

def get_recent_visits(db: Session = Depends(get_db), limit: int = 10):

    

    recent_visits = (

        db.query(models.Visit)

        .options(joinedload(models.Visit.person))

        .order_by(models.Visit.start_time.desc())

        .limit(limit)

        .all()

    )

    

    return [

        schemas.RecentVisit(

            person_name=visit.person.name_label,

            start_time=visit.start_time,

            end_time=visit.end_time,

        )

        for visit in recent_visits

    ]



@app.get("/api/analytics/customer_stats", response_model=schemas.CustomerStats)

def get_customer_stats(db: Session = Depends(get_db)):

    today = date.today()

    

    new_customers = db.query(func.count(models.Person.id)).filter(models.Person.last_visit_date == today, models.Person.visit_count == 1).scalar() or 0

    

    returning_customers = db.query(func.count(models.Person.id)).filter(models.Person.last_visit_date == today, models.Person.visit_count > 1).scalar() or 0

    

    return schemas.CustomerStats(

        new_customers=new_customers,

        returning_customers=returning_customers,

    )



@app.get("/api/analytics/top_customers", response_model=List[schemas.TopCustomer])

def get_top_customers(db: Session = Depends(get_db), limit: int = 5):

    

    top_customers = (

        db.query(models.Person)

        .order_by(models.Person.visit_count.desc())

        .limit(limit)

        .all()

    )

    

    return [

        schemas.TopCustomer(

            name=customer.name_label,

            visits=customer.visit_count,

        )

        for customer in top_customers

    ]



@app.get("/api/analytics/visit_duration_distribution", response_model=List[schemas.VisitDurationDistribution])

def get_visit_duration_distribution(db: Session = Depends(get_db)):

    

    visits = db.query(models.Visit).all()

    

    duration_ranges = {

        "0-5 min": 0,

        "5-15 min": 0,

        "15-30 min": 0,

        "30+ min": 0,

    }

    

    for visit in visits:

        if visit.end_time:

            duration = (visit.end_time - visit.start_time).total_seconds() / 60

            if duration <= 5:

                duration_ranges["0-5 min"] += 1

            elif duration <= 15:

                duration_ranges["5-15 min"] += 1

            elif duration <= 30:

                duration_ranges["15-30 min"] += 1

            else:

                duration_ranges["30+ min"] += 1

                

    return [

        schemas.VisitDurationDistribution(

            duration_range=duration_range,

            count=count,

        )

        for duration_range, count in duration_ranges.items()

    ]

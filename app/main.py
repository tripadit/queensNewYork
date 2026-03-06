"""
FastAPI entrypoint.
"""
import asyncio
import cv2
import threading
import uuid
from contextlib import asynccontextmanager
from typing import List
from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session, joinedload
from app.video import VideoProcessor
from app.core.config import RtSP_URL
from app.db import models
from datetime import date, timedelta
from sqlalchemy import func
from app.api import schemas
from app.core.database import SessionLocal
from fastapi.middleware.cors import CORSMiddleware

from concurrent.futures import ThreadPoolExecutor
from app.weapon.weapon_detector import WeaponDetector
from app.staff.staff_segregator import StaffSegregator
import os
import subprocess
import sys


# A lock to ensure thread-safe access to the output frame
frame_lock = threading.Lock()
output_frame = None
stop_event = threading.Event()

# Global instances for access in endpoints
staff_segregator = None
loitering_process = None

def video_processing_thread():
    """
    The main video processing loop, running in a separate thread.
    It orchestrates three parallel pipelines for each frame:
    1. Person Analytics (detection, tracking, identity)
    2. Weapon Detection (security alerts)
    3. Staff Segregation (staff vs customer recognition)
    """
    global output_frame, staff_segregator
    # cap = cv2.VideoCapture(f"{RtSP_URL}?rtsp_transport=udp", cv2.CAP_FFMPEG)
    cap = cv2.VideoCapture(RtSP_URL, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    # Instantiate the pipelines
    person_processor = VideoProcessor()
    weapon_detector = WeaponDetector()
    staff_segregator = StaffSegregator()

    # Create a thread pool to run the pipelines in parallel for EACH frame
    with ThreadPoolExecutor(max_workers=3) as executor:
        while not stop_event.is_set():
            # Flush buffered frames to get the most recent one
            for _ in range(3):
                cap.grab()
            
            ret, frame = cap.retrieve()
            if not ret:
                print("Failed to retrieve frame from camera.")
                stop_event.wait(1) 
                continue
            
            # --- Set the output frame for streaming immediately ---
            with frame_lock:
                output_frame = frame.copy()

            # --- Run all processing tasks in parallel for THIS frame ---
            # We use list(executor.map(...)) or wait for futures to ensure 
            # this frame is FULLY processed before we grab the next one.
            # This prevents the race condition where the same person is 
            # processed in multiple threads simultaneously.
            futures = [
                executor.submit(person_processor.process, frame.copy()),
                executor.submit(weapon_detector.detect, frame.copy()),
                executor.submit(staff_segregator.process, frame.copy())
            ]
            
            # Wait for all tasks for this frame to finish
            for future in futures:
                future.result() 

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
    
    global loitering_process
    if loitering_process:
        print("Terminating loitering microservice...")
        loitering_process.terminate()
        loitering_process.wait()
        
    print("Background thread stopped successfully.")

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:8000",
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




def _parse_gender_age(gender_age_str: str | None) -> tuple[str | None, int | None]:
    if not gender_age_str:
        return None, None
    
    # Handle cases like "Female Age- 25" and "Female Age-25"
    if ' Age- ' in gender_age_str:
        parts = gender_age_str.split(' Age- ')
        gender = parts[0].strip()
        age_str = parts[1].strip()
    elif ' Age-' in gender_age_str:
        parts = gender_age_str.split(' Age-')
        gender = parts[0].strip()
        age_str = parts[1].strip()
    else:
        return None, None

    gender = gender.strip()
    age = int(age_str) if age_str.isdigit() else None
    return gender, age

@app.get("/api/analytics/gender_age_distribution", response_model=schemas.GenderAgeDistribution)
def get_gender_age_distribution(db: Session = Depends(get_db)):
    people = db.query(models.Person).all()
    
    gender_age_counts = {}
    total_analyzed = 0

    age_bins = [0, 18, 25, 35, 45, 55, 65, 150] # Upper bound is exclusive
    age_labels = ["0-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
    
    for person in people:
        gender, age = _parse_gender_age(person.gender_age)
        
        if gender and age is not None:
            total_analyzed += 1
            age_group = None
            for i in range(len(age_bins) - 1):
                if age >= age_bins[i] and age < age_bins[i+1]:
                    age_group = age_labels[i]
                    break
            
            if age_group:
                key = (gender, age_group)
                gender_age_counts[key] = gender_age_counts.get(key, 0) + 1
    
    distribution = [
        schemas.AgeGenderStats(gender=key[0], age_group=key[1], count=count)
        for key, count in gender_age_counts.items()
    ]
    
    return schemas.GenderAgeDistribution(
        total_analyzed=total_analyzed,
        distribution=distribution
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

@app.post("/api/staff/register")
async def register_staff(name: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Save temp file
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        buffer.write(await file.read())
    
    img = cv2.imread(temp_filename)
    if img is None:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        raise HTTPException(status_code=400, detail="Could not read image")

    # Resize
    img_resized = cv2.resize(img, (500, 500))
    
    # Extract embedding using the global staff_segregator
    global staff_segregator
    if staff_segregator is None:
         if os.path.exists(temp_filename):
            os.remove(temp_filename)
         raise HTTPException(status_code=500, detail="Staff segregator not initialized")

    embedding = staff_segregator.get_embedding(img_resized)
    if not embedding:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        raise HTTPException(status_code=400, detail="Could not extract embedding")

    # Encode image to bytes for storage
    _, img_encoded = cv2.imencode('.jpg', img_resized)
    img_bytes = img_encoded.tobytes()

    staff = models.StaffProfile(name=name, embedding=embedding, image=img_bytes)
    db.add(staff)
    db.commit()
    
    if os.path.exists(temp_filename):
        os.remove(temp_filename)
    return {"status": "registered", "name": name}

@app.get("/api/staff/stats")
def get_staff_stats():
    if staff_segregator:
        return staff_segregator.current_stats
    return {"Staff": 0, "Customer": 0, "Unknown": 0}

@app.get("/api/staff/logs")
def get_staff_logs(db: Session = Depends(get_db), limit: int = 50):
    logs = db.query(models.DetectionsLog).order_by(models.DetectionsLog.timestamp.desc()).limit(limit).all()
    # Convert to JSON serializable list
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp.isoformat(),
            "tracking_id": log.tracking_id,
            "label": log.label,
            "confidence": log.confidence
        }
        for log in logs
    ]

@app.get("/api/weapon/logs")
def get_weapon_logs(db: Session = Depends(get_db), limit: int = 50):
    logs = db.query(models.WeaponDetectionLog).order_by(models.WeaponDetectionLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp.isoformat(),
            "label": log.label,
            "confidence": log.confidence
        }
        for log in logs
    ]

@app.post("/api/loitering/start")
def start_loitering():
    global loitering_process
    if loitering_process and loitering_process.poll() is None:
        return {"status": "already running"}
    
    # Run the microservice on port 8001
    env = os.environ.copy()
    env["PYTHONPATH"] = os.getcwd()
    
    cmd = [
        sys.executable, "-m", "uvicorn", 
        "app.loitering_service.main:app", 
        "--port", "8001", 
        "--host", "0.0.0.0"
    ]
    
    loitering_process = subprocess.Popen(cmd, env=env)
    return {"status": "started", "pid": loitering_process.pid}

@app.post("/api/loitering/stop")
def stop_loitering():
    global loitering_process
    if loitering_process:
        loitering_process.terminate()
        loitering_process.wait()
        loitering_process = None
        return {"status": "stopped"}
    return {"status": "not running"}

@app.get("/api/loitering/status")
def get_loitering_status():
    global loitering_process
    is_running = loitering_process is not None and loitering_process.poll() is None
    return {"is_running": is_running}

@app.get("/api/loitering/logs", response_model=List[schemas.LoiteringLog])
def get_loitering_logs(db: Session = Depends(get_db), limit: int = 50):
    return db.query(models.LoiteringLog).order_by(models.LoiteringLog.id.desc()).limit(limit).all()

@app.get("/api/staff/profiles")
def get_staff_profiles(db: Session = Depends(get_db)):
    profiles = db.query(models.StaffProfile).all()
    return [
        {
            "id": profile.id,
            "name": profile.name,
            "created_at": profile.created_at.isoformat()
        }
        for profile in profiles
    ]

@app.get("/api/loitering/stats", response_model=schemas.LoiteringStats)
def get_loitering_stats(db: Session = Depends(get_db)):
    total = db.query(models.LoiteringLog).count()
    alerts = db.query(models.LoiteringLog).filter(models.LoiteringLog.is_alert == True).count()
    # For active_in_zone, we'd ideally query the microservice, but for now we'll return a placeholder
    # or the frontend can fetch it directly from :8001 if needed.
    return schemas.LoiteringStats(total_events=total, total_alerts=alerts, active_in_zone=0)

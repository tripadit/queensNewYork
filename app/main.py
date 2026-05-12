"""
FastAPI entrypoint.
"""
import asyncio
import cv2
import threading
import uuid
import os
import subprocess
import sys
import io
import traceback
from contextlib import asynccontextmanager
from typing import List
from datetime import date, datetime

from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, text
from concurrent.futures import ThreadPoolExecutor

from app.video import VideoProcessor
from app.core.config import RtSP_URL
from app.db import models
from app.api import schemas
from app.core.database import SessionLocal
from app.weapon.weapon_detector import WeaponDetector
from app.services.report_service import report_service

# Force OpenCV to use TCP for RTSP streams and set a 10s timeout + increased buffer.
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|timeout;10000000|buffer_size;10240000"

# A lock to ensure thread-safe access to the output frame
processors = {}
CHANNELS = ["stream1", "stream2", "3"]
RTSP_URL_MAP = {
    "stream1": "rtsp://admin:123456@192.168.1.149:554/stream1",
    "stream2": "rtsp://admin:123456@192.168.1.149:554/stream2"
}
loitering_process = None

class ChannelProcessor:
    def __init__(self, channel_id: str):
        self.channel_id = channel_id
        self.rtsp_url = RTSP_URL_MAP.get(channel_id)
        self.output_frame = None
        self.frame_lock = threading.Lock()
        self.stop_event = threading.Event()
        self.current_stats = {"Staff": 0, "Customer": 0, "Unknown": 0}
        
        self.person_processor = VideoProcessor(channel_id)
        self.weapon_detector = WeaponDetector(channel_id)

    def run(self):
        print(f"Starting video processing for Channel {self.channel_id}")
        
        if not self.rtsp_url:
            import numpy as np
            # Create a black frame for blank channels
            black_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
            cv2.putText(black_frame, f"Channel {self.channel_id} - No Feed", (400, 360), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            while not self.stop_event.is_set():
                with self.frame_lock:
                    self.output_frame = black_frame.copy()
                self.stop_event.wait(1)
            return

        cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        with ThreadPoolExecutor(max_workers=2) as executor:
            while not self.stop_event.is_set():
                for _ in range(3): cap.grab()
                ret, frame = cap.retrieve()
                if not ret:
                    cap.release(); cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1); self.stop_event.wait(2); continue
                
                with self.frame_lock: self.output_frame = frame.copy()
                futures = [
                    executor.submit(self.person_processor.process, frame.copy()),
                    executor.submit(self.weapon_detector.detect, frame.copy())
                ]
                for future in futures:
                    try: future.result()
                    except Exception as e: print(f"Error in processing future for channel {self.channel_id}: {e}")
                self.current_stats = self.person_processor.current_stats
        cap.release()

    def start(self):
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()

    def stop(self):
        self.stop_event.set()
        if hasattr(self, 'thread'): self.thread.join()

@asynccontextmanager
async def lifespan(app: FastAPI):
    for cid in CHANNELS:
        cp = ChannelProcessor(cid); processors[cid] = cp; cp.start()
    yield
    for cp in processors.values(): cp.stop()
    if loitering_process: loitering_process.terminate(); loitering_process.wait()

app = FastAPI(lifespan=lifespan)

origins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:8000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

async def generate_frames(channel_id: str):
    processor = processors.get(channel_id)
    if not processor: return
    loop = asyncio.get_event_loop()
    while True:
        frame_to_encode = None
        with processor.frame_lock:
            if processor.output_frame is not None: frame_to_encode = processor.output_frame.copy()
        if frame_to_encode is None: await asyncio.sleep(0.05); continue
        result = await loop.run_in_executor(None, lambda: cv2.imencode(".jpg", frame_to_encode, [int(cv2.IMWRITE_JPEG_QUALITY), 80]))
        flag, encodedImage = result
        if not flag: continue
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + bytearray(encodedImage) + b'\r\n')
        await asyncio.sleep(0.05)

@app.get("/stream")
async def stream(channel: str = "stream1"):
    if channel not in processors: raise HTTPException(status_code=404, detail="Channel not found")
    return StreamingResponse(generate_frames(channel), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/api/people", response_model=List[schemas.Person])
def get_people(db: Session = Depends(get_db)):
    return db.query(models.Person).all()

@app.put("/api/people/{person_id}", response_model=schemas.Person)
def update_person_name(person_id: uuid.UUID, name: str, db: Session = Depends(get_db)):
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not person: raise HTTPException(status_code=404, detail="Person not found")
    person.name_label = name
    db.commit(); db.refresh(person); return person

@app.get("/api/visits", response_model=List[schemas.Visit])
def get_visits(db: Session = Depends(get_db)):
    return db.query(models.Visit).options(joinedload(models.Visit.person)).all()

@app.get("/api/daily_analytics", response_model=List[schemas.DailyAnalytics])
def get_daily_analytics(db: Session = Depends(get_db)):
    return db.query(models.DailyAnalytics).all()

@app.get("/api/analytics/summary", response_model=schemas.AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    today = date.today()
    
    # Total entries today
    total_visits_today = db.query(func.sum(models.Person.daily_visit_count)).filter(models.Person.last_visit_date == today).scalar() or 0
    
    # Unique visitors today
    unique_visitors_today = db.query(func.count(models.Person.id)).filter(models.Person.last_visit_date == today).scalar() or 0
    
    # Total unique visitors in system
    total_unique_visitors = db.query(func.count(models.Person.id)).scalar() or 0
    
    # Conversion Rate: Unique today vs Total database
    conversion_rate = (unique_visitors_today / total_unique_visitors) * 100 if total_unique_visitors > 0 else 0
    
    # Loyalty Rate: Returning customers today vs Total unique today
    returning_today = db.query(func.count(models.Person.id)).filter(
        models.Person.last_visit_date == today,
        models.Person.visit_count > 1
    ).scalar() or 0
    loyalty_rate = (returning_today / unique_visitors_today * 100) if unique_visitors_today > 0 else 0

    # Avg Dwell: Avg duration of visits today in minutes
    avg_dwell_sec = db.query(func.avg(
        func.extract('epoch', models.Visit.end_time) - func.extract('epoch', models.Visit.start_time)
    )).filter(func.date(models.Visit.start_time) == today).scalar() or 0
    avg_dwell = round(float(avg_dwell_sec) / 60, 1) if avg_dwell_sec else 0

    return schemas.AnalyticsSummary(
        total_visits_today=total_visits_today, 
        unique_visitors_today=unique_visitors_today, 
        conversion_rate=conversion_rate,
        avg_dwell=avg_dwell,
        loyalty_rate=loyalty_rate
    )

@app.get("/api/analytics/hourly_flow", response_model=List[schemas.HourlyFlow])
def get_hourly_flow(db: Session = Depends(get_db)):
    today = date.today()
    hourly_flow = db.query(func.extract("hour", models.Visit.start_time).label("hour"), func.count(models.Visit.id).label("count")).filter(func.date(models.Visit.start_time) == today).group_by("hour").order_by("hour").all()
    return [schemas.HourlyFlow(hour=int(h), count=c) for h, c in hourly_flow]

@app.get("/api/analytics/customer_stats", response_model=schemas.CustomerStats)
def get_customer_stats(db: Session = Depends(get_db)):
    today = date.today()
    new = db.query(func.count(models.Person.id)).filter(models.Person.last_visit_date == today, models.Person.visit_count == 1).scalar() or 0
    ret = db.query(func.count(models.Person.id)).filter(models.Person.last_visit_date == today, models.Person.visit_count > 1).scalar() or 0
    return schemas.CustomerStats(new_customers=new, returning_customers=ret)

def _parse_gender_age(ga_str: str | None) -> tuple[str | None, int | None]:
    if not ga_str: return None, None
    try:
        if ' Age- ' in ga_str: parts = ga_str.split(' Age- ')
        elif ' Age-' in ga_str: parts = ga_str.split(' Age-')
        else: return None, None
        return parts[0].strip(), int(parts[1].strip())
    except: return None, None

@app.get("/api/analytics/gender_age_distribution", response_model=schemas.GenderAgeDistribution)
def get_gender_age_distribution(db: Session = Depends(get_db)):
    people = db.query(models.Person).all()
    counts = {}; total = 0
    bins = [0, 18, 25, 35, 45, 55, 65, 150]; labels = ["0-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
    for p in people:
        g, a = _parse_gender_age(p.gender_age)
        if g and a is not None:
            total += 1; group = None
            for i in range(len(bins)-1):
                if a >= bins[i] and a < bins[i+1]: group = labels[i]; break
            if group: counts[(g, group)] = counts.get((g, group), 0) + 1
    dist = [schemas.AgeGenderStats(gender=k[0], age_group=k[1], count=v) for k, v in counts.items()]
    return schemas.GenderAgeDistribution(total_analyzed=total, distribution=dist)

@app.get("/api/analytics/top_customers", response_model=List[schemas.TopCustomer])
def get_top_customers(db: Session = Depends(get_db), limit: int = 5):
    top = db.query(models.Person).order_by(models.Person.visit_count.desc()).limit(limit).all()
    return [schemas.TopCustomer(name=c.name_label, visits=c.visit_count) for c in top]

@app.get("/api/analytics/visit_duration_distribution", response_model=List[schemas.VisitDurationDistribution])
def get_visit_duration_distribution(db: Session = Depends(get_db)):
    visits = db.query(models.Visit).all(); ranges = {"0-5 min": 0, "5-15 min": 0, "15-30 min": 0, "30+ min": 0}
    for v in visits:
        if v.end_time:
            d = (v.end_time - v.start_time).total_seconds() / 60
            if d <= 5: ranges["0-5 min"] += 1
            elif d <= 15: ranges["5-15 min"] += 1
            elif d <= 30: ranges["15-30 min"] += 1
            else: ranges["30+ min"] += 1
    return [schemas.VisitDurationDistribution(duration_range=k, count=v) for k, v in ranges.items()]

@app.get("/api/reports/pdf")
def generate_pdf_report_endpoint(db: Session = Depends(get_db)):
    try:
        today = date.today()
        summary = get_analytics_summary(db)
        hourly = get_hourly_flow(db)
        customer = get_customer_stats(db)
        demographics = get_gender_age_distribution(db)
        
        report_data = {
            "summary": summary.model_dump() if hasattr(summary, 'model_dump') else summary,
            "hourly_flow": hourly,
            "customer_stats": customer.model_dump() if hasattr(customer, 'model_dump') else customer,
            "demographics": demographics.model_dump() if hasattr(demographics, 'model_dump') else demographics
        }
        
        pdf_bytes = report_service.generate_pdf_report(report_data)
        return Response(
            content=bytes(pdf_bytes), 
            media_type="application/pdf", 
            headers={"Content-Disposition": f"attachment; filename=seethos_report_{today.isoformat()}.pdf"}
        )
    except Exception as e:
        print(f"REPORT ERROR: {e}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})

@app.post("/api/staff/register")
async def register_staff(name: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    temp = f"temp_{file.filename}"
    with open(temp, "wb") as b: b.write(await file.read())
    img = cv2.imread(temp)
    if img is None: os.remove(temp); raise HTTPException(status_code=400, detail="Read error")
    img = cv2.resize(img, (500, 500))
    proc = processors[CHANNELS[0]].person_processor
    emb = proc.get_embedding(img)
    if not emb: os.remove(temp); raise HTTPException(status_code=400, detail="Emb error")
    _, enc = cv2.imencode('.jpg', img)
    staff = models.StaffProfile(name=name, embedding=emb, image=enc.tobytes())
    db.add(staff); db.commit(); os.remove(temp); return {"status": "ok"}

@app.get("/api/staff/stats")
def get_staff_stats(channel: str = "stream1"):
    p = processors.get(channel)
    return p.current_stats if p else {"Staff": 0, "Customer": 0, "Unknown": 0}

@app.get("/api/staff/logs")
def get_staff_logs(db: Session = Depends(get_db), limit: int = 50):
    logs = db.query(models.DetectionsLog).order_by(models.DetectionsLog.timestamp.desc()).limit(limit).all()
    return [{"id": l.id, "timestamp": l.timestamp.isoformat(), "tracking_id": l.tracking_id, "label": l.label, "confidence": l.confidence} for l in logs]

@app.get("/api/weapon/logs")
def get_weapon_logs(db: Session = Depends(get_db), limit: int = 50):
    logs = db.query(models.WeaponDetectionLog).order_by(models.WeaponDetectionLog.timestamp.desc()).limit(limit).all()
    return [{"id": l.id, "timestamp": l.timestamp.isoformat(), "label": l.label, "confidence": l.confidence} for l in logs]

@app.get("/api/loitering/status")
def get_loitering_status():
    global loitering_process
    return {"is_running": loitering_process is not None and loitering_process.poll() is None}

@app.get("/api/loitering/logs", response_model=List[schemas.LoiteringLog])
def get_loitering_logs(db: Session = Depends(get_db), limit: int = 50):
    return db.query(models.LoiteringLog).order_by(models.LoiteringLog.id.desc()).limit(limit).all()

@app.post("/api/loitering/polygon/{channel_id}")
def set_channel_polygon(channel_id: str, payload: dict):
    if channel_id not in processors: raise HTTPException(status_code=404, detail="Not found")
    processors[channel_id].person_processor.set_loitering_polygons(payload.get("polygon", []))
    return {"status": "ok"}

@app.get("/api/loitering/polygon/{channel_id}")
def get_channel_polygon(channel_id: str):
    if channel_id not in processors: raise HTTPException(status_code=404, detail="Not found")
    return {"polygon": processors[channel_id].person_processor.get_loitering_polygons()}

@app.get("/api/staff/profiles")
def get_staff_profiles(db: Session = Depends(get_db)):
    return [{"id": p.id, "name": p.name, "created_at": p.created_at.isoformat()} for p in db.query(models.StaffProfile).all()]

@app.get("/api/loitering/stats", response_model=schemas.LoiteringStats)
def get_loitering_stats(db: Session = Depends(get_db)):
    t = db.query(models.LoiteringLog).count(); a = db.query(models.LoiteringLog).filter(models.LoiteringLog.is_alert == True).count()
    return schemas.LoiteringStats(total_events=t, total_alerts=a, active_in_zone=0)

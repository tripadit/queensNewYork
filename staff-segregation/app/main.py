from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import threading
import time
import cv2
import os
from typing import List

from app.core.database import db
from app.services.camera import camera_service
from app.services.pipeline import pipeline_service
from app.services.recognition import recognition_service

app = FastAPI(title="Staff Segregation System")

@app.get("/", response_class=HTMLResponse)
def read_root():
    with open("app/templates/index.html", "r") as f:
        return f.read()

def generate_frames():
    while True:
        # Check if processing is active
        if not processing_active:
            # If not active, maybe send a placeholder or wait
            time.sleep(0.5)
            continue
            
        frame = pipeline_service.latest_frame
        if frame is not None:
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        time.sleep(0.03) # approx 30 fps

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/stats/current")
def get_current_stats():
    return pipeline_service.get_active_stats()

# Global state for processing thread
processing_active = False
processing_thread = None

def processing_loop():
    global processing_active
    print("Starting processing loop...")
    
    camera_service.start()
    
    while processing_active:
        # print("DEBUG: Loop iteration") 
        frame = camera_service.get_frame()
        if frame is not None:
            # print("DEBUG: Processing frame")
            pipeline_service.process_frame(frame)
            # print("DEBUG: Frame processed")
        else:
            print("DEBUG: generate_frames got None frame")
            time.sleep(0.1)
            
    camera_service.stop()
    print("Processing loop stopped.")

@app.on_event("startup")
def startup_event():
    # Attempt to connect to DB
    db.connect()

@app.on_event("shutdown")
def shutdown_event():
    global processing_active
    processing_active = False
    if processing_thread:
        processing_thread.join()
    db.close()

@app.post("/start")
def start_processing():
    global processing_active, processing_thread
    if processing_active:
        return {"status": "already running"}
    
    pipeline_service.reset()
    processing_active = True
    processing_thread = threading.Thread(target=processing_loop, daemon=True)
    processing_thread.start()
    return {"status": "started"}

@app.post("/stop")
def stop_processing():
    global processing_active
    processing_active = False
    return {"status": "stopping"}

@app.post("/reset")
def reset_cache():
    """Reset the pipeline cache to force re-recognition of all tracks"""
    pipeline_service.reset()
    return {"status": "cache cleared", "message": "All tracking IDs cleared. People will be re-identified."}

@app.post("/staff/register")
async def register_staff(name: str = Form(...), file: UploadFile = File(...)):
    # Save temp file
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        buffer.write(await file.read())
    
    success = recognition_service.register_staff(name, temp_filename)
    
    # Clean up
    if os.path.exists(temp_filename):
        os.remove(temp_filename)
        
    if success:
        return {"status": "registered", "name": name}
    else:
        return JSONResponse(status_code=400, content={"status": "failed", "detail": "Could not register staff. Check logs."})

@app.get("/logs")
def get_logs(limit: int = 50):
    query = """
    SELECT id, timestamp, tracking_id, label, confidence 
    FROM detections_log 
    ORDER BY timestamp DESC 
    LIMIT %s;
    """
    logs = []
    try:
        with db.get_cursor() as cursor:
            cursor.execute(query, (limit,))
            rows = cursor.fetchall()
            for row in rows:
                logs.append({
                    "id": row[0],
                    "timestamp": row[1].isoformat(),
                    "tracking_id": row[2],
                    "label": row[3],
                    "confidence": row[4]
                })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
        
    return logs

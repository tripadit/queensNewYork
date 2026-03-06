import asyncio
import threading
import time
import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.core.config import RtSP_URL
from app.loitering_service.loitering_processor import LoiteringProcessor
from contextlib import asynccontextmanager

# ---------------------------------------------------------------------------
# Globals
# ---------------------------------------------------------------------------
processor: LoiteringProcessor = None
capture: cv2.VideoCapture = None
_lock = threading.Lock()
_latest_frame = None
_running = False
ws_clients = []

def _alert_callback(alert_dict: dict):
    """Called from LoiteringProcessor when a loitering alert fires."""
    for ws in ws_clients:
        asyncio.run_coroutine_threadsafe(ws.send_json(alert_dict), asyncio.get_event_loop())

def _processing_loop():
    global _latest_frame, _running, capture, processor
    while _running:
        if capture is None or processor is None:
            time.sleep(0.1)
            continue
        
        # Flush buffer
        for _ in range(2):
            capture.grab()
            
        ret, frame = capture.retrieve()
        if not ret:
            print("Loitering service failed to retrieve frame.")
            time.sleep(1)
            continue
            
        annotated = processor.process_frame(frame)
        with _lock:
            _latest_frame = annotated
        time.sleep(0.03)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global processor, capture, _running
    
    # Default polygon (can be set via API)
    # Let's start with an empty one or a default square if you prefer
    processor = LoiteringProcessor(on_alert=_alert_callback)
    
    # capture = cv2.VideoCapture(f"{RtSP_URL}?rtsp_transport=udp", cv2.CAP_FFMPEG)
    capture = cv2.VideoCapture(f"{RtSP_URL}", cv2.CAP_FFMPEG)
    
    capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    _running = True
    worker = threading.Thread(target=_processing_loop, daemon=True)
    worker.start()
    
    yield
    
    _running = False
    if capture:
        capture.release()

app = FastAPI(title="Loitering Microservice", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/video_feed")
def video_feed():
    def _generate():
        while True:
            with _lock:
                frame = _latest_frame
            if frame is None:
                time.sleep(0.05)
                continue
            _, buf = cv2.imencode(".jpg", frame)
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n")
            time.sleep(0.04)
    return StreamingResponse(_generate(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.post("/api/polygon")
def set_polygon(payload: dict):
    coords = payload.get("polygon", [])
    if processor:
        processor.set_polygon([tuple(c) for c in coords])
    return {"status": "ok"}

@app.get("/api/polygon")
def get_polygon():
    return {"polygon": processor.get_polygon() if processor else []}

@app.websocket("/ws/alerts")
async def ws_alerts(ws: WebSocket):
    await ws.accept()
    ws_clients.append(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_clients.remove(ws)

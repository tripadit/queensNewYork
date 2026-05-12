import asyncio
import threading
import time
import cv2
import os
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

# Use FFMPEG flags to handle timeouts and transport more gracefully
# TCP is more reliable for RTSP streams to prevent "Picture does not contain data" errors
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|timeout;10000000|buffer_size;10240000"

def _alert_callback(alert_dict: dict):
    # ... (rest of the file)
    """Called from LoiteringProcessor when a loitering alert fires."""
    for ws in ws_clients:
        try:
            asyncio.run_coroutine_threadsafe(ws.send_json(alert_dict), asyncio.get_event_loop())
        except Exception:
            pass

def _processing_loop():
    global _latest_frame, _running, capture, processor
    
    reconnect_delay = 2
    
    while _running:
        if processor is None:
            time.sleep(0.1)
            continue
            
        if capture is None or not capture.isOpened():
            print(f"Loitering service: Connecting to {RtSP_URL}...")
            if capture:
                capture.release()
            capture = cv2.VideoCapture(RtSP_URL, cv2.CAP_FFMPEG)
            capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            if not capture.isOpened():
                print(f"Loitering service: Failed to open stream. Retrying in {reconnect_delay}s...")
                time.sleep(reconnect_delay)
                continue

        # Flush buffer to keep it real-time (skip old frames)
        # We only need the very latest frame
        grabbed_ok = True
        for _ in range(3):
            if not capture.grab():
                grabbed_ok = False
                break
            
        if not grabbed_ok:
            print("Loitering service: Lost connection during grab. Reconnecting...")
            capture.release()
            capture = None
            time.sleep(1)
            continue

        ret, frame = capture.retrieve()
        if not ret:
            print("Loitering service: Failed to retrieve frame (Picture empty). Reconnecting...")
            capture.release()
            capture = None
            time.sleep(1)
            continue
            
        try:
            annotated = processor.process_frame(frame)
            with _lock:
                _latest_frame = annotated
        except Exception as e:
            print(f"Error in loitering processing: {e}")
            
        time.sleep(0.01) # Small sleep to prevent CPU pegging

@asynccontextmanager
async def lifespan(app: FastAPI):
    global processor, capture, _running
    
    processor = LoiteringProcessor(on_alert=_alert_callback)
    
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
                time.sleep(0.1)
                continue
            
            # Encode as JPG for streaming
            ret, buf = cv2.imencode(".jpg", frame)
            if not ret:
                continue
                
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n")
            time.sleep(0.04) # ~25 FPS
            
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
            # Keep-alive or wait for close
            await ws.receive_text()
    except WebSocketDisconnect:
        if ws in ws_clients:
            ws_clients.remove(ws)
    except Exception:
        if ws in ws_clients:
            ws_clients.remove(ws)

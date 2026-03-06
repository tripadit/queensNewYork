'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Undo, 
  Play, 
  Square, 
  Layers,
  AlertTriangle,
  Clock,
  History
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

const MICROSERVICE_BASE = "http://localhost:8001";

export function LoiteringConsole() {
  const [isRunning, setIsRunning] = useState(false);
  const [polygon, setPolygon] = useState<number[][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<number[][]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Initial status and data fetch
  useEffect(() => {
    const init = async () => {
      try {
        const statusRes = await api.getLoiteringStatus();
        setIsRunning(statusRes.is_running);
        
        if (statusRes.is_running) {
          fetchPolygon();
          fetchLogs();
        }
      } catch (e) {
        console.error("Init error:", e);
      }
    };
    init();
    
    const interval = setInterval(() => {
      if (isRunning) {
        fetchLogs();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const fetchPolygon = async () => {
    try {
      const res = await api.getLoiteringPolygon();
      if (res.polygon) setPolygon(res.polygon);
    } catch (e) {
      console.error("Error fetching polygon:", e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.getLoiteringLogs();
      setLogs(res);
    } catch (e) {
      console.error("Error fetching logs:", e);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await api.startLoitering();
      setTimeout(() => {
        setIsRunning(true);
        fetchPolygon();
      }, 3000);
    } catch (e) {
      console.error("Error starting loitering:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await api.stopLoitering();
      setIsRunning(false);
    } catch (e) {
      console.error("Error stopping loitering:", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const draw = () => {
      canvas.width = img.clientWidth;
      canvas.height = img.clientHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pts = drawing ? drawPoints : polygon;
      if (pts.length === 0) return;

      const sx = canvas.width / (img.naturalWidth || canvas.width);
      const sy = canvas.height / (img.naturalHeight || canvas.height);

      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const dx = x * sx;
        const dy = y * sy;
        if (i === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      });
      if (!drawing && pts.length >= 3) ctx.closePath();

      ctx.strokeStyle = drawing ? '#facc15' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (!drawing && pts.length >= 3) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fill();
      }

      pts.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x * sx, y * sy, 6, 0, Math.PI * 2);
        ctx.fillStyle = drawing ? '#facc15' : '#ef4444';
        ctx.fill();
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(img);
    return () => ro.disconnect();
  }, [polygon, drawPoints, drawing]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const sx = (img.naturalWidth || canvas.width) / canvas.width;
    const sy = (img.naturalHeight || canvas.height) / canvas.height;
    const vx = Math.round(cx * sx);
    const vy = Math.round(cy * sy);

    setDrawPoints((prev) => [...prev, [vx, vy]]);
  };

  const savePoly = async () => {
    if (drawPoints.length < 3) return;
    try {
      await api.setLoiteringPolygon(drawPoints);
      setPolygon(drawPoints);
      setDrawPoints([]);
      setDrawing(false);
    } catch (e) {
      alert("Failed to save polygon. Ensure loitering service is running.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Loitering Monitoring</h1>
            <p className="text-sm text-gray-400">Restricted zone surveillance & polygon definition</p>
          </div>
        </div>
        <button
          onClick={isRunning ? handleStop : handleStart}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
            isRunning 
              ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isRunning ? (
            <><Square className="w-4 h-4" /> Stop Service</>
          ) : (
            <><Play className="w-4 h-4" /> Start Service</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Monitor */}
        <div className="lg:col-span-2">
          <Card className="bg-[#0A0A0A] border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-sm font-medium text-gray-300">Live Feed (Port 8001)</span>
              </div>
              <div className="flex items-center gap-2">
                {!drawing ? (
                  <button 
                    onClick={() => { setDrawing(true); setDrawPoints([]); }}
                    disabled={!isRunning}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-md text-xs border border-white/10 transition-colors disabled:opacity-50"
                  >
                    <Layers className="w-4 h-4" />
                    Define Zone
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={savePoly}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-md text-xs transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Zone
                    </button>
                    <button 
                      onClick={() => setDrawPoints(p => p.slice(0, -1))}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-md text-xs border border-white/10 transition-colors"
                    >
                      <Undo className="w-4 h-4" />
                      Undo
                    </button>
                    <button 
                      onClick={() => { setDrawing(false); setDrawPoints([]); }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-md text-xs border border-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {isRunning ? (
                <>
                  <img
                    ref={imgRef}
                    src={`${MICROSERVICE_BASE}/video_feed`}
                    alt="Loitering Stream"
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                  <canvas
                    ref={canvasRef}
                    className={`absolute top-0 left-0 w-full h-full ${drawing ? 'cursor-crosshair' : 'cursor-default'}`}
                    onClick={handleCanvasClick}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-600">
                  <Play className="w-16 h-16 opacity-20" />
                  <p className="text-sm font-medium">Service Offline. Click "Start Service" to begin monitoring.</p>
                </div>
              )}
              
              {drawing && (
                <div className="absolute top-4 left-4 bg-black/80 border border-yellow-500/50 p-2 rounded-md backdrop-blur-sm">
                  <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider mb-1">Drawing Mode</p>
                  <p className="text-xs text-gray-300">Click on the video to define the restricted polygon.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar / Logs */}
        <div className="lg:col-span-1">
          <Card className="bg-[#0A0A0A] border-white/5 h-full flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-white/[0.02]">
              <History className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Recent Events</h3>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {logs.length > 0 ? (
                  logs.map((log: any) => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-lg border transition-all ${
                        log.is_alert ? 'bg-red-500/10 border-red-500/20' : 'bg-white/[0.02] border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 uppercase">Track ID</span>
                          <span className="text-sm font-mono text-white">#{log.track_id}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          log.is_alert ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Duration: {log.duration ? `${log.duration.toFixed(1)}s` : '0s'}</span>
                        </div>
                        <span>{new Date(log.start_time).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-gray-600">
                    <AlertTriangle className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-xs">No events detected yet</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

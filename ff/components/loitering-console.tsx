'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Undo, 
  Layers,
  AlertTriangle,
  Clock,
  History,
  Video
} from 'lucide-react';
import { api, STREAM_URL } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const CHANNELS = [
  { id: 'stream1', name: 'Channel 1' },
  { id: 'stream2', name: 'Channel 2' },
  { id: '3', name: 'Channel 3' },
];

export function LoiteringConsole() {
  const [mounted, setMounted] = useState(false);
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
  const [polygon, setPolygon] = useState<number[][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<number[][]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchPolygon();
    fetchLogs();
    
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  const fetchPolygon = async () => {
    try {
      const res = await api.getLoiteringPolygon(activeChannel.id);
      setPolygon(res.polygon || []);
    } catch (e) {
      console.error("Error fetching polygon:", e);
      setPolygon([]);
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

  const deletePoly = async () => {
    if (!window.confirm("Are you sure you want to delete this zone?")) return;
    try {
      await api.setLoiteringPolygon(activeChannel.id, []);
      setPolygon([]);
      setDrawPoints([]);
      setDrawing(false);
    } catch (e) {
      alert("Failed to delete zone.");
    }
  };

  const savePoly = async () => {
    if (drawPoints.length < 3) {
      alert("Please draw at least 3 points to define a zone.");
      return;
    }
    try {
      await api.setLoiteringPolygon(activeChannel.id, drawPoints);
      setPolygon(drawPoints);
      setDrawPoints([]);
      setDrawing(false);
    } catch (e) {
      alert("Failed to save polygon.");
    }
  };

  // Drawing Logic
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
      if (!pts || pts.length === 0) return;

      const sx = canvas.width / (img.naturalWidth || canvas.width);
      const sy = canvas.height / (img.naturalHeight || canvas.height);

      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const dx = x * sx;
        const dy = y * sy;
        if (i === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      });
      if (pts.length >= 3 && !drawing) ctx.closePath();

      ctx.strokeStyle = drawing ? '#facc15' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (pts.length >= 3 && !drawing) {
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
            <h1 className="text-2xl font-bold text-white">Multi-Camera Loitering</h1>
            <p className="text-sm text-gray-400">Define restricted zones per camera channel</p>
          </div>
        </div>
        
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          {CHANNELS.map((channel) => (
            <button
              key={channel.id}
              onClick={() => {
                setActiveChannel(channel);
                setDrawing(false);
                setDrawPoints([]);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
                activeChannel.id === channel.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              )}
            >
              <Video className="w-3.5 h-3.5" />
              {channel.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Monitor */}
        <div className="lg:col-span-2">
          <Card className="bg-[#0A0A0A] border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-300">Live: {activeChannel.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {!drawing ? (
                  <>
                    <button 
                      onClick={() => { setDrawing(true); setDrawPoints([]); }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs transition-colors hover:bg-blue-700"
                    >
                      <Layers className="w-4 h-4" />
                      {polygon.length > 0 ? "Redraw Zone" : "Draw Zone"}
                    </button>
                    {polygon.length > 0 && (
                      <button 
                        onClick={deletePoly}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-md text-xs border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Zone
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button 
                      onClick={savePoly}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-md text-xs transition-colors hover:bg-green-600 font-bold"
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
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-500 rounded-md text-xs border border-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <img
                key={activeChannel.id}
                ref={imgRef}
                src={`${STREAM_URL}?channel=${activeChannel.id}`}
                alt="Loitering Stream"
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
              <canvas
                ref={canvasRef}
                className={`absolute top-0 left-0 w-full h-full ${drawing ? 'cursor-crosshair' : 'cursor-default'}`}
                onClick={handleCanvasClick}
              />
              
              {drawing && (
                <div className="absolute top-4 left-4 bg-black/80 border border-yellow-500/50 p-2 rounded-md backdrop-blur-sm">
                  <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider mb-1">Drawing Mode</p>
                  <p className="text-xs text-gray-300">Click to add points. Minimum 3 points required.</p>
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
              <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Global Loitering Events</h3>
            </div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
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
                          <span className="text-[10px] font-bold text-gray-500 uppercase px-1.5 py-0.5 bg-white/5 rounded">Cam {log.channel_id}</span>
                          <span className="text-sm font-mono text-white font-bold">#{log.track_id}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          log.is_alert ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/5 pt-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-mono">{log.duration ? `${log.duration.toFixed(1)}s` : '0s'}</span>
                        </div>
                        <span className="opacity-60">{mounted ? new Date(log.start_time).toLocaleTimeString() : '...'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-gray-600 opacity-40">
                    <AlertTriangle className="w-8 h-8 mb-2" />
                    <p className="text-xs font-medium uppercase tracking-widest">No events detected</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
      `}</style>
    </div>
  );
}

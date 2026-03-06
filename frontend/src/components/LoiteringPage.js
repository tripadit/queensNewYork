import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Paper,
  Container,
  IconButton,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Delete,
  Undo,
  PlayArrow,
  Stop,
  Layers,
} from '@mui/icons-material';
import {
  getLoiteringStatus,
  getLoiteringLogs,
  getLoiteringPolygon,
  setLoiteringPolygon,
  startLoitering,
  stopLoitering,
} from '../api';

const MICROSERVICE_BASE = "http://localhost:8001";

const LoiteringPage = ({ onBack }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [polygon, setPolygon] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  // 1. Initial status and data fetch
  useEffect(() => {
    const init = async () => {
      try {
        const statusRes = await getLoiteringStatus();
        setIsRunning(statusRes.data.is_running);
        
        // If already running, fetch current polygon from microservice
        if (statusRes.data.is_running) {
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
      const res = await getLoiteringPolygon();
      if (res.data.polygon) setPolygon(res.data.polygon);
    } catch (e) {
      console.error("Error fetching polygon:", e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await getLoiteringLogs();
      setLogs(res.data);
    } catch (e) {
      console.error("Error fetching logs:", e);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await startLoitering();
      // Wait a bit for service to boot
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
      await stopLoitering();
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pts = drawing ? drawPoints : polygon;
      if (pts.length === 0) return;

      // Scale from video coords (assuming fixed or natural) to display coords
      // The backend uses original frame coords. We need to know those.
      // Usually it's the naturalWidth/naturalHeight of the img.
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

      ctx.strokeStyle = drawing ? '#ffeb3b' : '#f44336';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (!drawing && pts.length >= 3) {
        ctx.fillStyle = 'rgba(244, 67, 54, 0.2)';
        ctx.fill();
      }

      // Draw points
      pts.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x * sx, y * sy, 6, 0, Math.PI * 2);
        ctx.fillStyle = drawing ? '#ffeb3b' : '#f44336';
        ctx.fill();
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(img);
    return () => ro.disconnect();
  }, [polygon, drawPoints, drawing]);

  const handleCanvasClick = (e) => {
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
      await setLoiteringPolygon(drawPoints);
      setPolygon(drawPoints);
      setDrawPoints([]);
      setDrawing(false);
    } catch (e) {
      alert("Failed to save polygon. Ensure loitering service is running.");
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', color: 'white', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
          <IconButton onClick={onBack} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Loitering Monitoring</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Restricted zone surveillance & polygon definition
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            color={isRunning ? "error" : "primary"}
            startIcon={isRunning ? <Stop /> : <PlayArrow />}
            onClick={isRunning ? handleStop : handleStart}
            disabled={loading}
          >
            {isRunning ? "Stop Service" : "Start Service"}
          </Button>
        </Box>

        <Grid container spacing={4}>
          {/* Main Monitor */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ bgcolor: '#1e293b', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                  <Typography variant="h6">Live Feed (Port 8001)</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!drawing ? (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<Layers />} 
                        onClick={() => { setDrawing(true); setDrawPoints([]); }}
                        disabled={!isRunning}
                      >
                        Define Zone
                      </Button>
                    ) : (
                      <>
                        <Button size="small" variant="contained" color="success" startIcon={<Save />} onClick={savePoly}>
                          Save Zone
                        </Button>
                        <Button size="small" variant="outlined" color="inherit" startIcon={<Undo />} onClick={() => setDrawPoints(p => p.slice(0, -1))}>
                          Undo
                        </Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<Delete />} onClick={() => { setDrawing(false); setDrawPoints([]); }}>
                          Cancel
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ position: 'relative', width: '100%', height: '600px', bgcolor: 'black' }}>
                  {isRunning ? (
                    <>
                      <img
                        ref={imgRef}
                        src={`${MICROSERVICE_BASE}/video_feed`}
                        alt="Loitering Stream"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        crossOrigin="anonymous"
                      />
                      <canvas
                        ref={canvasRef}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: drawing ? 'crosshair' : 'default' }}
                        onClick={handleCanvasClick}
                      />
                    </>
                  ) : (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                      <PlayArrow sx={{ fontSize: 80, mb: 2 }} />
                      <Typography>Service Offline. Click "Start Service" to begin monitoring.</Typography>
                    </Box>
                  )}
                  
                  {drawing && (
                    <Box sx={{ position: 'absolute', top: 16, left: 16, bgcolor: 'rgba(0,0,0,0.7)', p: 1, borderRadius: 1, border: '1px solid #ffeb3b' }}>
                      <Typography variant="caption" sx={{ color: '#ffeb3b', display: 'block' }}>DRAWING MODE</Typography>
                      <Typography variant="caption">Click on the video to define the restricted polygon.</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar / Logs */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ bgcolor: '#1e293b', borderRadius: 4, height: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Recent Loitering Events</Typography>
                <Paper sx={{ flexGrow: 1, bgcolor: 'transparent', overflow: 'auto', border: '1px solid rgba(255,255,255,0.05)' }} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}>Track ID</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}>Duration</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>{log.track_id}</TableCell>
                          <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>{log.duration ? `${log.duration.toFixed(1)}s` : '0s'}</TableCell>
                          <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                            <Chip 
                              size="small" 
                              label={log.status} 
                              color={log.is_alert ? "error" : "warning"} 
                              variant={log.status === 'left' ? 'outlined' : 'filled'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {logs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.2)', borderColor: 'transparent' }}>
                            No events detected yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoiteringPage;

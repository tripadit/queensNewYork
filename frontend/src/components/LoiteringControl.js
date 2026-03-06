import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Chip,
} from '@mui/material';
import {
  OpenInNew,
  FiberManualRecord,
} from '@mui/icons-material';
import { getLoiteringStatus } from '../api';

const LoiteringControl = ({ onOpen }) => {
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const res = await getLoiteringStatus();
      setIsRunning(res.data.is_running);
    } catch (e) {
      console.error("Error checking loitering status:", e);
    }
  };

  return (
    <Card sx={{ mt: 3, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 4 }}>
      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: isRunning ? 'error.light' : 'grey.200', p: 1.5, borderRadius: 3 }}>
            <FiberManualRecord color={isRunning ? 'error' : 'disabled'} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Loitering Monitoring</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={isRunning ? "Service Running" : "Service Offline"} 
                size="small" 
                color={isRunning ? "error" : "default"}
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
              <Typography variant="caption" color="text.secondary">Microservice on Port 8001</Typography>
            </Box>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<OpenInNew />} 
          onClick={onOpen}
          sx={{ borderRadius: 2 }}
        >
          Open Loitering Console
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoiteringControl;

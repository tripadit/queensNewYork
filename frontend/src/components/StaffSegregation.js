import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import { getStaffStats, getStaffLogs, registerStaff } from '../api';

const StaffSegregation = () => {
  const [stats, setStats] = useState({ Staff: 0, Customer: 0, Unknown: 0 });
  const [logs, setLogs] = useState([]);
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');

  const fetchData = async () => {
    try {
      const statsRes = await getStaffStats();
      setStats(statsRes.data);
      const logsRes = await getStaffLogs();
      setLogs(logsRes.data);
    } catch (error) {
      console.error("Error fetching staff data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !file) {
      setMessage('Please provide name and image');
      setSeverity('error');
      setOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);

    try {
      await registerStaff(formData);
      setMessage('Staff registered successfully');
      setSeverity('success');
      setOpen(true);
      setName('');
      setFile(null);
      // Reset the file input
      document.getElementById('staff-image-input').value = '';
    } catch (error) {
      setMessage('Registration failed');
      setSeverity('error');
      setOpen(true);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Staff Segregation</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Current Presence</Typography>
              <Typography variant="h6">Staff: {stats.Staff}</Typography>
              <Typography variant="h6">Customers: {stats.Customer}</Typography>
              <Typography variant="h6">Unknown: {stats.Unknown}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Register Staff</Typography>
              <form onSubmit={handleRegister}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label="Name"
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    type="file"
                    id="staff-image-input"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <Button type="submit" variant="contained">Register</Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Detection Logs</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Label</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                      <TableCell>{log.tracking_id}</TableCell>
                      <TableCell>{log.label}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)}>
        <Alert onClose={() => setOpen(false)} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StaffSegregation;

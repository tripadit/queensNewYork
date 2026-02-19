import React, { useState, useEffect } from 'react';
import {
  CssBaseline,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  People,
  HourglassEmpty,
  TrendingUp,
  Badge,
  PersonAdd,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  getAnalyticsSummary,
  getHourlyFlow,
  getRecentVisits,
  getCustomerStats,
  getTopCustomers,
  getVisitDurationDistribution,
  getStaffStats,
  registerStaff,
} from './api';
import AgeGenderDistributionChart from './components/AgeGenderDistributionChart';


const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#111827',
    },
    secondary: {
      main: '#2563eb',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e5e7eb',
    chart: {
      primary: '#2563eb',
      muted: '#c7d2fe',
      success: '#16a34a',
      neutral: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    body1: {
      fontSize: '0.95rem',
    },
    body2: {
      fontSize: '0.85rem',
      color: '#64748b',
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          border: '1px solid #e5e7eb',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: '#475569',
          borderBottom: '1px solid #e5e7eb',
        },
        body: {
          borderBottom: '1px solid #f1f5f9',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#f1f5f9',
          color: '#2563eb',
          width: 44,
          height: 44,
        },
      },
    },
  },
});

const FixedLayoutStyleApp = () => {
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [hourlyFlow, setHourlyFlow] = useState([]);
  const [recentVisits, setRecentVisits] = useState([]);
  const [customerStats, setCustomerStats] = useState(null);
  const [topCustomers, setTopCustomers] = useState([]);
  const [visitDurationDistribution, setVisitDurationDistribution] = useState([]);
  
  const [staffStats, setStaffStats] = useState({ Staff: 0, Customer: 0, Unknown: 0 });
  const [openRegister, setOpenRegister] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffFile, setStaffFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleRegister = async () => {
    if (!staffName || !staffFile) {
        setSnackbar({ open: true, message: 'Please provide name and photo', severity: 'error' });
        return;
    }
    const formData = new FormData();
    formData.append('name', staffName);
    formData.append('file', staffFile);
    try {
        await registerStaff(formData);
        setSnackbar({ open: true, message: 'Staff registered successfully', severity: 'success' });
        setOpenRegister(false);
        setStaffName('');
        setStaffFile(null);
    } catch (error) {
        setSnackbar({ open: true, message: 'Registration failed', severity: 'error' });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summaryRes = await getAnalyticsSummary();
        setAnalyticsSummary(summaryRes.data);

        const hourlyFlowRes = await getHourlyFlow();
        setHourlyFlow(hourlyFlowRes.data.map(item => ({ name: `${item.hour}:00`, uv: item.count })));

        const recentVisitsRes = await getRecentVisits();
        setRecentVisits(recentVisitsRes.data);

        const customerStatsRes = await getCustomerStats();
        setCustomerStats(customerStatsRes.data);

        const topCustomersRes = await getTopCustomers();
        setTopCustomers(topCustomersRes.data);
        
        const visitDurationRes = await getVisitDurationDistribution();
        setVisitDurationDistribution(visitDurationRes.data.map(item => ({ name: item.duration_range, uv: item.count })));

        const staffStatsRes = await getStaffStats();
        setStaffStats(staffStatsRes.data);

      } catch (error) {
        console.error("Error fetching analytics data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh data every 5 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600 }}
          >
            Diamond Store Analytics
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setOpenRegister(true)}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
          >
            Register Staff
          </Button>
        </Box>
        <Box
          display="grid"
          gridTemplateColumns="repeat(12, 1fr)"
          gap={3}
        >
          {/* Staff Stats Card */}
          <Box gridColumn="span 12">
            <Card sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', py: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">Current Staff</Typography>
                  <Typography variant="h4" color="primary.main">{staffStats.Staff}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">Current Customers</Typography>
                  <Typography variant="h4" color="secondary.main">{staffStats.Customer}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">Tracking ID Cache</Typography>
                  <Typography variant="h4" color="text.primary">{staffStats.Staff + staffStats.Customer + staffStats.Unknown}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Row 1 */}
          <Box gridColumn="span 8" sx={{ height: '460px' }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" component="div" sx={{ mb: 2, fontWeight: 600 }}>
                  Live Video Stream
                </Typography>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '380px',
                    backgroundColor: 'black',
                    borderRadius: 0,
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src="http://localhost:8000/stream"
                    alt="Live Stream"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box gridColumn="span 4" sx={{ height: '460px' }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    Hourly Visitor Flow
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    12 AM – 03 PM
                  </Typography>
                </Box>
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={hourlyFlow} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="uv" fill={theme.palette.chart.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          <Box gridColumn="span 4" sx={{ height: '120px' }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '100%' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <People />
                </Avatar>
                <div>
                  <Typography color="text.secondary">Total Visits Today</Typography>
                  <Typography variant="h4" component="div">
                    {analyticsSummary ? analyticsSummary.total_visits_today : '0'}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Box>
          <Box gridColumn="span 4" sx={{ height: '120px' }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '100%' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <HourglassEmpty />
                </Avatar>
                <div>
                  <Typography color="text.secondary">Unique Visitors Today</Typography>
                  <Typography variant="h4" component="div">
                    {analyticsSummary ? analyticsSummary.unique_visitors_today : '0'}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Box>
          <Box gridColumn="span 4" sx={{ height: '120px' }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '100%' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <div>
                  <Typography color="text.secondary">Conversion Rate</Typography>
                  <Typography variant="h4" component="div">
                    {analyticsSummary ? `${analyticsSummary.conversion_rate.toFixed(2)}%` : '0.00%'}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Box>
          {/* Row 3 */}
          <Box gridColumn="span 4">
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" sx={{ mb: 2, fontWeight: 600 }}>
                  Top Customers
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Visits</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topCustomers.map((customer, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell align="right">{customer.visits}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Box>
          <Box gridColumn="span 4">
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" component="div" sx={{ mb: 2, fontWeight: 600 }}>
                  Visit Duration Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart layout="vertical" data={visitDurationDistribution}>
                    <XAxis type="number" hide axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="uv" fill={theme.palette.chart.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
          <Box gridColumn="span 4">
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" component="div" sx={{ mb: 2, fontWeight: 600 }}>
                  New vs. Returning Customers
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={customerStats ? [{ name: 'New', value: customerStats.new_customers }, { name: 'Returning', value: customerStats.returning_customers }] : []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                      <Cell fill={theme.palette.chart.primary} />
                      <Cell fill={theme.palette.chart.success} />
                    </Pie>
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
          <Box gridColumn="span 4">
            <AgeGenderDistributionChart />
          </Box>
          {/* Row 4 */}
          <Box gridColumn="span 12">
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" sx={{ mb: 2, fontWeight: 600 }}>
                  Recent Visits
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentVisits.map((visit, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{visit.person_name}</TableCell>
                        <TableCell>{new Date(visit.start_time).toLocaleTimeString()}</TableCell>
                        <TableCell>{new Date(visit.end_time).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>

      {/* Registration Dialog */}
      <Dialog open={openRegister} onClose={() => setOpenRegister(false)}>
        <DialogTitle>Register Staff Member</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Staff Name"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
            />
            <Button
              variant="outlined"
              component="label"
              sx={{ py: 1.5 }}
            >
              Upload Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setStaffFile(e.target.files[0])}
              />
            </Button>
            {staffFile && <Typography variant="caption">Selected: {staffFile.name}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenRegister(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRegister}>Register</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default FixedLayoutStyleApp;
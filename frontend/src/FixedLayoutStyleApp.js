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
} from '@mui/material';
import {
  People,
  HourglassEmpty,
  TrendingUp,
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
} from './api';
import AgeGenderDistributionChart from './components/AgeGenderDistributionChart';
import StaffSegregation from './components/StaffSegregation';
import LoiteringControl from './components/LoiteringControl';


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

const FixedLayoutStyleApp = ({ onOpenLoitering }) => {
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [hourlyFlow, setHourlyFlow] = useState([]);
  const [recentVisits, setRecentVisits] = useState([]);
  const [customerStats, setCustomerStats] = useState(null);
  const [topCustomers, setTopCustomers] = useState([]);
  const [visitDurationDistribution, setVisitDurationDistribution] = useState([]);

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
        <Typography
          variant="h4"
          component="h1"
          sx={{ mb: 3, gridColumn: 'span 12' }}
        >
          Diamond Store Analytics
        </Typography>
        <Box
          display="grid"
          gridTemplateColumns="repeat(12, 1fr)"
          gap={3}
        >
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
          <Box gridColumn="span 12">
            <StaffSegregation />
          </Box>
          <Box gridColumn="span 12">
            <LoiteringControl onOpen={onOpenLoitering} />
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
    </ThemeProvider>
  );
};

export default FixedLayoutStyleApp;
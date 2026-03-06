import React from 'react';
import { Card, CardContent, Grid, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Avatar } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { People, HourglassEmpty, TrendingUp, Timeline, BarChart, PieChart } from '@mui/icons-material';
import useApi from '../hooks/useApi';
import { getAnalyticsSummary, getHourlyFlow, getRecentVisits } from '../api';
import CustomerStats from './CustomerStats';
import TopCustomers from './TopCustomers';
import VisitDurationDistribution from './VisitDurationDistribution';

const NewAnalyticsDashboard = () => {
  const { data: summaryData } = useApi(getAnalyticsSummary);
  const { data: hourlyFlowData } = useApi(getHourlyFlow);
  const { data: recentVisitsData } = useApi(getRecentVisits);

  const StatCard = ({ title, value, icon }) => (
    <Card sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: '#f5f5f5' }}>
      <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>{icon}</Avatar>
      <div>
        <Typography color="text.secondary">{title}</Typography>
        <Typography variant="h5">{value}</Typography>
      </div>
    </Card>
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard title="Total Visits Today" value={summaryData?.total_visits_today ?? '...'} icon={<People />} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard title="Unique Visitors Today" value={summaryData?.unique_visitors_today ?? '...'} icon={<HourglassEmpty />} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard title="Conversion Rate" value={`${summaryData?.conversion_rate?.toFixed(2) ?? '...'}%`} icon={<TrendingUp />} />
      </Grid>
      <Grid item xs={12} lg={8}>
        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            <Timeline sx={{ mr: 1 }} />
            Hourly Visitor Flow
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#1976d2" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <CustomerStats />
        </Paper>
      </Grid>
      <Grid item xs={12} lg={6}>
        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <TopCustomers />
        </Paper>
      </Grid>
      <Grid item xs={12} lg={6}>
        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <VisitDurationDistribution />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Recent Visits
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentVisitsData.map((visit) => (
                <TableRow key={visit.start_time}>
                  <TableCell>{visit.person_name}</TableCell>
                  <TableCell>{new Date(visit.start_time).toLocaleString()}</TableCell>
                  <TableCell>{new Date(visit.end_time).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default NewAnalyticsDashboard;

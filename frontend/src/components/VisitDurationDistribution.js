import React from 'react';
import { Typography } from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useApi from '../hooks/useApi';
import { getVisitDurationDistribution } from '../api';

const VisitDurationDistribution = () => {
  const { data: visitDurationDistributionData } = useApi(getVisitDurationDistribution);

  return (
    <>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        <BarChartIcon sx={{ mr: 1 }} />
        Visit Duration Distribution
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={visitDurationDistributionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="duration_range" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#1976d2" />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
};

export default VisitDurationDistribution;

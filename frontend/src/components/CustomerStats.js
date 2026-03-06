import React from 'react';
import { Typography } from '@mui/material';
import { PieChart as PieChartIcon } from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useApi from '../hooks/useApi';
import { getCustomerStats } from '../api';

const CustomerStats = () => {
  const { data: customerStatsData } = useApi(getCustomerStats);

  const data = [
    { name: 'New Customers', value: customerStatsData?.new_customers ?? 0 },
    { name: 'Returning Customers', value: customerStatsData?.returning_customers ?? 0 },
  ];

  const COLORS = ['#1976d2', '#f57c00'];

  return (
    <>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        <PieChartIcon sx={{ mr: 1 }} />
        New vs. Returning Customers
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </>
  );
};

export default CustomerStats;

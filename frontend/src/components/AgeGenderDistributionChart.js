import React from 'react';
import { Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Box, CircularProgress } from '@mui/material';
import { Wc as GenderIcon, AccessTime as AgeIcon } from '@mui/icons-material';
import useApi from '../hooks/useApi';
import { getGenderAgeDistribution } from '../api';

const AgeGenderDistributionChart = () => {
  const { data: genderAgeData, loading, error } = useApi(getGenderAgeDistribution);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error">Error loading age and gender data.</Typography>
    );
  }

  const { total_analyzed, distribution } = genderAgeData || { total_analyzed: 0, distribution: [] };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        <GenderIcon sx={{ mr: 1 }} />
        Age & Gender Distribution
      </Typography>
      {total_analyzed > 0 ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total people analyzed: {total_analyzed}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Gender</TableCell>
                  <TableCell>Age Group</TableCell>
                  <TableCell align="right">Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {distribution.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.gender}</TableCell>
                    <TableCell>{item.age_group}</TableCell>
                    <TableCell align="right">{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No age and gender data available.
        </Typography>
      )}
    </Paper>
  );
};

export default AgeGenderDistributionChart;

import React from 'react';
import { Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Star } from '@mui/icons-material';
import useApi from '../hooks/useApi';
import { getTopCustomers } from '../api';

const TopCustomers = () => {
  const { data: topCustomersData } = useApi(getTopCustomers);

  return (
    <>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        <Star sx={{ mr: 1 }} />
        Top Customers
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Visits</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topCustomersData.map((customer) => (
            <TableRow key={customer.name}>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.visits}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default TopCustomers;

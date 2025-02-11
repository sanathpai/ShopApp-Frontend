// /pages/admin/UserPurchases.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../../AxiosInstance';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination } from '@mui/material';

const UserPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchAllPurchases();
  }, []);

  const fetchAllPurchases = async () => {
    try {
      const response = await axiosInstance.get('/admin/users/purchases'); // Fetch all purchases
      console.log(response);
      setPurchases(response.data.data);
    } catch (error) {
      console.error('Error fetching all purchases:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>All User Purchases</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User Name</TableCell>
              <TableCell>Shop Name</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Variety</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Order Price</TableCell>
              <TableCell>Purchase Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((purchase) => (
              <TableRow key={purchase.purchase_id}>
                <TableCell>{purchase.username}</TableCell>
                <TableCell>{purchase.shop_name}</TableCell>
                <TableCell>{purchase.product_name}</TableCell>
                <TableCell>{purchase.variety}</TableCell>
                <TableCell>{purchase.quantity}</TableCell>
                <TableCell>{purchase.order_price}</TableCell>
                <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No purchase data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={purchases.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );
};

export default UserPurchases;

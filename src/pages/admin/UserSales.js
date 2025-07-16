// /pages/admin/UserSales.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../../AxiosInstance';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination } from '@mui/material';

const UserSales = () => {
  const [sales, setSales] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchAllSales();
  }, []);

  const fetchAllSales = async () => {
    try {
      const response = await axiosInstance.get('/admin/users/sales'); // Fetch all sales
      console.log(response);
      setSales(response.data.data);
    } catch (error) {
      console.error('Error fetching all sales:', error);
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
      <Typography variant="h4" gutterBottom>All User Sales</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User Name</TableCell>
              <TableCell>Shop Name</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Variety</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Retail Price</TableCell>
              <TableCell>Sale Date</TableCell>
              <TableCell>Unit Type</TableCell>
              <TableCell>Transaction ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((sale) => (
              <TableRow key={sale.sale_id}>
                <TableCell>{sale.username}</TableCell>
                <TableCell>{sale.shop_name}</TableCell>
                <TableCell>{sale.product_name}</TableCell>
                <TableCell>{sale.variety}</TableCell>
                <TableCell>{sale.quantity}</TableCell>
                <TableCell>{sale.retail_price}</TableCell>
                <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                <TableCell>{sale.unit_type}</TableCell>
                <TableCell>{sale.trans_id || 'N/A'}</TableCell>
              </TableRow>
            ))}
            {sales.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">No sales data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sales.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );
};

export default UserSales;
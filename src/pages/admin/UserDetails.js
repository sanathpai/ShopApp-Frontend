// /pages/admin/UserDetails.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../AxiosInstance';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, TablePagination } from '@mui/material';

const UserDetails = () => {
  const { id } = useParams();
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchasePage, setPurchasePage] = useState(0);
  const [salesPage, setSalesPage] = useState(0);
  const [productsPage, setProductsPage] = useState(0);
  const rowsPerPage = 5;

  useEffect(() => {
    fetchUserActivity();
  }, []);

  const fetchUserActivity = async () => {
    try {
      const response = await axiosInstance.get(`/admin/users/${id}/activity`);
      setPurchases(response.data.purchases);
      setSales(response.data.sales);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching user activity:', error);
    }
  };

  const handleChangePage = (event, newPage, type) => {
    if (type === 'purchases') setPurchasePage(newPage);
    else if (type === 'sales') setSalesPage(newPage);
    else if (type === 'products') setProductsPage(newPage);
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>User Activity</Typography>

      {/* Purchases Section */}
      <Paper sx={{ marginBottom: 3, padding: 2 }} elevation={3}>
        <Typography variant="h6" gutterBottom>Purchases</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Order Price</TableCell>
                <TableCell>Purchase Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.slice(purchasePage * rowsPerPage, purchasePage * rowsPerPage + rowsPerPage).map((purchase) => (
                <TableRow key={purchase.purchase_id}>
                  <TableCell>{purchase.product_name}</TableCell>
                  <TableCell>{purchase.quantity}</TableCell>
                  <TableCell>{purchase.order_price}</TableCell>
                  <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {purchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No purchase data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={purchases.length}
          page={purchasePage}
          onPageChange={(event, newPage) => handleChangePage(event, newPage, 'purchases')}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
        />
      </Paper>

      {/* Sales Section */}
      <Paper sx={{ marginBottom: 3, padding: 2 }} elevation={3}>
        <Typography variant="h6" gutterBottom>Sales</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Retail Price</TableCell>
                <TableCell>Sale Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.slice(salesPage * rowsPerPage, salesPage * rowsPerPage + rowsPerPage).map((sale) => (
                <TableRow key={sale.sale_id}>
                  <TableCell>{sale.product_name}</TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell>{sale.retail_price}</TableCell>
                  <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No sales data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={sales.length}
          page={salesPage}
          onPageChange={(event, newPage) => handleChangePage(event, newPage, 'sales')}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
        />
      </Paper>

      {/* Products Added Section */}
      <Paper sx={{ padding: 2 }} elevation={3}>
        <Typography variant="h6" gutterBottom>Products Added</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Variety</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.slice(productsPage * rowsPerPage, productsPage * rowsPerPage + rowsPerPage).map((product) => (
                <TableRow key={product.product_id}>
                  <TableCell>{product.product_name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.variety}</TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">No products data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={products.length}
          page={productsPage}
          onPageChange={(event, newPage) => handleChangePage(event, newPage, 'products')}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
        />
      </Paper>
    </Box>
  );
};

export default UserDetails;

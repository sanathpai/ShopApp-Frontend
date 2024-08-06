import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Box, IconButton, Snackbar, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useShopContext } from '../context/ShopContext';

const ViewShops = () => {
  const { setShopCount } = useShopContext();
  const [shops, setShops] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axiosInstance.get('/shops');
        setShops(response.data);
        setShopCount(response.data.length);
      } catch (error) {
        console.error('Error fetching shops:', error);
      }
    };

    fetchShops();
  }, [setShopCount]);

  const handleEdit = (shopId) => {
    navigate(`/dashboard/shops/edit/${shopId}`);
  };

  // const handleDelete = async (shopId) => {
  //   try {
  //     await axiosInstance.delete(`/shops/${shopId}`);
  //     const updatedShops = shops.filter((shop) => shop.shop_id !== shopId);
  //     setShops(updatedShops);
  //     setShopCount(updatedShops.length);
  //     setSnackbarMessage('Shop deleted successfully');
  //     setSnackbarSeverity('success');
  //     setSnackbarOpen(true);
  //   } catch (error) {
  //     setSnackbarMessage('Error deleting shop: ' + (error.response ? error.response.data.error : error.message));
  //     setSnackbarSeverity('error');
  //     setSnackbarOpen(true);
  //   }
  // };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        View Shops
      </Typography>
      <Paper sx={{ padding: 2, margin: 2, boxShadow: 3 }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'common.white' }}>Shop Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'common.white' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'common.white' }}>Phone Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'common.white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shops.map((shop) => (
                <TableRow key={shop.shop_id}>
                  <TableCell>{shop.shop_name}</TableCell>
                  <TableCell>{shop.location}</TableCell>
                  <TableCell>{shop.phone_number}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEdit(shop.shop_id)}>
                      <EditIcon />
                    </IconButton>
                    {/* <IconButton color="secondary" onClick={() => handleDelete(shop.shop_id)}>
                      <DeleteIcon />
                    </IconButton> */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ViewShops;

import React, { useState } from 'react';
import axiosInstance from '../AxiosInstance';
import { Container, TextField, Button, Box, Typography, Grid, Snackbar, Alert, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useShopContext } from '../context/ShopContext';

const AddShop = () => {
  const { setShopCount } = useShopContext();
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/shops', {
        shop_name: shopName,
        location,
        phone_number: phoneNumber,
      });

      // Fetch the updated shop count and update the context
      const updatedResponse = await axiosInstance.get('/shops');
      setShopCount(updatedResponse.data.length);

      setSnackbarMessage('Shop added successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setShopName('');
      setLocation('');
      setPhoneNumber('');
      navigate('/dashboard/shops/view'); // Navigate to view shops after adding
    } catch (error) {
      setSnackbarMessage('Error adding shop: ' + (error.response ? error.response.data.error : error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Add Shop
        </Typography>
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Shop Name"
                    variant="outlined"
                    fullWidth
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Location"
                    variant="outlined"
                    fullWidth
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Phone Number"
                    variant="outlined"
                    fullWidth
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary">
                    Add Shop
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddShop;

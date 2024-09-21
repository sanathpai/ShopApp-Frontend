import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Box, Typography, Grid, Snackbar, Alert, Card, CardContent, CardActions } from '@mui/material';
import axiosInstance from '../AxiosInstance'; 

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [variety, setVariety] = useState('');
  const [description, setDescription] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Network status

  useEffect(() => {
    // Fetch the product details if the network is online
    const fetchProduct = async () => {
      if (!isOnline) {
        setSnackbarMessage('You are offline. Cannot fetch product data.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      try {
        const response = await axiosInstance.get(`/products/${id}`);
        const product = response.data;
        setProductName(product.product_name);
        setCategory(product.category);
        setVariety(product.variety);
        setDescription(product.description);
      } catch (error) {
        console.error('Error fetching product:', error);
        setSnackbarMessage('Error fetching product data: ' + (error.response ? error.response.data.error : error.message));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchProduct();

    // Handle network status changes
    const handleOnline = () => {
      setIsOnline(true);
      setSnackbarMessage('You are back online.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchProduct(); // Fetch the product data again when back online
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSnackbarMessage('You are offline. Some actions may not be available.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    };

    // Add event listeners for network status
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [id, isOnline]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if the app is offline
    if (!isOnline) {
      setSnackbarMessage('You are offline. Cannot update the product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      await axiosInstance.put(`/products/${id}`, {
        product_name: productName,
        category,
        variety,
        description,
      });
      setSnackbarMessage('Product updated successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => navigate('/dashboard/products/view'), 1500);
    } catch (error) {
      console.error('Error updating product:', error);
      setSnackbarMessage('Error updating product: ' + (error.response ? error.response.data.error : error.message));
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
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Edit Product
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Product name"
                    variant="outlined"
                    fullWidth
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Category (Optional)"
                    variant="outlined"
                    fullWidth
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Variety (Optional)"
                    variant="outlined"
                    fullWidth
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description (Optional)"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
              <CardActions>
                <Button type="submit" variant="contained" color="primary">
                  Update Product
                </Button>
              </CardActions>
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

export default EditProduct;

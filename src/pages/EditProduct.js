import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Box, Typography, Grid, Snackbar, Alert, Card, CardContent, CardActions, Chip, Stack } from '@mui/material';
import axiosInstance from '../AxiosInstance'; 

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [productName, setProductName] = useState('');
  const [variety, setVariety] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Network status

  // Fetch brand suggestions when product name changes
  useEffect(() => {
    if (productName.length > 1 && isOnline) {
      axiosInstance.get(`/products/brands/${encodeURIComponent(productName)}`)
        .then(response => {
          setBrandSuggestions(response.data.brands || []);
        })
        .catch(error => {
          console.error('Error fetching brand suggestions:', error);
          setBrandSuggestions([]);
        });
    } else {
      setBrandSuggestions([]);
    }
  }, [productName, isOnline]);

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
        setVariety(product.variety);
        setBrand(product.brand || '');
        setSize(product.size || product.description || ''); // Handle both old and new field names
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

  const handleBrandSuggestionClick = (selectedBrand) => {
    setBrand(selectedBrand);
  };

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
        variety,
        brand: brand || null, // Send null if brand is empty
        size,
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
                    label="Brand (Optional)"
                    variant="outlined"
                    fullWidth
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    helperText="Leave blank if product doesn't have a brand (e.g., apples, onions)"
                  />
                  {brandSuggestions.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Existing brands for "{productName}":
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                        {brandSuggestions.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={suggestion}
                            variant="outlined"
                            size="small"
                            onClick={() => handleBrandSuggestionClick(suggestion)}
                            sx={{ mb: 0.5, cursor: 'pointer' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Variety [Gala, Granny Smith etc] (Optional)"
                    variant="outlined"
                    fullWidth
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Size (Optional)"
                    variant="outlined"
                    fullWidth
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    helperText="e.g., 300ml, 500ml, 1L, Small, Medium, Large"
                  />
                </Grid>
              </Grid>
              <CardActions sx={{ justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  type="button" 
                  variant="outlined" 
                  onClick={() => navigate('/dashboard/products/view')}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary" size="large">
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

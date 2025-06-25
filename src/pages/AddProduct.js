import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Box, Typography, Grid, Snackbar, Alert, Card, CardContent, CardActions, List, ListItem, ListItemText } from '@mui/material';
import axiosInstance from '../AxiosInstance';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [variety, setVariety] = useState('');
  const [description, setDescription] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [searchResults, setSearchResults] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Network status
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch search results if product name length > 2
    if (productName.length > 2 && isOnline) { // Check network status before API call
      axiosInstance.get(`/products/search?q=${productName}`)
        .then(response => {
          const uniqueResults = response.data.reduce((acc, product) => {
            const key = `${product.product_name}-${product.variety}`;
            if (!acc[key]) {
              acc[key] = product;
            }
            return acc;
          }, {});
          setSearchResults(Object.values(uniqueResults));
        })
        .catch(error => {
          console.error('Error fetching search results:', error);
          setSnackbarMessage('Error fetching search results. ' + (error.response ? error.response.data.error : error.message));
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        });
    } else {
      setSearchResults([]); // Clear results when input is too short or offline
    }
  }, [productName, isOnline]); // Include isOnline in dependency array

  useEffect(() => {
    // Handle network status changes
    const handleOnline = () => {
      setIsOnline(true);
      setSnackbarMessage('You are back online.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSnackbarMessage('You are offline. Please check your network connection.');
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
  }, []);

  const handleSelectProduct = (product) => {
    setProductName(product.product_name);
    setCategory(product.category);
    setVariety(product.variety);
    setDescription(product.description);
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if the app is offline
    if (!isOnline) {
      setSnackbarMessage('You are offline. Cannot add product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await axiosInstance.post('/products', {
        product_name: productName,
        category,
        variety,
        description,
      });

      setSnackbarMessage('Product added successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      const newProductId = response.data.product_id;

      // Navigate to Add Unit page after successful product addition
      navigate(`/dashboard/units/add?product_id=${newProductId}`);
    } catch (error) {
      setSnackbarMessage('Error adding product: ' + (error.response ? error.response.data.error : error.message));
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
              Add Product
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
                  <List>
                    {searchResults.map((product, index) => (
                      <ListItem button key={index} onClick={() => handleSelectProduct(product)}>
                        <ListItemText primary={product.product_name} secondary={product.variety} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Category [Eg: Fruit, Vegetable etc] (Optional)"
                    variant="outlined"
                    fullWidth
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
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
                    label="Description (Optional)"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>
              </Grid>
              <CardActions>
                <Button type="submit" variant="contained" color="primary">
                  Add Product
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

export default AddProduct;

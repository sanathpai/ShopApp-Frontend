import React, { useState, useEffect, useRef } from 'react';
import { Container, TextField, Button, Box, Typography, Grid, Snackbar, Alert, Card, CardContent, CardActions, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem, Chip, Stack } from '@mui/material';
import axiosInstance from '../AxiosInstance';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [variety, setVariety] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [searchResults, setSearchResults] = useState([]);
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Network status
  const justSelectedRef = useRef(false); // Track if we just selected a product
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch search results if product name length > 2
    if (productName.length > 2 && isOnline && !justSelectedRef.current) {
      axiosInstance.get(`/products/search?q=${productName}`)
        .then(response => {
          const uniqueResults = response.data.reduce((acc, product) => {
            const key = `${product.product_name}-${product.variety || ''}-${product.brand || ''}`;
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
    
    // Reset the justSelected flag after the effect runs
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
    }
  }, [productName, isOnline]);

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
    justSelectedRef.current = true; // Set flag to prevent immediate search
    setProductName(product.product_name);
    setCategory(product.category);
    setVariety(product.variety);
    setBrand(product.brand || '');
    setDescription(product.description);
    setSearchResults([]);
  };

  const handleBrandSuggestionClick = (selectedBrand) => {
    setBrand(selectedBrand);
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
        brand: brand || null, // Send null if brand is empty
        description,
      });

      setSnackbarMessage('Product added successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      const newProductId = response.data.product_id;
      
      // Automatically navigate to Add Unit page with current product selected
      navigate(`/dashboard/units/add?product_id=${newProductId}&from_product=true`);

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
                        <ListItemText 
                          primary={product.product_name}
                          secondary={`${product.variety ? `Variety: ${product.variety}` : 'No variety'}${product.brand ? ` | Brand: ${product.brand}` : ' | No brand'}`}
                        />
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
                    label="Description (Optional)"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>
              </Grid>
              <CardActions sx={{ justifyContent: 'flex-end', mt: 2 }}>
                <Button type="submit" variant="contained" color="primary" size="large">
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

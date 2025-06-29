import React, { useState, useEffect, useRef } from 'react';
import { Container, TextField, Button, Box, Typography, Grid, Snackbar, Alert, Card, CardContent, CardActions, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
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
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [newProductInfo, setNewProductInfo] = useState(null);
  const justSelectedRef = useRef(false); // Track if we just selected a product
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch search results if product name length > 2
    if (productName.length > 2 && isOnline && !justSelectedRef.current) {
      axiosInstance.get(`/products/search?q=${productName}`)
        .then(response => {
          const uniqueResults = response.data.reduce((acc, product) => {
            const key = product.product_name;
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
      
      // Store product info and show confirmation dialog
      setNewProductInfo({
        id: newProductId,
        name: productName,
        variety: variety,
        category: category
      });
      setConfirmDialogOpen(true);

    } catch (error) {
      setSnackbarMessage('Error adding product: ' + (error.response ? error.response.data.error : error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleConfirmAddUnits = () => {
    setConfirmDialogOpen(false);
    // Navigate to Add Unit page with current product selected
    navigate(`/dashboard/units/add?product_id=${newProductInfo.id}&from_product=true`);
  };

  const handleSkipAddUnits = () => {
    setConfirmDialogOpen(false);
    // Navigate directly to stock entry page
    navigate(`/dashboard/inventories/stock-entry?product_id=${newProductInfo.id}&product_name=${encodeURIComponent(newProductInfo.name)}&variety=${encodeURIComponent(newProductInfo.variety || '')}`);
  };

  const handleDialogClose = () => {
    setConfirmDialogOpen(false);
    // Reset form for next product
    setProductName('');
    setCategory('');
    setVariety('');
    setDescription('');
    setNewProductInfo(null);
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
                        <ListItemText primary={product.product_name} />
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
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Add Additional Units?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Would you like to add additional units of sale or purchase to "{newProductInfo?.name}" other than the default buying and selling units?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSkipAddUnits} color="primary">
            No, Proceed to Stock Entry
          </Button>
          <Button onClick={handleConfirmAddUnits} color="primary" variant="contained">
            Yes, Add Units
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddProduct;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Pagination,
  PaginationItem
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import axiosInstance from '../AxiosInstance';

const ViewProducts = () => {
  const [products, setProducts] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(6);
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Network status
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      if (!isOnline) {
        setSnackbarMessage('You are offline. Cannot fetch products.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      try {
        const response = await axiosInstance.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setSnackbarMessage('Error fetching products: ' + (error.response ? error.response.data.error : error.message));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchProducts();

    // Handle network status changes
    const handleOnline = () => {
      setIsOnline(true);
      setSnackbarMessage('You are back online.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchProducts(); // Refetch products when back online
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
  }, [isOnline]);

  const handleEdit = (product) => {
    if (!isOnline) {
      setSnackbarMessage('You are offline. Cannot edit the product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    navigate(`/dashboard/products/edit/${product.product_id}`);
  };

  const handleDelete = async (productId) => {
    if (!isOnline) {
      setSnackbarMessage('You are offline. Cannot delete the product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    try {
      await axiosInstance.delete(`/products/${productId}`);
      setProducts(products.filter((product) => product.product_id !== productId));
      setSnackbarMessage('Product deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting product:', error);
      setSnackbarMessage('Error deleting product: ' + (error.response ? error.response.data.error : error.message));
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

  const handleDetailsOpen = (product) => {
    setCurrentProduct(product);
    setDetailsDialogOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsDialogOpen(false);
    setCurrentProduct(null);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        View Products
      </Typography>
      <Grid container spacing={3}>
        {products.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.product_id}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  {product.product_name}
                  {product.variety && ` - ${product.variety}`}
                </Typography>
              </CardContent>
              <CardActions>
                <Button variant="contained" color="primary" onClick={() => handleEdit(product)}>
                  Edit
                </Button>
                <Button variant="contained" color="secondary" onClick={() => handleDelete(product.product_id)}>
                  Delete
                </Button>
                <IconButton color="info" onClick={() => handleDetailsOpen(product)}>
                  <InfoIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={Math.ceil(products.length / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
          renderItem={(item) => (
            <PaginationItem
              {...item}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'common.white',
                },
              }}
            />
          )}
        />
      </Box>
      <Dialog open={detailsDialogOpen} onClose={handleDetailsClose}>
        <DialogTitle>Product Details</DialogTitle>
        <DialogContent>
          {currentProduct && (
            <>
              <DialogContentText>
                <strong>Product Name:</strong> {currentProduct.product_name}
              </DialogContentText>
              {currentProduct.variety && (
                <DialogContentText>
                  <strong>Variety:</strong> {currentProduct.variety}
                </DialogContentText>
              )}
              <DialogContentText>
                <strong>Category:</strong> {currentProduct.category}
              </DialogContentText>
              <DialogContentText>
                <strong>Description:</strong> {currentProduct.description}
              </DialogContentText>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ViewProducts;

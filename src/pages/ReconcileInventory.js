import React, { useState, useEffect } from 'react';
import axiosInstance from '../AxiosInstance';
import { Container, TextField, Button, Box, Typography, Snackbar, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';

const ReconcileInventory = () => {
  const { id } = useParams(); // Extract inventory ID from URL
  const [inventory, setInventory] = useState({});
  const [actualStock, setActualStock] = useState(''); // For entering the actual stock
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axiosInstance.get(`/inventories/${id}`); // Fetch the inventory using the ID
        setInventory(response.data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setSnackbarMessage('Error fetching inventory');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchInventory();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(actualStock) || actualStock === '') {
      setSnackbarMessage('Please enter a valid stock number');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      await axiosInstance.post(`/inventories/reconcile/${id}`, {
        actual_stock: actualStock,
        actual_unit_id: inventory.unit_id,
      });
      setSnackbarMessage('Inventory reconciled successfully!');
      setSnackbarSeverity('success');
    } catch (error) {
      console.error('Error reconciling inventory:', error);
      setSnackbarMessage('Error reconciling inventory');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Reconcile Inventory
        </Typography>
        <form onSubmit={handleSubmit}>
          {/* Product Information */}
          <TextField
            label="Product Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={`${inventory.product_name || ''}${inventory.brand ? ` (${inventory.brand})` : ''}${(inventory.variety || inventory.size) ? ` - ${[inventory.variety, inventory.size].filter(Boolean).join(', ')}` : ''}`}
            disabled
          />
          {/* Current Stock */}
          <TextField
            label="Current Stock"
            variant="outlined"
            fullWidth
            margin="normal"
            value={inventory.current_stock || ''}
            disabled
          />
          {/* Unit Type */}
          <TextField
            label="Unit Type"
            variant="outlined"
            fullWidth
            margin="normal"
            value={inventory.unit_type || ''}
            disabled
          />
          {/* Actual Stock to be reconciled */}
          <TextField
            label="Actual Stock"
            variant="outlined"
            fullWidth
            margin="normal"
            value={actualStock}
            onChange={(e) => setActualStock(e.target.value)}
            required
          />
          {/* Submit Button */}
          <Button type="submit" variant="contained" color="primary">
            Reconcile Inventory
          </Button>
        </form>
      </Box>
      {/* Snackbar to show success or error messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ReconcileInventory;

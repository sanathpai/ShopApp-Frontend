// components/EditSupplier.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Box, Typography, Snackbar, Alert, Card, CardContent } from '@mui/material';
import axiosInstance from '../AxiosInstance';

const EditSupplier = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplierName, setSupplierName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [location, setLocation] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await axiosInstance.get(`/suppliers/${id}`);
        const supplier = response.data;
        setSupplierName(supplier.name);
        setContactInfo(supplier.phone_number);
        setLocation(supplier.location);
      } catch (error) {
        setSnackbarMessage('Error fetching supplier details');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchSupplier();
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axiosInstance.put(`/suppliers/${id}`, {
        supplier_name: supplierName,
        contact_info: contactInfo,
        location
      });
      setSnackbarMessage('Supplier updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      navigate('/dashboard/suppliers/view');
    } catch (error) {
      setSnackbarMessage('Error updating supplier');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Supplier
        </Typography>
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Supplier Name"
                variant="outlined"
                fullWidth
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                margin="normal"
              />
              <TextField
                label="Contact Info"
                variant="outlined"
                fullWidth
                required
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                margin="normal"
              />
              <TextField
                label="Location"
                variant="outlined"
                fullWidth
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                margin="normal"
              />
              <Button type="submit" variant="contained" color="primary">
                Update Supplier
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditSupplier;

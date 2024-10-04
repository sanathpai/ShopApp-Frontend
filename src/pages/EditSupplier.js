import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Box, Typography, Snackbar, Alert, Card, CardContent, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import axiosInstance from '../AxiosInstance';

const EditSupplier = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sourceType, setSourceType] = useState('supplier');
  const [supplierName, setSupplierName] = useState('');
  const [marketName, setMarketName] = useState('');
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
        
        // Set the state based on whether the record is a supplier or market
        if (supplier.name) {
          setSourceType('supplier');
          setSupplierName(supplier.name);
        } else if (supplier.market_name) {
          setSourceType('market');
          setMarketName(supplier.market_name);
        }
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
      // Prepare data to send based on source type
      const updatedData = {
        source_type: sourceType,
        supplier_name: sourceType === 'supplier' ? supplierName : '',
        market_name: sourceType === 'market' ? marketName : '',
        contact_info: contactInfo,
        location,
      };

      await axiosInstance.put(`/suppliers/${id}`, updatedData);
      setSnackbarMessage('Supplier or Market updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      navigate('/dashboard/suppliers/view');
    } catch (error) {
      setSnackbarMessage('Error updating supplier or market');
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
          Edit Source
        </Typography>
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Source Type</FormLabel>
                <RadioGroup
                  row
                  aria-label="source-type"
                  name="source-type"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                >
                  <FormControlLabel value="supplier" control={<Radio />} label="Supplier" />
                  <FormControlLabel value="market" control={<Radio />} label="Market" />
                </RadioGroup>
              </FormControl>

              {sourceType === 'supplier' ? (
                <TextField
                  label="Supplier Name"
                  variant="outlined"
                  fullWidth
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  margin="normal"
                />
              ) : (
                <TextField
                  label="Market Name"
                  variant="outlined"
                  fullWidth
                  required
                  value={marketName}
                  onChange={(e) => setMarketName(e.target.value)}
                  margin="normal"
                />
              )}

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
                Update Source
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

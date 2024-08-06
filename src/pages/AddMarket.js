// components/AddMarket.js
import React, { useState } from 'react';
import { TextField, Button, Container, Card, CardContent, Typography, Snackbar, Alert } from '@mui/material';
import axiosInstance from '../AxiosInstance';

const AddMarket = () => {
  const [marketName, setMarketName] = useState('');
  const [location, setLocation] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axiosInstance.post('/markets', {
        market_name: marketName,
        location
      });
      setSnackbarMessage('Market added successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setMarketName('');
      setLocation('');
    } catch (error) {
      setSnackbarMessage('Error adding market');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Container>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Add Market
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Market Name"
              variant="outlined"
              fullWidth
              required
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
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
              Add Market
            </Button>
          </form>
        </CardContent>
      </Card>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddMarket;

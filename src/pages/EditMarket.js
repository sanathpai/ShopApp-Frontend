// components/EditMarket.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Card, CardContent, Typography, Snackbar, Alert } from '@mui/material';
import axiosInstance from '../AxiosInstance';

const EditMarket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [marketName, setMarketName] = useState('');
  const [location, setLocation] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const response = await axiosInstance.get(`/markets/${id}`);
        const market = response.data;
        setMarketName(market.market_name);
        setLocation(market.location);
      } catch (error) {
        setSnackbarMessage('Error fetching market details');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchMarket();
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axiosInstance.put(`/markets/${id}`, {
        market_name: marketName,
        location
      });
      setSnackbarMessage('Market updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      navigate('/dashboard/markets/view');
    } catch (error) {
      setSnackbarMessage('Error updating market');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Container>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Edit Market
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
              Update Market
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

export default EditMarket;

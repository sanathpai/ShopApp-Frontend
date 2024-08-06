// components/ViewMarkets.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, CardContent, Typography, Grid, Button, IconButton, Snackbar, Alert, Box } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axiosInstance from '../AxiosInstance';

const ViewMarkets = () => {
  const [markets, setMarkets] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await axiosInstance.get('/markets');
        setMarkets(response.data);
      } catch (error) {
        setSnackbarMessage('Error fetching markets');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };
    fetchMarkets();
  }, []);

  const handleDelete = async (marketId) => {
    try {
      await axiosInstance.delete(`/markets/${marketId}`);
      setMarkets(markets.filter((market) => market.market_id !== marketId));
      setSnackbarMessage('Market deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Error deleting market');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleEdit = (marketId) => {
    navigate(`/dashboard/markets/edit/${marketId}`);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Markets
      </Typography>
      <Grid container spacing={4}>
        {markets.map((market) => (
          <Grid item key={market.market_id} xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">{market.market_name}</Typography>
                <Typography variant="body2">{market.location}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <IconButton color="primary">
                    <InfoIcon />
                  </IconButton>
                  <IconButton color="secondary" onClick={() => handleEdit(market.market_id)}>
                    <EditIcon />
                  </IconButton>
                  <Button variant="contained" color="secondary" onClick={() => handleDelete(market.market_id)}>
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ViewMarkets;

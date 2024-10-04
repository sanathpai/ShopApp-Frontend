import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, CardContent, Typography, Grid, Button, IconButton, Snackbar, Alert, Box } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInstance from '../AxiosInstance';

const ViewSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axiosInstance.get('/suppliers');
        setSuppliers(response.data);
      } catch (error) {
        setSnackbarMessage('Error fetching suppliers');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };
    fetchSuppliers();
  }, []);

  const handleDelete = async (supplierId) => {
    try {
      await axiosInstance.delete(`/suppliers/${supplierId}`);
      setSuppliers(suppliers.filter((supplier) => supplier.supplier_id !== supplierId));
      setSnackbarMessage('Supplier or Market deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Error deleting supplier or market');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleEdit = (supplierId) => {
    navigate(`/dashboard/suppliers/edit/${supplierId}`);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Suppliers and Markets
      </Typography>
      <Grid container spacing={4}>
        {suppliers.map((supplier) => (
          <Grid item key={supplier.supplier_id} xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                {/* Conditionally display Supplier Name or Market Name based on the existence of supplier.name or supplier.market_name */}
                <Typography variant="h6">
                  {supplier.name ? 'Supplier: ' : 'Market: '}
                  {supplier.name || supplier.market_name}
                </Typography>
                <Typography variant="body2">Contact: {supplier.phone_number}</Typography>
                <Typography variant="body2">Location: {supplier.location}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <IconButton color="primary">
                    <InfoIcon />
                  </IconButton>
                  <IconButton color="secondary" onClick={() => handleEdit(supplier.supplier_id)}>
                    <EditIcon />
                  </IconButton>
                  <Button variant="contained" color="error" onClick={() => handleDelete(supplier.supplier_id)}>
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

export default ViewSuppliers;

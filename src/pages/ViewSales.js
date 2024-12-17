import React, { useState, useEffect } from 'react';
import axiosInstance from '../AxiosInstance';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TablePagination,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';

const ViewSales = () => {
  const [sales, setSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [selectedSale, setSelectedSale] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await axiosInstance.get('/sales');
        setSales(response.data);
      } catch (error) {
        console.error('Error fetching sales:', error);
      }
    };
    fetchSales();
  }, []);

  const handleDelete = async (saleId) => {
    try {
      await axiosInstance.delete(`/sales/${saleId}`);
      setSales(sales.filter((sale) => sale.sale_id !== saleId));
      setSnackbarMessage('Sale deleted successfully!');
      setSnackbarSeverity('success');
    } catch (error) {
      console.error('Error deleting sale:', error);
      setSnackbarMessage('Error deleting sale');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleInfoOpen = (sale) => {
    setSelectedSale(sale);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedSale(null);
  };

  const handleEdit = (saleId) => {
    navigate(`/dashboard/sales/edit/${saleId}`);
  };

  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0); // Reset to the first page
  };

  // Paginated sales data
  const paginatedSales = sales.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Sales
      </Typography>
      <Grid container spacing={4}>
        {paginatedSales.map((sale) => (
          <Grid item xs={12} sm={6} md={4} key={sale.sale_id}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" component="div">
                  {sale.product_name}
                </Typography>
                <Typography color="text.secondary">Variety: {sale.variety}</Typography>
                <Typography color="text.secondary">Retail Price: {sale.retail_price}</Typography>
                <Typography color="text.secondary">Quantity: {sale.quantity}</Typography>
                <Typography color="text.secondary">Unit: {sale.unit_type}</Typography>
                <Typography color="text.secondary">
                  Sale Date: {new Date(sale.sale_date).toLocaleDateString()}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <IconButton color="primary" onClick={() => handleEdit(sale.sale_id)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="primary" onClick={() => handleInfoOpen(sale)}>
                    <InfoIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(sale.sale_id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 4,
          overflowX: 'auto', // Prevent horizontal scrolling
          width: '100%',
        }}
      >
        <TablePagination
          component="div"
          count={sales.length}
          page={currentPage}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[6, 12, 18]}
          sx={{
            '& .MuiTablePagination-toolbar': {
              flexWrap: 'wrap', // Allow wrapping for small screens
              justifyContent: 'center', // Center pagination controls
            },
            '& .MuiTablePagination-selectLabel': {
              display: { xs: 'none', sm: 'inline-block' }, // Hide label on mobile
            },
            '& .MuiInputBase-root': {
              fontSize: '0.875rem', // Scale down font size for mobile
            },
            '& .MuiTablePagination-actions': {
              marginTop: { xs: 1, sm: 0 }, // Add spacing for actions on mobile
            },
          }}
        />
      </Box>

      {/* Dialog for Sale Details */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Sale Details</DialogTitle>
        <DialogContent>
          {selectedSale && (
            <>
              <DialogContentText>
                Product Name: {selectedSale.product_name}
              </DialogContentText>
              <DialogContentText>Variety: {selectedSale.variety}</DialogContentText>
              <DialogContentText>
                Retail Price: ${selectedSale.retail_price}
              </DialogContentText>
              <DialogContentText>Quantity: {selectedSale.quantity}</DialogContentText>
              <DialogContentText>
                Sale Date: {new Date(selectedSale.sale_date).toLocaleDateString()}
              </DialogContentText>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ViewSales;

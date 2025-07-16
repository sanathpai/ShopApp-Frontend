import React, { useState, useEffect } from 'react';
import axiosInstance from '../AxiosInstance';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TablePagination,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.common.white,
  fontWeight: 'bold',
}));

const ViewPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await axiosInstance.get('/purchases');
        setPurchases(response.data);
      } catch (error) {
        console.error('Error fetching purchases:', error);
      }
    };
    fetchPurchases();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (id) => {
    navigate(`/dashboard/purchases/edit/${id}`);
  };

  const confirmDelete = (purchase) => {
    setPurchaseToDelete(purchase);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/purchases/${purchaseToDelete.purchase_id}`);
      setPurchases(purchases.filter((purchase) => purchase.purchase_id !== purchaseToDelete.purchase_id));
      setSnackbarMessage('Purchase deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error deleting purchase:', error);
      setSnackbarMessage('Error deleting purchase');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Purchases
      </Typography>
      <TableContainer component={Paper} sx={{ boxShadow: 3, marginBottom: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Shop Name</StyledTableCell>
              <StyledTableCell>Product Name</StyledTableCell>
              <StyledTableCell>Order Price</StyledTableCell>
              <StyledTableCell>Discount</StyledTableCell>
              <StyledTableCell>Quantity</StyledTableCell>
              <StyledTableCell>Unit</StyledTableCell>
              <StyledTableCell>Purchase Date</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((purchase) => (
              <TableRow key={purchase.purchase_id}>
                <TableCell>{purchase.shop_name}</TableCell>
                <TableCell>{purchase.product_name}</TableCell>
                <TableCell>{purchase.order_price}</TableCell>
                <TableCell>{purchase.discount || 0}</TableCell>
                <TableCell>{purchase.quantity}</TableCell>
                <TableCell>{purchase.unit_type}</TableCell>
                <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEdit(purchase.purchase_id)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => confirmDelete(purchase)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={purchases.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog for Deletion */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this purchase? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="secondary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ViewPurchases;

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
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.common.white,
  fontWeight: 'bold',
}));

const ViewProductOfferings = () => {
  const [offerings, setOfferings] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const response = await axiosInstance.get('/productOfferings');
        setOfferings(response.data);
      } catch (error) {
        console.error('Error fetching product offerings:', error);
      }
    };
    fetchOfferings();
  }, []);

  const handleEdit = (id) => {
    navigate(`/dashboard/productOfferings/edit/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/productOfferings/${id}`);
      setOfferings(offerings.filter((offering) => offering.offering_id !== id));
      setSnackbarMessage('Product offering deleted successfully');
      setSnackbarSeverity('success');
    } catch (error) {
      console.error('Error deleting product offering:', error);
      setSnackbarMessage('Failed to delete product offering');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Product Offerings
      </Typography>
      <TableContainer component={Paper} sx={{ boxShadow: 3, marginBottom: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Shop Name</StyledTableCell>
              <StyledTableCell>Product Name</StyledTableCell>
              <StyledTableCell>Unit Size</StyledTableCell>
              <StyledTableCell>Buying Unit Type</StyledTableCell>
              <StyledTableCell>Selling Unit Type</StyledTableCell>
              <StyledTableCell>Price</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offerings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((offering) => (
              <TableRow key={offering.offering_id}>
                <TableCell>{offering.shop_name}</TableCell>
                <TableCell>{`${offering.product_name} - ${offering.variety}`}</TableCell> {/* Updated line */}
                <TableCell>{offering.unit_size}</TableCell>
                <TableCell>{offering.buying_unit_type}</TableCell>
                <TableCell>{offering.selling_unit_type}</TableCell>
                <TableCell>{offering.price}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEdit(offering.offering_id)}>
                    <InfoIcon />
                  </IconButton>
                  <IconButton color="secondary" onClick={() => handleDelete(offering.offering_id)}>
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
        count={offerings.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ViewProductOfferings;

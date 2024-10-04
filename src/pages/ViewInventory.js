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
  Button,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Styled Table Cell for table headers
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.common.white,
  fontWeight: 'bold',
}));

const ViewInventories = () => {
  const [inventories, setInventories] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState(false);
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch inventories
    const fetchInventories = async () => {
      try {
        const response = await axiosInstance.get('/inventories');
        setInventories(response.data);
      } catch (error) {
        setErrorMessage('Failed to fetch inventories. Please try again.');
        setOpenErrorSnackbar(true);
        console.error('Error fetching inventories:', error);
      }
    };

    // Initial fetch
    if (isOnline) {
      fetchInventories();
    }

    // Event listeners for network status
    const handleOnline = () => {
      setIsOnline(true);
      setErrorMessage('Network is back online. Updating data...');
      setOpenSuccessSnackbar(true);
      fetchInventories(); // Refetch data when back online
    };

    const handleOffline = () => {
      setIsOnline(false);
      setErrorMessage('You are offline. Some actions may not be available.');
      setOpenErrorSnackbar(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = async (inventoryId) => {
    if (!isOnline) {
      setErrorMessage('Cannot delete inventory while offline.');
      setOpenErrorSnackbar(true);
      return;
    }

    try {
      await axiosInstance.delete(`/inventories/${inventoryId}`);
      setInventories(inventories.filter(inv => inv.inventory_id !== inventoryId));
      setOpenSuccessSnackbar(true);
      setErrorMessage('Inventory deleted successfully.');
    } catch (error) {
      setErrorMessage('Failed to delete inventory. Please try again.');
      setOpenErrorSnackbar(true);
      console.error('Error deleting inventory:', error);
    }
  };

  const handleReconcileClick = (inventoryId) => {
    navigate(`/dashboard/inventories/reconcile/${inventoryId}`);
  };

  // Handle unit conversion
  const handleUnitConversion = async (inventoryId, toUnitId) => {
    if (!isOnline) {
      setErrorMessage('Cannot convert units while offline.');
      setOpenErrorSnackbar(true);
      return;
    }

    const inventory = inventories.find(inv => inv.inventory_id === inventoryId);
    if (!inventory) return;

    try {
      const response = await axiosInstance.post('/inventories/convert', {
        quantity: inventory.current_stock,
        fromUnitId: inventory.unit_id,
        toUnitId: toUnitId
      });

      const { convertedQuantity } = response.data;

      setInventories(inventories.map(inv =>
        inv.inventory_id === inventoryId ? { ...inv, current_stock: convertedQuantity, unit_id: toUnitId } : inv
      ));

      setOpenSuccessSnackbar(true);
      setErrorMessage('Conversion completed successfully.');
    } catch (error) {
      setErrorMessage('Error converting units. Please try again.');
      setOpenErrorSnackbar(true);
      console.error('Error converting units:', error);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSuccessSnackbar(false);
    setOpenErrorSnackbar(false);
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Inventories
      </Typography>
      <TableContainer component={Paper} sx={{ boxShadow: 3, marginBottom: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Shop Name</StyledTableCell>
              <StyledTableCell>Product Name</StyledTableCell>
              <StyledTableCell>Current Stock</StyledTableCell>
              <StyledTableCell>Unit Type</StyledTableCell>
              <StyledTableCell>Reminder Limit</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((inventory) => (
              <TableRow key={inventory.inventory_id}>
                <TableCell>{inventory.shop_name}</TableCell>
                <TableCell>{`${inventory.product_name} - ${inventory.variety}`}</TableCell>
                <TableCell>
                  {typeof inventory.current_stock === 'number' ? 
                    inventory.current_stock.toFixed(2) : 
                    parseFloat(inventory.current_stock).toFixed(2)}
                </TableCell>
                <TableCell>
                  <FormControl fullWidth>
                    <Select
                      value={inventory.unit_id}
                      onChange={(e) => handleUnitConversion(inventory.inventory_id, e.target.value)}
                    >
                      {inventory.available_units && inventory.available_units.length > 0 ? (
                        inventory.available_units.map(unit => (
                          <MenuItem key={unit.unit_id} value={unit.unit_id}>
                            {`${unit.unit_type} (${unit.unit_category})`}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>
                          No units available
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>{inventory.stock_limit}</TableCell>
                <TableCell>
                  <Button color="secondary" onClick={() => handleDeleteClick(inventory.inventory_id)}>Delete</Button>
                  <Button color="primary" onClick={() => handleReconcileClick(inventory.inventory_id)}>Reconcile</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={inventories.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <Snackbar
        open={openSuccessSnackbar || openErrorSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity={openSuccessSnackbar ? 'success' : 'error'}>
          {errorMessage}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default ViewInventories;

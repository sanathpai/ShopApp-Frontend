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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Snackbar,
  Box,
  Link,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.common.white,
  fontWeight: 'bold',
}));

const StyledTablePagination = styled(TablePagination)(({ theme }) => ({
  '& .MuiSvgIcon-root': {
    fontSize: '1.8rem', // Increase the size of the navigation arrows
  },
}));

const ViewInventories = () => {
  const [inventories, setInventories] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editLimitOpen, setEditLimitOpen] = useState(false);
  const [editInventory, setEditInventory] = useState({});
  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState(false);
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [inventoryToDelete, setInventoryToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const response = await axiosInstance.get('/inventories');
        const inventoriesWithOriginalUnits = response.data.map((inventory) => ({
          ...inventory,
          originalUnitType: inventory.unit_type,
          originalStockLimit: inventory.stock_limit, // Store original stock_limit
          originalUnitId: inventory.unit_id, // Store original unit_id
          currentLimitUnitId: inventory.unit_id, // Track which unit the current limit is set in
        }));
        setInventories(inventoriesWithOriginalUnits);
      } catch (error) {
        setErrorMessage('Failed to fetch inventories. Please try again.');
        setOpenErrorSnackbar(true);
        console.error('Error fetching inventories:', error);
      }
    };

    if (isOnline) {
      fetchInventories();
    }

    const handleOnline = () => {
      setIsOnline(true);
      setErrorMessage('Network is back online. Updating data...');
      setOpenSuccessSnackbar(true);
      fetchInventories();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setErrorMessage('You are offline. Some actions may not be available.');
      setOpenErrorSnackbar(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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

  const handleUpdateLimitClick = (inventory) => {
    setEditInventory({
      ...inventory,
      stock_limit: inventory.stock_limit || 0
    });
    setEditLimitOpen(true);
  };

  const confirmDelete = (inventory) => {
    setInventoryToDelete(inventory);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!isOnline) {
      setErrorMessage('Cannot delete inventory while offline.');
      setOpenErrorSnackbar(true);
      setDeleteConfirmOpen(false);
      return;
    }

    try {
      await axiosInstance.delete(`/inventories/${inventoryToDelete.inventory_id}`);
      setInventories(inventories.filter((inv) => inv.inventory_id !== inventoryToDelete.inventory_id));
      setOpenSuccessSnackbar(true);
      setErrorMessage('Inventory deleted successfully.');
    } catch (error) {
      setErrorMessage('Failed to delete inventory. Please try again.');
      setOpenErrorSnackbar(true);
      console.error('Error deleting inventory:', error);
    } finally {
      setDeleteConfirmOpen(false);
      setInventoryToDelete(null);
    }
  };

  const handleReconcileClick = (inventoryId) => {
    navigate(`/dashboard/inventories/reconcile/${inventoryId}`);
  };

  const handleUnitConversion = async (inventoryId, toUnitId) => {
    if (!isOnline) {
      setErrorMessage('Cannot convert units while offline.');
      setOpenErrorSnackbar(true);
      return;
    }

    const inventory = inventories.find((inv) => inv.inventory_id === inventoryId);
    if (!inventory) return;

    try {
      // Convert current stock
      const stockResponse = await axiosInstance.post('/inventories/convert', {
        quantity: inventory.current_stock,
        fromUnitId: inventory.unit_id,
        toUnitId: toUnitId,
      });

      // Convert stock limit (reminder limit) from current unit to selected unit
      const limitResponse = await axiosInstance.post('/inventories/convert', {
        quantity: inventory.stock_limit, // Use current stock_limit for conversion
        fromUnitId: inventory.currentLimitUnitId, // Use current unit_id for conversion
        toUnitId: toUnitId,
      });

      const { convertedQuantity } = stockResponse.data;
      const { convertedQuantity: convertedStockLimit } = limitResponse.data;

      // Find the new unit type from available_units
      const newUnit = inventory.available_units.find(unit => unit.unit_id === toUnitId);
      const newUnitType = newUnit ? newUnit.unit_type : inventory.unit_type;

      setInventories(
        inventories.map((inv) =>
          inv.inventory_id === inventoryId
            ? { 
                ...inv, 
                current_stock: convertedQuantity, 
                stock_limit: convertedStockLimit,
                unit_id: toUnitId,
                unit_type: newUnitType, // Update the unit_type as well
                currentLimitUnitId: toUnitId // Update the currentLimitUnitId
              }
            : inv
        )
      );

      setOpenSuccessSnackbar(true);
      setErrorMessage('Conversion completed successfully.');
    } catch (error) {
      setErrorMessage('Error converting units. Please try again.');
      setOpenErrorSnackbar(true);
      console.error('Error converting units:', error);
    }
  };

  const handleLimitChange = (event) => {
    const { value } = event.target;
    setEditInventory({ ...editInventory, stock_limit: value });
  };

  const handleLimitSubmit = async (event) => {
    event.preventDefault();
    try {
      // Update the stock limit via API
      await axiosInstance.put(`/inventories/${editInventory.inventory_id}/limit`, {
        stock_limit: editInventory.stock_limit,
        unit_id: editInventory.unit_id // Send the unit_id to the backend
      });
      
      // Update the local state
      const updatedInventories = inventories.map(inv =>
        inv.inventory_id === editInventory.inventory_id 
          ? { ...inv, stock_limit: editInventory.stock_limit, currentLimitUnitId: editInventory.unit_id }
          : inv
      );
      setInventories(updatedInventories);
      setEditLimitOpen(false);
      setOpenSuccessSnackbar(true);
      setErrorMessage('Reminder limit updated successfully.');
    } catch (error) {
      console.error('Error updating reminder limit:', error);
      setErrorMessage('Error updating reminder limit.');
      setOpenErrorSnackbar(true);
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
              <StyledTableCell>Product Name</StyledTableCell>
              <StyledTableCell>Current Stock</StyledTableCell>
              <StyledTableCell>Unit Type</StyledTableCell>
              <StyledTableCell>Reminder Limit</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventories
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((inventory) => (
                <TableRow key={inventory.inventory_id}>
                  <TableCell>{`${inventory.product_name} - ${inventory.variety}`}</TableCell>
                  <TableCell>
                    {typeof inventory.current_stock === 'number'
                      ? inventory.current_stock.toFixed(2)
                      : parseFloat(inventory.current_stock).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth>
                      <Select
                        value={inventory.unit_id}
                        onChange={(e) => handleUnitConversion(inventory.inventory_id, e.target.value)}
                      >
                        {inventory.available_units && inventory.available_units.length > 0 ? (
                          inventory.available_units.map((unit) => (
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
                    <Button 
                      color="secondary" 
                      onClick={() => confirmDelete(inventory)}
                      sx={{ mr: 1 }}
                    >
                      DELETE
                    </Button>
                    <Button 
                      color="primary" 
                      onClick={() => handleReconcileClick(inventory.inventory_id)}
                      sx={{ mr: 1 }}
                    >
                      RECONCILE
                    </Button>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => handleUpdateLimitClick(inventory)}
                      sx={{ 
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        color: 'primary.main'
                      }}
                    >
                      UPDATE LIMIT
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <StyledTablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={inventories.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Dialog for updating reminder limit */}
      <Dialog open={editLimitOpen} onClose={() => setEditLimitOpen(false)}>
        <DialogTitle>Update Reminder Limit</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Product: {editInventory.product_name}
              {editInventory.variety && ` - ${editInventory.variety}`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current unit: {editInventory.unit_type}
            </Typography>
            <TextField
              label="Reminder Limit"
              type="number"
              value={editInventory.stock_limit || 0}
              onChange={handleLimitChange}
              fullWidth
              margin="normal"
              helperText={`Set the minimum stock level in ${editInventory.unit_type} to trigger low inventory alerts`}
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditLimitOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLimitSubmit} color="primary" variant="contained">
            Update Limit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Deletion */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this inventory item? This action cannot be undone.
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

      <Snackbar
        open={openSuccessSnackbar || openErrorSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          elevation={6}
          variant="filled"
          onClose={handleCloseSnackbar}
          severity={openSuccessSnackbar ? 'success' : 'error'}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ViewInventories;

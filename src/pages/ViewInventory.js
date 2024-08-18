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
  InputLabel,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Conversion function adapted from your backend
const convertUnits = (quantity, fromUnitSize, toUnitSize) => {
  return (quantity * toUnitSize) / fromUnitSize;
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.common.white,
  fontWeight: 'bold',
}));

const ViewInventories = () => {
  const [inventories, setInventories] = useState([]);
  const [unitTypes, setUnitTypes] = useState({});
  const [convertedStocks, setConvertedStocks] = useState({});  // State to store converted stock values
  const [selectedUnitTypes, setSelectedUnitTypes] = useState({});  // State to store selected unit types
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState(false);
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const response = await axiosInstance.get('/inventories');
        console.log("Fetched Inventories:", response.data); // Log inventory data
        setInventories(response.data);
        fetchUnitsForAllProducts(response.data);
      } catch (error) {
        console.error('Error fetching inventories:', error);
      }
    };

    const fetchUnitsForAllProducts = async (inventories) => {
      try {
          const unitTypesData = {};
          for (const inventory of inventories) {
              if (inventory.product_id) {
                  const response = await axiosInstance.get(`/units/product/${inventory.product_id}`);
                  const units = response.data;
  
                  // Use a Set to store unique unit types
                  const uniqueUnits = new Set();
  
                  units.forEach(unit => {
                      uniqueUnits.add(`${unit.buying_unit_type}-${unit.buying_unit_size}`);
                      uniqueUnits.add(`${unit.selling_unit_type}-${unit.selling_unit_size}`);
                  });
  
                  // Convert the Set back into an array of objects
                  const combinedUnits = Array.from(uniqueUnits).map(unit => {
                      const [type, size] = unit.split('-');
                      return { type, size };
                  });
  
                  console.log(`Unique units for product ${inventory.product_id}:`, combinedUnits);
                  unitTypesData[inventory.product_id] = combinedUnits;
              }
          }
          setUnitTypes(unitTypesData);
  
          const initialSelectedUnitTypes = inventories.reduce((acc, inventory) => {
              acc[inventory.inventory_id] = inventory.unit_type;
              return acc;
          }, {});
          setSelectedUnitTypes(initialSelectedUnitTypes);
  
      } catch (error) {
          console.error('Error fetching units:', error);
      }
  };
  

    fetchInventories();
  }, []);

  useEffect(() => {
    console.log("unitTypes State:", unitTypes); // Check unitTypes state
  }, [unitTypes]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = async (inventoryId) => {
    try {
      await axiosInstance.delete(`/inventories/${inventoryId}`);
      setInventories(inventories.filter(inv => inv.inventory_id !== inventoryId));
      setOpenSuccessSnackbar(true);
    } catch (error) {
      console.error('Error deleting inventory:', error);
      setOpenErrorSnackbar(true);
    }
  };

  const handleReconcileClick = (inventoryId) => {
    navigate(`/dashboard/inventories/reconcile/${inventoryId}`);
  };

  const handleCloseSnackbar = () => {
    setOpenSuccessSnackbar(false);
    setOpenErrorSnackbar(false);
  };

  const handleUnitChange = (product_id, inventory_id, event) => {
    const selectedUnitType = event.target.value;
  
    console.log("Selected Unit Type:", selectedUnitType);
    console.log("Unit Types for product:", unitTypes[product_id]);
  
    const selectedUnit = unitTypes[product_id].find(
      unit => unit.type.toLowerCase() === selectedUnitType.toLowerCase()
    );
  
    console.log("Selected Unit:", selectedUnit);
  
    const inventory = inventories.find(inv => inv.inventory_id === inventory_id);
  
    if (selectedUnit) {
      const baseUnit = unitTypes[product_id].find(
        unit => unit.type.toLowerCase() === inventory.unit_type.toLowerCase()
      );
  
      const baseUnitSize = parseFloat(baseUnit.size) || 1;
      const targetUnitSize = parseFloat(selectedUnit.size) || 1;
  
      console.log("Base Unit Size:", baseUnitSize);
      console.log("Target Unit Size:", targetUnitSize);
  
      if (baseUnitSize > 0 && targetUnitSize > 0) {
        const convertedStock = (inventory.current_stock * targetUnitSize) / baseUnitSize;
  
        setConvertedStocks(prevState => ({
          ...prevState,
          [inventory_id]: convertedStock,
        }));
  
        setSelectedUnitTypes(prevState => ({
          ...prevState,
          [inventory_id]: selectedUnitType,
        }));
  
        console.log(`Converted Stock: ${inventory.current_stock} ${inventory.unit_type} => ${convertedStock} ${selectedUnitType}`);
      } else {
        console.error("Invalid unit size detected during conversion.");
      }
    } else {
      console.error("Selected unit not found.");
    }
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
              <StyledTableCell>Unit</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((inventory) => (
              <TableRow key={inventory.inventory_id}>
                <TableCell>{inventory.shop_name}</TableCell>
                <TableCell>{`${inventory.product_name} - ${inventory.variety}`}</TableCell>
                <TableCell>
                  {convertedStocks[inventory.inventory_id] !== undefined
                    ? convertedStocks[inventory.inventory_id]
                    : inventory.current_stock}
                </TableCell>
                <TableCell>
                  <FormControl fullWidth>
                    <InputLabel>Unit Type</InputLabel>
                    <Select
                      value={selectedUnitTypes[inventory.inventory_id] || ''}
                      onChange={(event) => handleUnitChange(inventory.product_id, inventory.inventory_id, event)}
                      displayEmpty
                      fullWidth
                    >
                      {unitTypes[inventory.product_id] && unitTypes[inventory.product_id].map((unit, index) => (
                        <MenuItem key={index} value={unit.type}>
                          {unit.type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
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
        open={openSuccessSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity="success">
          Inventory updated successfully!
        </MuiAlert>
      </Snackbar>
      <Snackbar
        open={openErrorSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity="error">
          Error updating inventory!
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default ViewInventories;

import React, { useState, useEffect } from 'react';
import {
  Container,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Paper,
  Modal,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

const CustomerTransaction = () => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([
    {
      product: '',
      productName: '',
      unitTypes: [],
      unitId: '',
      unitType: '',
      price: '',
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      total: 0,
    },
  ]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [showInventoryLink, setShowInventoryLink] = useState(false);
  const [inventoryLinkData, setInventoryLinkData] = useState(null);
  const navigate = useNavigate();

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  const handleProductChange = async (index, productId) => {
    const updatedItems = [...items];
    const selectedProduct = products.find((product) => product.product_id === productId);

    updatedItems[index] = {
      ...updatedItems[index],
      product: productId,
      productName: selectedProduct ? formatProductDisplay(selectedProduct) : '',
      price: '',
      unitId: '',
      unitTypes: [],
      unitType: '',
      date: new Date().toISOString().split('T')[0],
    };

    if (selectedProduct) {
      try {
        const unitsResponse = await axiosInstance.get(`/units/product/${productId}`);
        updatedItems[index].unitTypes = unitsResponse.data.map((unit) => ({
          id: unit.unit_id,
          type: `${unit.unit_type} (${unit.unit_category})`,
          category: unit.unit_category,
        }));
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    }
    setItems(updatedItems);
  };

  const handleInputChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;

    if (field === 'unitId' && value && updatedItems[index].product) {
      handleUnitChange(index, value);
    }

    if (field === 'price' || field === 'quantity') {
      const price = parseFloat(updatedItems[index].price || 0);
      const quantity = parseFloat(updatedItems[index].quantity || 0);
      updatedItems[index].total = price * quantity;
    }
    setItems(updatedItems);

    const totalSum = updatedItems.reduce((sum, item) => sum + item.total, 0);
    setGrandTotal(totalSum);
  };

  const handleUnitChange = async (index, unitId) => {
    const updatedItems = [...items];
    const currentItem = updatedItems[index];
    
    if (unitId && currentItem.product) {
      try {
        console.log(`🔍 Fetching retail price suggestions for product ${currentItem.product}, unit ${unitId}`);
        const response = await axiosInstance.get(`/sales/price-suggestions/${currentItem.product}/${unitId}`);
        
        console.log('📊 Retail price suggestions response:', response.data);
        console.log('💰 Suggested retail price:', response.data.suggested_retail_price);
        console.log('🔢 Price type:', typeof response.data.suggested_retail_price);
        console.log('✅ Is > 0?', response.data.suggested_retail_price > 0);
        console.log('📜 Has price history?', response.data.has_price_history);
        
        // Populate price if there's any price history (even 0.00 can be useful)
        if (response.data.has_price_history) {
          console.log('✅ Has price history, setting retail price to:', response.data.suggested_retail_price.toString());
          updatedItems[index].price = response.data.suggested_retail_price.toString();
          
          if (updatedItems[index].quantity) {
            const price = parseFloat(updatedItems[index].price || 0);
            const quantity = parseFloat(updatedItems[index].quantity || 0);
            updatedItems[index].total = price * quantity;
          }
          
          setItems(updatedItems);
          
          const totalSum = updatedItems.reduce((sum, item) => sum + item.total, 0);
          setGrandTotal(totalSum);
        } else {
          console.log('❌ No price history found, clearing field');
          updatedItems[index].price = '';
          setItems(updatedItems);
        }
      } catch (error) {
        console.error('Error fetching price suggestions:', error);
        updatedItems[index].price = ''; // Clear if error
        setItems(updatedItems);
      }
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product: '',
        productName: '',
        unitTypes: [],
        unitId: '',
        unitType: '',
        price: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        total: 0,
      },
    ]);
  };

  const handleReset = (preserveSnackbar = false) => {
    setItems([
      {
        product: '',
        productName: '',
        unitTypes: [],
        unitId: '',
        unitType: '',
        price: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        total: 0,
      },
    ]);
    setGrandTotal(0);
    setShowInventoryLink(false);
    setInventoryLinkData(null);
    if (!preserveSnackbar) {
      setSnackbarOpen(false);
    }
  };

  const handleDeleteItem = (index) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);

      const totalSum = updatedItems.reduce((sum, item) => sum + item.total, 0);
      setGrandTotal(totalSum);
    } else {
      alert("Cannot delete the last remaining item. Use Reset instead");
    }
  };

  const handleSubmit = () => {
    setOpenModal(true);
  };

  const generateInventoryLink = (productId, productName, variety, linkType = 'setup') => {
    if (linkType === 'reconcile') {
      // Link to reconcile inventory page
      return `/dashboard/inventories/view`;
    } else {
      // Link to set up new inventory (default)
      const encodedName = encodeURIComponent(productName);
      const encodedVariety = encodeURIComponent(variety || '');
      return `/dashboard/inventories/stock-entry?product_id=${productId}&product_name=${encodedName}&variety=${encodedVariety}`;
    }
  };

  const handleLogSales = async () => {
    try {
      console.log('🚀 Starting sales logging process...');
      console.log('📋 Items to process:', items);
      
      // Reset states
      setShowInventoryLink(false);
      setInventoryLinkData(null);
      setSnackbarOpen(false);
      
      for (const [index, item] of items.entries()) {
        console.log(`\n📦 Processing item ${index + 1}:`);
        console.log('Raw item data:', item);
        
        // Validate required fields
        if (!item.product || !item.unitId || !item.price || !item.quantity) {
          console.error('❌ Missing required fields for item:', item);
          throw new Error(`Item ${index + 1} is missing required fields. Please fill in all fields.`);
        }
        
        // Parse the product name format: "ProductName - Variety (Brand)" or "ProductName - Variety" or "ProductName (Brand)" or "ProductName"
        let productName, variety, brand;
        
        console.log('🔍 Parsing product name:', item.productName);
        
        if (item.productName.includes('(') && item.productName.includes(')')) {
          // Has brand
          const brandMatch = item.productName.match(/\(([^)]+)\)$/);
          brand = brandMatch ? brandMatch[1] : '';
          const withoutBrand = item.productName.replace(/\s*\([^)]+\)$/, '');
          
          if (withoutBrand.includes(' - ')) {
            [productName, variety] = withoutBrand.split(' - ');
          } else {
            productName = withoutBrand;
            variety = '';
          }
        } else if (item.productName.includes(' - ')) {
          // Has variety but no brand
          [productName, variety] = item.productName.split(' - ');
          brand = '';
        } else {
          // Just product name
          productName = item.productName;
          variety = '';
          brand = '';
        }
        
        console.log('✅ Parsed product info:', { productName, variety, brand });

        const saleData = {
          product_name: productName,
          variety: variety || '',
          brand: brand || '',
          retail_price: item.price,
          quantity: item.quantity,
          sale_date: item.date,
          unit_id: item.unitId,
          unit_category: item.unitTypes.find((u) => u.id === item.unitId)?.category,
        };
        
        console.log('📤 Sending sale data to backend:', saleData);
        
        try {
          const response = await axiosInstance.post('/sales', saleData);
          console.log('✅ Sale successful for item', index + 1, ':', response.data);
        } catch (saleError) {
          console.error('❌ Failed to log sale for item', index + 1, ':', saleError);
          console.error('❌ Error details:', saleError.response?.data || saleError.message);
          
          // Check if the error is related to missing inventory or insufficient stock
          const errorMessage = saleError.response?.data?.error || saleError.message;
          
          if (errorMessage.includes('Inventory not found') || 
              errorMessage.includes('add the item to inventory') || 
              errorMessage.includes('not found for product')) {
            
            // Show inventory setup link for missing inventory
            setInventoryLinkData({
              productId: item.product,
              productName: productName,
              variety: variety || '',
              brand: brand || '',
              linkType: 'setup' // For setting up new inventory
            });
            setShowInventoryLink(true);
            setSnackbarMessage(`${errorMessage} for ${productName}${variety ? ` - ${variety}` : ''}${brand ? ` (${brand})` : ''}. Would you like to set up inventory now?`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setOpenModal(false);
            return;
          } else if (errorMessage.includes('Insufficient stock')) {
            
            // Show reconcile inventory link for insufficient stock
            setInventoryLinkData({
              productId: item.product,
              productName: productName,
              variety: variety || '',
              brand: brand || '',
              linkType: 'reconcile' // For reconciling existing inventory
            });
            setShowInventoryLink(true);
            setSnackbarMessage(`${errorMessage} for ${productName}${variety ? ` - ${variety}` : ''}${brand ? ` (${brand})` : ''}. Would you like to reconcile inventory now?`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setOpenModal(false);
            return;
          } else {
            // Show detailed error message including unit conversion info
            const unitType = item.unitTypes.find((u) => u.id === item.unitId)?.type || 'Unknown Unit';
            const detailedMessage = `Failed to log sale for item ${index + 1} (${productName} - ${item.quantity} ${unitType}): ${errorMessage}`;
            throw new Error(detailedMessage);
          }
        }
      }
      
      console.log('🎉 All sales logged successfully!');
      setOpenModal(false);
      handleReset(true); // Preserve snackbar when resetting after success
      setSnackbarMessage('Sales logged successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('❌ Error logging sales:', error);
      setSnackbarMessage(`Error logging sales: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setOpenModal(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Helper function to format product display
  const formatProductDisplay = (product) => {
    let display = product.product_name;
    if (product.variety) {
      display += ` - ${product.variety}`;
    }
    if (product.brand) {
      display += ` (${product.brand})`;
    }
    return display;
  };

  const printTable = () => {
    window.print();
  };

  return (
    <Container maxWidth="lg" sx={{ paddingY: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Customer Transaction
      </Typography>

      <Paper elevation={3} sx={{ padding: 3, borderRadius: 2 }}>
        {items.map((item, index) => (
          <Grid container spacing={2} key={index} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth required>
                <InputLabel>Product</InputLabel>
                <Select value={item.product} onChange={(e) => handleProductChange(index, e.target.value)}>
                  {products.map((product) => (
                    <MenuItem key={product.product_id} value={product.product_id}>
                      {formatProductDisplay(product)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl fullWidth required>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={item.unitId}
                  onChange={(e) => handleInputChange(index, 'unitId', e.target.value)}
                >
                  {item.unitTypes.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label="Price per unit (K)"
                type="number"
                fullWidth
                value={item.price}
                onChange={(e) => handleInputChange(index, 'price', e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                value={item.quantity}
                onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                value={item.date}
                onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Typography variant="body1" align="center" sx={{ fontWeight: 'bold' }}>
                {item.total.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleDeleteItem(index)}
              >
                Delete
              </Button>
            </Grid>
          </Grid>
        ))}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginTop: 2,
          }}
        >
          <Button variant="contained" color="primary" onClick={handleAddItem} startIcon={<AddCircleIcon />}>
            Add Item
          </Button>
          <Button variant="contained" color="error" onClick={handleReset} startIcon={<ClearIcon />}>
            Reset
          </Button>
          <Button variant="contained" color="success" onClick={handleSubmit}>
            Submit
          </Button>
        </Box>
        <Typography variant="h5" align="right" sx={{ marginTop: 2 }}>
          Grand Total: {grandTotal.toFixed(2)} ZMW
        </Typography>
      </Paper>

      {/* Confirmation Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={{ backgroundColor: 'white', padding: 3, borderRadius: 2, maxWidth: '90%', margin: '10% auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" gutterBottom>
              Confirmation of Items
            </Typography>
            <IconButton onClick={() => setOpenModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Price/Unit</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.unitTypes.find((u) => u.id === item.unitId)?.type}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="h6" align="right" sx={{ marginTop: 2, fontWeight: 'bold' }}>
            Grand Total: {grandTotal.toFixed(2)} ZMW
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-evenly', marginTop: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" color="secondary" onClick={handleLogSales}>
              Log Sales
            </Button>
            <Button variant="contained" color="primary" onClick={printTable}>
              Print / Save PDF
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
          {showInventoryLink && inventoryLinkData && (
            <Box sx={{ mt: 1 }}>
              <MuiLink
                component={Link}
                to={generateInventoryLink(
                  inventoryLinkData.productId, 
                  inventoryLinkData.productName, 
                  inventoryLinkData.variety,
                  inventoryLinkData.linkType
                )}
                variant="body2"
                sx={{ textDecoration: 'underline', color: 'inherit', fontWeight: 'bold' }}
              >
                {inventoryLinkData.linkType === 'reconcile' 
                  ? 'Click here to reconcile inventory'
                  : `Click here to set stock for ${inventoryLinkData.productName}${inventoryLinkData.variety ? ` - ${inventoryLinkData.variety}` : ''}${inventoryLinkData.brand ? ` (${inventoryLinkData.brand})` : ''}`
                }
              </MuiLink>
            </Box>
          )}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CustomerTransaction;

import React, { useState, useEffect } from 'react';
import axiosInstance from '../AxiosInstance';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  Card,
  CardContent,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Modal,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  Link as MuiLink,
} from '@mui/material';
import { Link } from 'react-router-dom';

const AddPurchase = () => {
  const [products, setProducts] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  // const [selectedSource, setSelectedSource] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUnitType, setSelectedUnitType] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  // const [suppliers, setSuppliers] = useState([]);
  const [isProductSelected, setIsProductSelected] = useState(false);
  const [dateWarning, setDateWarning] = useState('');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [showInventoryLink, setShowInventoryLink] = useState(false);
  const [inventoryLinkData, setInventoryLinkData] = useState(null);

  // Modal State for Adding a New Source
  // const [modalOpen, setModalOpen] = useState(false);
  // const [sourceType, setSourceType] = useState('supplier');
  // const [supplierName, setSupplierName] = useState('');
  // const [contactInfo, setContactInfo] = useState('');
  // const [location, setLocation] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await axiosInstance.get('/products');
        setProducts(productsResponse.data);

        // const suppliersResponse = await axiosInstance.get('/suppliers');
        // setSuppliers(suppliersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleProductChange = async (e) => {
    setProductDetails(e.target.value);
    setIsProductSelected(true);
    setSelectedUnitType('');
    setSelectedUnitId('');
    setOrderPrice('');
    setShowInventoryLink(false);
    
    // Parse the product details format: "ProductName - Variety (Brand)" or "ProductName - Variety" or "ProductName (Brand)" or "ProductName"
    let productName, variety, brand;
    
    if (e.target.value.includes('(') && e.target.value.includes(')')) {
      // Has brand
      const brandMatch = e.target.value.match(/\(([^)]+)\)$/);
      brand = brandMatch ? brandMatch[1] : '';
      const withoutBrand = e.target.value.replace(/\s*\([^)]+\)$/, '');
      
      if (withoutBrand.includes(' - ')) {
        [productName, variety] = withoutBrand.split(' - ');
      } else {
        productName = withoutBrand;
        variety = '';
      }
    } else if (e.target.value.includes(' - ')) {
      // Has variety but no brand
      [productName, variety] = e.target.value.split(' - ');
      brand = '';
    } else {
      // Just product name
      productName = e.target.value;
      variety = '';
      brand = '';
    }

    const product = products.find(product => 
      product.product_name === productName && 
      (product.variety || '') === variety &&
      (product.brand || '') === brand
    );
    setCurrentProduct(product);

    if (product) {
      try {
        const unitsResponse = await axiosInstance.get(`/units/product/${product.product_id}`);
        const units = unitsResponse.data;
        // Filter for buying units only and remove category from display
        const buyingUnits = units.filter(unit => unit.unit_category === 'buying');
        setUnitTypes(buyingUnits.map(unit => ({
          type: unit.unit_type, // Remove (buying) from display
          id: unit.unit_id,
          unitCategory: unit.unit_category
        })));
        // Comment out the old code that showed all units with category in parentheses
        // setUnitTypes(units.map(unit => ({
        //   type: `${unit.unit_type} (${unit.unit_category})`,
        //   id: unit.unit_id,
        //   unitCategory: unit.unit_category
        // })));
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset inventory link visibility
    setShowInventoryLink(false);

    // const selectedSourceDetails = suppliers.find(
    //   (supplier) => supplier.market_name === selectedSource || supplier.name === selectedSource
    // );
    
    // Parse the product details format: "ProductName - Variety (Brand)" or "ProductName - Variety" or "ProductName (Brand)" or "ProductName"
    let productName, variety, brand;
    
    if (productDetails.includes('(') && productDetails.includes(')')) {
      // Has brand
      const brandMatch = productDetails.match(/\(([^)]+)\)$/);
      brand = brandMatch ? brandMatch[1] : '';
      const withoutBrand = productDetails.replace(/\s*\([^)]+\)$/, '');
      
      if (withoutBrand.includes(' - ')) {
        [productName, variety] = withoutBrand.split(' - ');
      } else {
        productName = withoutBrand;
        variety = '';
      }
    } else if (productDetails.includes(' - ')) {
      // Has variety but no brand
      [productName, variety] = productDetails.split(' - ');
      brand = '';
    } else {
      // Just product name
      productName = productDetails;
      variety = '';
      brand = '';
    }
    
    const selectedUnit = unitTypes.find(unit => unit.type === selectedUnitType);

    try {
      // Validate that a unit is selected
      if (!selectedUnit) {
        setSnackbarMessage('Please select a unit type');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // DEBUG: Log all the data being sent to backend
      const requestData = {
        product_name: productName,
        variety: variety || '', // Ensure variety is never undefined
        brand: brand || '', // Include brand information
        // supplier_name: selectedSourceDetails?.name || null,
        // market_name: selectedSourceDetails?.market_name || null,
        supplier_name: null,
        market_name: null,
        order_price: orderPrice,
        quantity,
        purchase_date: purchaseDate,
        unit_id: selectedUnit.id,
        unit_category: selectedUnit.unitCategory,
      };

      console.log('🔍 DEBUG - Request data being sent to backend:', JSON.stringify(requestData, null, 2));
      console.log('🔍 DEBUG - Selected unit details:', selectedUnit);
      console.log('🔍 DEBUG - Current product details:', currentProduct);
      console.log('🔍 DEBUG - Product details string:', productDetails);

      await axiosInstance.post('/purchases', requestData);
      
      setSnackbarMessage('Purchase added successfully!');
      setSnackbarSeverity('success');
      // setSelectedSource('');
      setOrderPrice('');
      setQuantity('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setSelectedUnitType('');
      setSelectedUnitId('');
      setProductDetails('');
      setIsProductSelected(false);
      setCurrentProduct(null);
      setShowInventoryLink(false);
    } catch (error) {
      console.error('❌ Error adding purchase:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error stack:', error.stack);
      
      // Check if the error is related to missing inventory
      const errorMessage = error.response?.data?.error || error.message;
      
      if (errorMessage.includes('Inventory not found') || 
          errorMessage.includes('add the item to inventory') || 
          errorMessage.includes('not found for product')) {
        
        // Show inventory link for this product
        setInventoryLinkData({
          productId: currentProduct?.product_id,
          productName: productName,
          variety: variety || '',
          brand: brand || ''
        });
        setShowInventoryLink(true);
        setSnackbarMessage(`${errorMessage} Would you like to set the stock now?`);
      } else {
        setSnackbarMessage('Error adding purchase: ' + errorMessage);
      }
      setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
  };

  // const handleAddSource = async () => {
  //   try {
  //     await axiosInstance.post('/suppliers', {
  //       source_type: sourceType,
  //       supplier_name: sourceType === 'supplier' ? supplierName : '',
  //       market_name: sourceType === 'market' ? supplierName : '',
  //       contact_info: contactInfo,
  //       location,
  //     });
  //     setSnackbarMessage('Source added successfully!');
  //     setSnackbarSeverity('success');
  //     setSupplierName('');
  //     setContactInfo('');
  //     setLocation('');
  //     setModalOpen(false);

  //     // Refresh suppliers list
  //     const suppliersResponse = await axiosInstance.get('/suppliers');
  //     setSuppliers(suppliersResponse.data);
  //   } catch (error) {
  //     setSnackbarMessage('Error adding source');
  //     setSnackbarSeverity('error');
  //   } finally {
  //     setSnackbarOpen(true);
  //   }
  // };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const checkFutureDate = (date) => {
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      setDateWarning('Warning: You are entering a future date for this purchase.');
    } else {
      setDateWarning('');
    }
  };

  const generateInventoryLink = () => {
    if (!inventoryLinkData) return '';
    const encodedName = encodeURIComponent(inventoryLinkData.productName);
    const encodedVariety = encodeURIComponent(inventoryLinkData.variety || '');
    return `/dashboard/inventories/stock-entry?product_id=${inventoryLinkData.productId}&product_name=${encodedName}&variety=${encodedVariety}`;
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

  const handleUnitTypeChange = async (e) => {
    setSelectedUnitType(e.target.value);
    const selectedUnit = unitTypes.find(unit => unit.type === e.target.value);
    
    if (selectedUnit && currentProduct) {
      setSelectedUnitId(selectedUnit.id);
      
      try {
        console.log(`🔍 Fetching price suggestions for product ${currentProduct.product_id}, unit ${selectedUnit.id}`);
        const response = await axiosInstance.get(`/purchases/price-suggestions/${currentProduct.product_id}/${selectedUnit.id}`);
        
        console.log('📊 Price suggestions response:', response.data);
        console.log('💰 Suggested order price:', response.data.suggested_order_price);
        console.log('🔢 Price type:', typeof response.data.suggested_order_price);
        console.log('✅ Is > 0?', response.data.suggested_order_price > 0);
        console.log('📜 Has price history?', response.data.has_price_history);
        
        // Populate price if there's any price history (even 0.00 can be useful)
        if (response.data.has_price_history) {
          console.log('✅ Has price history, setting order price to:', response.data.suggested_order_price.toString());
          setOrderPrice(response.data.suggested_order_price.toString());
        } else {
          console.log('❌ No price history found, clearing field');
          setOrderPrice('');
        }
      } catch (error) {
        console.error('Error fetching price suggestions:', error);
        setOrderPrice('');
      }
    }
  };

  return (
    <Container maxWidth="md" sx={{ paddingY: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Add Purchase
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Select the product purchased</InputLabel>
                <Select value={productDetails} onChange={handleProductChange}>
                  {products.map((product) => (
                    <MenuItem key={product.product_id} value={formatProductDisplay(product)}>
                      {formatProductDisplay(product)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {isProductSelected && (
                <>
                  <FormControl fullWidth required>
                    <InputLabel>Unit Type (Category)</InputLabel>
                    <Select value={selectedUnitType} onChange={handleUnitTypeChange}>
                      {unitTypes.map((unit) => (
                        <MenuItem key={unit.id} value={unit.type}>
                          {unit.type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* <FormControl fullWidth required>
                    <InputLabel>Select Source</InputLabel>
                    <Select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
                      {suppliers.map((supplier, index) => (
                        <MenuItem key={index} value={supplier.name || supplier.market_name}>
                          {supplier.name ? `Supplier - ${supplier.name}` : `Market - ${supplier.market_name}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl> */}

                  <TextField
                    label="Order Price"
                    type="number"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    fullWidth
                    required
                  />

                  <TextField
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    fullWidth
                    required
                  />

                  <TextField
                    label="Purchase Date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => {
                      setPurchaseDate(e.target.value);
                      checkFutureDate(e.target.value);
                    }}
                    fullWidth
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  {dateWarning && (
                    <Typography color="warning.main" variant="body2">
                      {dateWarning}
                    </Typography>
                  )}
                  <Button type="submit" variant="contained" color="primary" size="large">
                    Add Purchase
                  </Button>
                </>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Add Source Modal */}
      {/* <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Add Source
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <RadioGroup
              row
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
            >
              <FormControlLabel value="supplier" control={<Radio />} label="Supplier" />
              <FormControlLabel value="market" control={<Radio />} label="Market" />
            </RadioGroup>
          </FormControl>
          <TextField
            label={sourceType === 'supplier' ? 'Supplier Name' : 'Market Name'}
            variant="outlined"
            fullWidth
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Phone Number"
            variant="outlined"
            fullWidth
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Location"
            variant="outlined"
            fullWidth
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <Button onClick={handleAddSource} variant="contained" color="primary" fullWidth>
            Add Source
          </Button>
        </Box>
      </Modal> */}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
          {showInventoryLink && inventoryLinkData && (
            <Box sx={{ mt: 1 }}>
              <MuiLink
                component={Link}
                to={generateInventoryLink()}
                variant="body2"
                sx={{ textDecoration: 'underline', color: 'inherit' }}
              >
                Click here to set stock for {inventoryLinkData.productName}
                {inventoryLinkData.variety && ` - ${inventoryLinkData.variety}`}
                {inventoryLinkData.brand && ` (${inventoryLinkData.brand})`}
              </MuiLink>
            </Box>
          )}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddPurchase;

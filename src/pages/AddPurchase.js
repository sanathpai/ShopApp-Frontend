import React, { useState, useEffect, useRef } from 'react';
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
  Paper,
  List,
  ListItem,
  ListItemText,
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

  // Search functionality states
  const [searchResults, setSearchResults] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [productName, setProductName] = useState('');
  const [productsLoading, setProductsLoading] = useState(false); // Set to false since we don't load all products

  // Refs for search functionality
  const justSelectedRef = useRef(false);
  const blurTimeoutRef = useRef(null);

  // Modal State for Adding a New Source
  // const [modalOpen, setModalOpen] = useState(false);
  // const [sourceType, setSourceType] = useState('supplier');
  // const [supplierName, setSupplierName] = useState('');
  // const [contactInfo, setContactInfo] = useState('');
  // const [location, setLocation] = useState('');

  // Remove the products loading useEffect entirely since we only use search now
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       setProductsLoading(true); // Set loading to true before fetching
  //       const productsResponse = await axiosInstance.get('/products');
  //       setProducts(productsResponse.data);

  //       // const suppliersResponse = await axiosInstance.get('/suppliers');
  //       // setSuppliers(suppliersResponse.data);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     } finally {
  //       setProductsLoading(false); // Set loading to false after fetching
  //     }
  //   };

  //   fetchData();
  // }, []);

  // Search functionality for products when there are more than 5
  useEffect(() => {
    const updateSearchResults = async () => {
      // Enable search immediately without waiting for products.length check
      if (productName.length > 2 && isOnline && !justSelectedRef.current) {
        try {
          console.log(`🔍 Searching for products with query: "${productName}"`);
          const response = await axiosInstance.get(`/products/search?q=${productName}`);
          console.log('🔍 Raw search response:', response.data);
          
          const uniqueResults = response.data.reduce((acc, product) => {
            const key = `${product.product_name}-${product.variety || ''}-${product.brand || ''}`;
            if (!acc[key]) {
              acc[key] = product;
            }
            return acc;
          }, {});
          setSearchResults(Object.values(uniqueResults));
          console.log(`✅ Processed ${Object.values(uniqueResults).length} unique results`);
        } catch (error) {
          console.error('❌ Error fetching search results:', error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
      
      // Reset the justSelected flag after the effect runs
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
      }
    };

    updateSearchResults();
  }, [productName, isOnline]); // Remove products.length dependency

  // Network status handling
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // Clear any pending blur timeout
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Handle product selection for searchable field
  const handleSelectProduct = (product) => {
    console.log('🔍 handleSelectProduct called with:', product);
    
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    justSelectedRef.current = true; // Set flag to prevent immediate search
    
    // Check if product has the expected fields
    console.log('📦 Product object structure:', Object.keys(product));
    console.log('🔑 Product ID:', product.product_id);
    
    const productId = product.product_id;
    
    if (!productId) {
      console.error('❌ Product missing ID field:', product);
      setSnackbarMessage('Error: Product selection failed - missing ID');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    // Set the formatted product display
    const formattedDisplay = formatProductDisplay(product);
    setProductDetails(formattedDisplay);
    setProductName(formattedDisplay);
    setIsProductSelected(true);
    setSelectedUnitType('');
    setSelectedUnitId('');
    setOrderPrice('');
    setShowInventoryLink(false);
    setCurrentProduct(product);
    
    // Fetch units for the selected product
    const fetchUnits = async () => {
      try {
        const unitsResponse = await axiosInstance.get(`/units/product/${productId}`);
        const units = unitsResponse.data;
        const buyingUnits = units.filter(unit => unit.unit_category === 'buying');
        setUnitTypes(buyingUnits.map(unit => ({
          type: unit.unit_type,
          id: unit.unit_id,
          unitCategory: unit.unit_category
        })));
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };
    
    fetchUnits();
    
    // Clear search results
    setSearchResults([]);
  };

  // Handle product name change for searchable field
  const handleProductNameChange = (value) => {
    setProductName(value);
    setProductDetails('');
    setIsProductSelected(false);
    setSelectedUnitType('');
    setSelectedUnitId('');
    setOrderPrice('');
    setShowInventoryLink(false);
    setCurrentProduct(null);
    setUnitTypes([]);
  };

  // Handle blur for searchable field
  const handleProductNameBlur = () => {
    // Clear search results after a small delay to allow clicking on results
    blurTimeoutRef.current = setTimeout(() => {
      setSearchResults([]);
    }, 150);
  };

  // Handle focus for searchable field
  const handleProductNameFocus = () => {
    // Clear any pending blur timeout when field gets focus again
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  // Render product selection component based on product count
  const renderProductSelection = () => {
    // Show loading state while products are being fetched
    if (productsLoading) {
      return (
        <TextField
          label="Loading products..."
          variant="outlined"
          fullWidth
          disabled
          helperText="Please wait while products are being loaded..."
        />
      );
    }

    // Always show searchable field once products are loaded
    return (
      <Box>
        <TextField
          label="Product name"
          variant="outlined"
          fullWidth
          value={productName}
          onChange={(e) => handleProductNameChange(e.target.value)}
          onBlur={handleProductNameBlur}
          onFocus={handleProductNameFocus}
          required
          helperText="Start typing to search products..."
        />
        <List>
          {searchResults.map((product, resultIndex) => (
            <ListItem 
              button 
              key={resultIndex} 
              onClick={() => handleSelectProduct(product)}
            >
              <ListItemText 
                primary={product.product_name}
                secondary={`${product.brand ? `Brand: ${product.brand}` : 'No brand'}${product.variety ? ` | Variety: ${product.variety}` : ' | No variety'}${product.size ? ` | Size: ${product.size}` : ''}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset inventory link visibility
    setShowInventoryLink(false);

    // Validate that a product is selected
    if (!currentProduct) {
      setSnackbarMessage('Please select a product');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Use the actual product data from currentProduct instead of parsing the display string
    const productName = currentProduct.product_name;
    const variety = currentProduct.variety || '';
    const brand = currentProduct.brand || '';
    
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
              {renderProductSelection()}

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

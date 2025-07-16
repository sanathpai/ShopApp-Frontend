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
  Link as MuiLink,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Link } from 'react-router-dom';

const AddSale = () => {
  const [products, setProducts] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [retailPrice, setRetailPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date
  const [selectedUnitId, setSelectedUnitId] = useState('');  // Updated to use unit_id instead of unit_type
  const [productDetails, setProductDetails] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isProductSelected, setIsProductSelected] = useState(false); // To control visibility
  const [dateWarning, setDateWarning] = useState('');
  const [currentProduct, setCurrentProduct] = useState(null); // Store current product info
  const [showInventoryLink, setShowInventoryLink] = useState(false); // Control showing inventory link
  const [inventoryLinkData, setInventoryLinkData] = useState(null); // Store product data for inventory link

  // Search functionality states
  const [searchResults, setSearchResults] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [productName, setProductName] = useState('');
  const [productsLoading, setProductsLoading] = useState(false); // Set to false since we don't load all products

  // Refs for search functionality
  const justSelectedRef = useRef(false);
  const blurTimeoutRef = useRef(null);

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
    setSelectedUnitId('');
    setRetailPrice('');
    setShowInventoryLink(false);
    setCurrentProduct(product);
    
    // Fetch units for the selected product
    const fetchUnits = async () => {
      try {
        const unitsResponse = await axiosInstance.get(`/units/product/${productId}`);
        const units = unitsResponse.data;
        const sellingUnits = units.filter(unit => unit.unit_category === 'selling');
        setUnitTypes(sellingUnits.map(unit => ({
          unit_type: unit.unit_type,
          unit_id: unit.unit_id,
          unit_category: unit.unit_category
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
    setSelectedUnitId('');
    setRetailPrice('');
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

  const handleUnitChange = async (e) => {
    const unitId = e.target.value;
    setSelectedUnitId(unitId);
    
    if (unitId && currentProduct) {
      try {
        console.log(`🔍 Fetching retail price suggestions for product ${currentProduct.product_id}, unit ${unitId}`);
        const response = await axiosInstance.get(`/sales/price-suggestions/${currentProduct.product_id}/${unitId}`);
        
        console.log('📊 Retail price suggestions response:', response.data);
        console.log('💰 Suggested retail price:', response.data.suggested_retail_price);
        
        // Populate price if there's any price history
        if (response.data.has_price_history) {
          console.log('✅ Has price history, setting retail price to:', response.data.suggested_retail_price.toString());
          setRetailPrice(response.data.suggested_retail_price.toString());
        } else {
          console.log('❌ No price history found, clearing field');
          setRetailPrice('');
        }
      } catch (error) {
        console.error('Error fetching price suggestions:', error);
        setRetailPrice(''); // Clear if error
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset inventory link visibility
    setShowInventoryLink(false);
    
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

    // Find the selected unit details
    const selectedUnit = unitTypes.find(unit => unit.unit_id === selectedUnitId);

    try {
      // Validate that a unit is selected
      if (!selectedUnit) {
        setSnackbarMessage('Please select a unit type');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      await axiosInstance.post('/sales', {
        product_name: productName,
        variety: variety || '', // Ensure variety is never undefined
        brand: brand || '', // Include brand information
        retail_price: retailPrice,
        quantity: quantity,
        sale_date: saleDate,
        unit_id: selectedUnitId,  // Use the unit_id
        unit_category: selectedUnit.unit_category // Include the unit_category
      });
      setSnackbarMessage('Sale added successfully!');
      setSnackbarSeverity('success');
      setRetailPrice('');
      setQuantity('');
      setSaleDate(new Date().toISOString().split('T')[0]); // Reset to today's date
      setSelectedUnitId('');
      setProductDetails('');
      setIsProductSelected(false); // Reset product selection
      setCurrentProduct(null);
      setShowInventoryLink(false); // Reset inventory link visibility
    } catch (error) {
      console.error('Error adding sale:', error);
      
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
        setSnackbarMessage('Sale Addition failed. Verify if you have enough stocks in inventory');
      }
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const getSalePriceLabel = () => {
    const selectedUnit = unitTypes.find(unit => unit.unit_id === selectedUnitId);
    return selectedUnit
      ? `Retail Price (per ${selectedUnit.unit_type})(K)`
      : 'Retail Price per unit (K)';
  };

  const checkFutureDate = (date) => {
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      setDateWarning('Warning: You are entering a future date for this sale.');
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

  return (
    <Container maxWidth="md" sx={{ paddingY: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Add Sale
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {renderProductSelection()}

              {isProductSelected && (
                <>
                  <FormControl fullWidth required>
                    <InputLabel>Unit Type (Category)</InputLabel>
                    <Select value={selectedUnitId} onChange={handleUnitChange}>
                      {unitTypes.map((unit) => (
                        <MenuItem key={unit.unit_id} value={unit.unit_id}>
                          {unit.unit_type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label={getSalePriceLabel()}
                    type="number"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
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
                    label="Sale Date"
                    type="date"
                    value={saleDate}
                    onChange={(e) => {
                      setSaleDate(e.target.value);
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
                    Add Sale
                  </Button>
                </>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>

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

export default AddSale;

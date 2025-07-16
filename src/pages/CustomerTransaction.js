import React, { useState, useEffect, useRef } from 'react';
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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';

// Generate unique transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN-${timestamp}-${random}`;
};

const CustomerTransaction = () => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([
    {
      product: '',
      productName: '',
      // Add fields to store the actual product details for the backend
      productDetails: {
        product_name: '',
        variety: '',
        brand: '',
        size: '',
      },
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
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  
  // Search functionality states (similar to AddProduct)
  const [searchResults, setSearchResults] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [productsLoading, setProductsLoading] = useState(false); // Set to false since we don't load all products
  
  // Refs for search functionality
  const justSelectedRef = useRef({});
  const blurTimeoutRef = useRef({});
  
  const navigate = useNavigate();

  // Remove the products loading useEffect entirely since we only use search now
  // useEffect(() => {
  //   const fetchProducts = async () => {
  //     try {
  //       setProductsLoading(true); // Set loading to true before fetching
  //       const response = await axiosInstance.get('/products');
  //       setProducts(response.data);
  //     } catch (error) {
  //       console.error('Error fetching products:', error);
  //     } finally {
  //       setProductsLoading(false); // Set loading to false after fetching
  //     }
  //   };
  //   fetchProducts();
  // }, []);

  // Search functionality for products when there are more than 5
  useEffect(() => {
    const updateSearchResults = async () => {
      const newSearchResults = {};
      
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const productSearchText = item.productName;
        
        // Enable search immediately without waiting for products.length check
        if (productSearchText.length > 2 && isOnline && !justSelectedRef.current[index]) {
          try {
            console.log(`🔍 Searching for products with query: "${productSearchText}"`);
            const response = await axiosInstance.get(`/products/search?q=${productSearchText}`);
            console.log('🔍 Raw search response:', response.data);
            
            // Log the structure of the first result to understand the data format
            if (response.data.length > 0) {
              console.log('📦 First search result structure:', Object.keys(response.data[0]));
              console.log('📦 First search result data:', response.data[0]);
            }
            
            const uniqueResults = response.data.reduce((acc, product) => {
              const key = `${product.product_name}-${product.variety || ''}-${product.brand || ''}`;
              if (!acc[key]) {
                acc[key] = product;
              }
              return acc;
            }, {});
            newSearchResults[index] = Object.values(uniqueResults);
            console.log(`✅ Processed ${newSearchResults[index].length} unique results for item ${index}`);
          } catch (error) {
            console.error('❌ Error fetching search results:', error);
            newSearchResults[index] = [];
          }
        } else {
          newSearchResults[index] = [];
        }
        
        // Reset the justSelected flag after the effect runs
        if (justSelectedRef.current[index]) {
          justSelectedRef.current[index] = false;
        }
      }
      
      setSearchResults(newSearchResults);
    };

    updateSearchResults();
  }, [items, isOnline]); // Remove products.length dependency

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
      // Clear any pending blur timeouts
      Object.values(blurTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Generate a new transaction ID when component mounts or when transaction is reset
  useEffect(() => {
    setCurrentTransactionId(generateTransactionId());
  }, []);

  const handleProductChange = async (index, productId) => {
    console.log('🔧 handleProductChange called with:', { index, productId });
    
    const updatedItems = [...items];
    
    try {
      // Fetch the specific product by ID
      const productResponse = await axiosInstance.get(`/products/${productId}`);
      const selectedProduct = productResponse.data;
      
      console.log('🔍 Fetched product with ID:', productId);
      console.log('🎯 Found product:', selectedProduct);

      updatedItems[index] = {
        ...updatedItems[index],
        product: productId,
        productName: selectedProduct ? formatProductDisplay(selectedProduct) : '',
        // Store the actual product details for the backend
        productDetails: selectedProduct ? {
          product_name: selectedProduct.product_name,
          variety: selectedProduct.variety || '',
          brand: selectedProduct.brand || '',
          size: selectedProduct.size || selectedProduct.description || '',
        } : {
          product_name: '',
          variety: '',
          brand: '',
          size: '',
        },
        price: '',
        unitId: '',
        unitTypes: [],
        unitType: '',
        date: new Date().toISOString().split('T')[0],
      };

      console.log('📝 Updated item data:', updatedItems[index]);

      if (selectedProduct) {
        try {
          console.log('🌐 Fetching units for product:', productId);
          const unitsResponse = await axiosInstance.get(`/units/product/${productId}`);
          console.log('📦 Units response:', unitsResponse.data);
          
          // Filter for selling units only and remove category from display
          const sellingUnits = unitsResponse.data.filter(unit => unit.unit_category === 'selling');
          console.log('🏷️ Filtered selling units:', sellingUnits);
          
          updatedItems[index].unitTypes = sellingUnits.map((unit) => ({
            id: unit.unit_id,
            type: unit.unit_type, // Remove (selling) from display
            category: unit.unit_category,
          }));
          
          console.log('✅ Final unit types for item:', updatedItems[index].unitTypes);
        } catch (error) {
          console.error('❌ Error fetching units:', error);
        }
      } else {
        console.warn('⚠️ No product found with the given ID');
      }
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      // Set empty values if product fetch fails
      updatedItems[index] = {
        ...updatedItems[index],
        product: '',
        productName: '',
        productDetails: {
          product_name: '',
          variety: '',
          brand: '',
          size: '',
        },
        price: '',
        unitId: '',
        unitTypes: [],
        unitType: '',
        date: new Date().toISOString().split('T')[0],
      };
    }
    
    console.log('💾 Setting items with updated data');
    setItems(updatedItems);
  };

  // Handle product selection for searchable field
  const handleSelectProduct = (index, product) => {
    console.log('🔍 handleSelectProduct called with:', { index, product });
    console.log('🔍 Current search results for index:', searchResults[index]);
    console.log('🔍 Current items state:', items);
    
    // Clear any pending blur timeout
    if (blurTimeoutRef.current[index]) {
      console.log('🔄 Clearing blur timeout in handleSelectProduct');
      clearTimeout(blurTimeoutRef.current[index]);
      blurTimeoutRef.current[index] = null;
    }
    
    justSelectedRef.current[index] = true; // Set flag to prevent immediate search
    
    // Check if product has the expected fields
    console.log('📦 Product object structure:', Object.keys(product));
    console.log('🔑 Product ID:', product.product_id);
    
    // Use the product_id directly from search results (now included in API response)
    const productId = product.product_id;
    
    if (!productId) {
      console.error('❌ Product missing ID field:', product);
      setSnackbarMessage('Error: Product selection failed - missing ID');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    // Update the item with selected product
    console.log('✅ Calling handleProductChange with productId:', productId);
    handleProductChange(index, productId);
    
    // Clear search results for this item
    console.log('🧹 Clearing search results for index:', index);
    setSearchResults(prev => {
      const updated = {
        ...prev,
        [index]: []
      };
      console.log('🧹 Updated search results:', updated);
      return updated;
    });
  };

  // Handle product name change for searchable field
  const handleProductNameChange = (index, value) => {
    const updatedItems = [...items];
    updatedItems[index].productName = value;
    updatedItems[index].product = '';
    updatedItems[index].productDetails = {
      product_name: '',
      variety: '',
      brand: '',
      size: '',
    };
    updatedItems[index].unitTypes = [];
    updatedItems[index].unitId = '';
    updatedItems[index].price = '';
    setItems(updatedItems);
  };

  // Handle blur for searchable field
  const handleProductNameBlur = (index) => {
    // Clear search results after a longer delay to allow clicking on results
    blurTimeoutRef.current[index] = setTimeout(() => {
      console.log(`🔄 Clearing search results for index ${index} due to blur`);
      setSearchResults(prev => ({
        ...prev,
        [index]: []
      }));
    }, 300); // Increased from 150ms to 300ms
  };

  // Handle focus for searchable field
  const handleProductNameFocus = (index) => {
    // Clear any pending blur timeout when field gets focus again
    if (blurTimeoutRef.current[index]) {
      console.log(`🔄 Cancelling blur timeout for index ${index} due to focus`);
      clearTimeout(blurTimeoutRef.current[index]);
      blurTimeoutRef.current[index] = null;
    }
  };

  // Render product selection component based on product count
  const renderProductSelection = (item, index) => {
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
      <Box sx={{ position: 'relative' }}>
        <TextField
          label="Product name"
          variant="outlined"
          fullWidth
          value={item.productName}
          onChange={(e) => handleProductNameChange(index, e.target.value)}
          onBlur={() => handleProductNameBlur(index)}
          onFocus={() => handleProductNameFocus(index)}
          required
          helperText="Start typing to search products..."
        />
        {searchResults[index] && searchResults[index].length > 0 && (
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              maxHeight: 200,
              overflow: 'auto',
              mt: 1,
              border: '1px solid #e0e0e0',
            }}
            onMouseEnter={() => {
              // Prevent blur timeout when hovering over results
              if (blurTimeoutRef.current[index]) {
                clearTimeout(blurTimeoutRef.current[index]);
                blurTimeoutRef.current[index] = null;
              }
            }}
          >
            <List dense>
              {searchResults[index].map((product, resultIndex) => (
                <ListItem 
                  button 
                  key={resultIndex} 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`🖱️ Clicked on product: ${product.product_name} for index ${index}`);
                    handleSelectProduct(index, product);
                  }}
                  onMouseDown={(e) => {
                    // Prevent the TextField from losing focus on mousedown
                    e.preventDefault();
                  }}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <ListItemText 
                    primary={product.product_name}
                    secondary={`${product.brand ? `Brand: ${product.brand}` : 'No brand'}${product.variety ? ` | Variety: ${product.variety}` : ' | No variety'}${product.size ? ` | Size: ${product.size}` : ''}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    );
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
        // Add fields to store the actual product details for the backend
        productDetails: {
          product_name: '',
          variety: '',
          brand: '',
          size: '',
        },
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
    // Clear all search state
    setSearchResults({});
    
    // Clear all timeouts
    Object.values(blurTimeoutRef.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    blurTimeoutRef.current = {};
    justSelectedRef.current = {};
    
    setItems([
      {
        product: '',
        productName: '',
        // Add fields to store the actual product details for the backend
        productDetails: {
          product_name: '',
          variety: '',
          brand: '',
          size: '',
        },
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
    
    // Generate new transaction ID for next transaction
    setCurrentTransactionId(generateTransactionId());
    
    if (!preserveSnackbar) {
      setSnackbarOpen(false);
    }
  };

  const handleDeleteItem = (index) => {
    if (items.length > 1) {
      // Clean up search state for the deleted item
      if (blurTimeoutRef.current[index]) {
        clearTimeout(blurTimeoutRef.current[index]);
        delete blurTimeoutRef.current[index];
      }
      delete justSelectedRef.current[index];
      
      // Remove the item
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);

      // Clean up search results - re-index remaining items
      const newSearchResults = {};
      const newBlurTimeouts = {};
      const newJustSelected = {};
      
      updatedItems.forEach((_, i) => {
        const oldIndex = i >= index ? i + 1 : i;
        if (searchResults[oldIndex]) {
          newSearchResults[i] = searchResults[oldIndex];
        }
        if (blurTimeoutRef.current[oldIndex]) {
          newBlurTimeouts[i] = blurTimeoutRef.current[oldIndex];
        }
        if (justSelectedRef.current[oldIndex]) {
          newJustSelected[i] = justSelectedRef.current[oldIndex];
        }
      });
      
      setSearchResults(newSearchResults);
      blurTimeoutRef.current = newBlurTimeouts;
      justSelectedRef.current = newJustSelected;

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
    setOpenModal(false);
    
    try {
      console.log('🛒 Starting customer transaction processing...');
      console.log('🔖 Transaction ID:', currentTransactionId);
      console.log('📦 Items to process:', items.length);
      
      for (const [index, item] of items.entries()) {
        console.log(`\n📦 Processing item ${index + 1}:`);
        console.log('Raw item data:', item);
        
        // Validate required fields
        if (!item.product || !item.unitId || !item.price || !item.quantity) {
          console.error('❌ Missing required fields for item:', item);
          throw new Error(`Item ${index + 1} is missing required fields. Please fill in all fields.`);
        }
        
        console.log('🔍 Using product details:', item.productDetails);

        const saleData = {
          product_name: item.productDetails.product_name,
          variety: item.productDetails.variety,
          brand: item.productDetails.brand,
          retail_price: item.price,
          quantity: item.quantity,
          sale_date: item.date,
          unit_id: item.unitId,
          unit_category: item.unitTypes.find((u) => u.id === item.unitId)?.category,
          trans_id: currentTransactionId // Add the transaction ID to group all sales
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
              productName: item.productName, // Use the formatted product name for display
              variety: item.productDetails.variety,
              brand: item.productDetails.brand,
              size: item.productDetails.size,
              linkType: 'setup' // For setting up new inventory
            });
            setShowInventoryLink(true);
            setSnackbarMessage(`${errorMessage} for ${item.productDetails.product_name}${item.productDetails.brand ? ` (${item.productDetails.brand})` : ''}${item.productDetails.variety || item.productDetails.size ? ` - ${[item.productDetails.variety, item.productDetails.size].filter(Boolean).join(', ')}` : ''}. Would you like to set up inventory now?`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setOpenModal(false);
            return;
          } else if (errorMessage.includes('Insufficient stock')) {
            
            // Show reconcile inventory link for insufficient stock
            setInventoryLinkData({
              productId: item.product,
              productName: item.productName, // Use the formatted product name for display
              variety: item.productDetails.variety,
              brand: item.productDetails.brand,
              size: item.productDetails.size,
              linkType: 'reconcile' // For reconciling existing inventory
            });
            setShowInventoryLink(true);
            setSnackbarMessage(`${errorMessage} for ${item.productDetails.product_name}${item.productDetails.brand ? ` (${item.productDetails.brand})` : ''}${item.productDetails.variety || item.productDetails.size ? ` - ${[item.productDetails.variety, item.productDetails.size].filter(Boolean).join(', ')}` : ''}. Would you like to reconcile inventory now?`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            setOpenModal(false);
            return;
          } else {
            // Show detailed error message including unit conversion info
            const unitType = item.unitTypes.find((u) => u.id === item.unitId)?.type || 'Unknown Unit';
            const detailedMessage = `Failed to log sale for item ${index + 1} (${item.productDetails.product_name} - ${item.quantity} ${unitType}): ${errorMessage}`;
            throw new Error(detailedMessage);
          }
        }
      }
      
      console.log('🎉 All sales logged successfully!');
      console.log('🔖 Transaction completed with ID:', currentTransactionId);
      setOpenModal(false);
      handleReset(true); // Preserve snackbar when resetting after success
      setSnackbarMessage(`Customer transaction completed successfully! Transaction ID: ${currentTransactionId}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('❌ Error during transaction processing:', error.message);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Helper function to format product display
  const formatProductDisplay = (product) => {
    let display = product.product_name;
    
    // Add brand in parentheses if present
    if (product.brand) {
      display += ` (${product.brand})`;
    }
    
    // Add variety and size with comma only if both are present
    const varietyAndSize = [];
    if (product.variety) {
      varietyAndSize.push(product.variety);
    }
    if (product.size || product.description) { // Handle both old and new field names
      varietyAndSize.push(product.size || product.description);
    }
    
    if (varietyAndSize.length > 0) {
      display += ` - ${varietyAndSize.join(', ')}`;
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
              {renderProductSelection(item, index)}
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
                  : `Click here to set stock for ${inventoryLinkData.productName}${inventoryLinkData.brand ? ` (${inventoryLinkData.brand})` : ''}${(inventoryLinkData.variety || inventoryLinkData.size) ? ` - ${[inventoryLinkData.variety, inventoryLinkData.size].filter(Boolean).join(', ')}` : ''}`
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

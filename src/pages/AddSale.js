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
  Link as MuiLink
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

  // Fetch products when the component is mounted
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await axiosInstance.get('/products');
        setProducts(productsResponse.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchData();
  }, []);

  const handleProductChange = async (e) => {
    setProductDetails(e.target.value);
    setIsProductSelected(true); // Enable visibility of other fields
    // Clear previous selections when product changes
    setSelectedUnitId('');
    setRetailPrice('');
    setShowInventoryLink(false); // Reset inventory link visibility
    
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

        // Filter for selling units only and remove category from display
        const sellingUnits = units.filter(unit => unit.unit_category === 'selling');
        setUnitTypes(sellingUnits.map(unit => ({
          unit_type: unit.unit_type, // Remove (selling) from display
          unit_id: unit.unit_id,
          unit_category: unit.unit_category
        })));
        // Comment out the old code that showed all units with category in parentheses
        // setUnitTypes(units.map(unit => ({
        //   unit_type: `${unit.unit_type} (${unit.unit_category})`,
        //   unit_id: unit.unit_id,
        //   unit_category: unit.unit_category
        // })));
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    }
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
              <FormControl fullWidth required>
                <InputLabel>Select the product sold</InputLabel>
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

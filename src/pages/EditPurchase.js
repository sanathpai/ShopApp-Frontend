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
  Select
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

const EditPurchase = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [selectedUnitType, setSelectedUnitType] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [suppliers, setSuppliers] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateWarning, setDateWarning] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      console.log('🚀 Starting to fetch edit purchase data for ID:', id);
      try {
        console.log('💰 Fetching purchase details for ID:', id);
        const purchaseResponse = await axiosInstance.get(`/purchases/${id}`);
        const purchase = purchaseResponse.data;
        console.log('✅ Purchase details fetched successfully:', purchase);

        // Fetch the specific product for this purchase using product_id
        console.log('🎯 Fetching specific product for product_id:', purchase.product_id);
        const specificProductResponse = await axiosInstance.get(`/products/${purchase.product_id}`);
        const specificProduct = specificProductResponse.data;
        console.log('✅ Specific product fetched successfully:', specificProduct);

        // Format the product details using the actual product data
        const productNameVariety = `${specificProduct.product_name}${specificProduct.variety ? ` - ${specificProduct.variety}` : ''}`;
        console.log('📝 Setting form fields:');
        console.log('   Product Details:', productNameVariety);
        console.log('   Selected Source:', purchase.supplier_name ? `Supplier - ${purchase.supplier_name}` : `Market - ${purchase.market_name}`);
        console.log('   Order Price:', purchase.order_price);
        console.log('   Quantity:', purchase.quantity);
        console.log('   Purchase Date:', purchase.purchase_date.split('T')[0]);
        console.log('   Unit Type:', `${purchase.unit_type}${purchase.unit_category ? ` (${purchase.unit_category})` : ''}`);

        // Set the product details immediately
        setProductDetails(productNameVariety);
        
        setSelectedSource(
          purchase.supplier_name
            ? `Supplier - ${purchase.supplier_name}`
            : `Market - ${purchase.market_name}`
        );
        setOrderPrice(purchase.order_price);
        setQuantity(purchase.quantity);
        setPurchaseDate(purchase.purchase_date.split('T')[0]);

        console.log('🔧 Fetching units for product ID:', purchase.product_id);
        const unitsResponse = await axiosInstance.get(
          `/units/product/${purchase.product_id}`
        );
        console.log('✅ Units fetched successfully:', unitsResponse.data);
        
        // Create consistent unit type format - always include category if available
        const units = unitsResponse.data.map((unit) => ({
          id: unit.unit_id,
          type: unit.unit_category ? `${unit.unit_type} (${unit.unit_category})` : unit.unit_type
        }));
        console.log('🎯 Processed units:', units);
        setUnitTypes(units);

        // Validate if the unit type exists in the fetched units
        console.log('🔍 Unit matching debug:');
        console.log('   Purchase unit_type:', purchase.unit_type);
        console.log('   Purchase unit_category:', purchase.unit_category);
        const expectedUnitType = purchase.unit_category ? 
          `${purchase.unit_type} (${purchase.unit_category})` : 
          purchase.unit_type;
        console.log('   Expected unit type format:', expectedUnitType);
        console.log('   Available units:', units);
        console.log('   Raw units data:', unitsResponse.data);
        
        const unitExists = units.find(unit => {
          // Try exact match first
          const exactMatch = unit.type === expectedUnitType;
          // Also try matching just the unit type part (before any parentheses)
          const unitTypeOnly = unit.type.split(' (')[0];
          const typeOnlyMatch = unitTypeOnly === purchase.unit_type;
          const matches = exactMatch || typeOnlyMatch;
          console.log(`   Checking unit: "${unit.type}" vs expected: "${expectedUnitType}" - exact: ${exactMatch}, type-only: ${typeOnlyMatch}, overall: ${matches}`);
          return matches;
        });
        console.log('   Unit exists?', !!unitExists);

        if (unitExists) {
          setSelectedUnitType(unitExists.type); // Use the actual unit type format from the database
          console.log('✅ Unit type found in current list, using:', unitExists.type);
        } else {
          console.warn('⚠️ Unit type not found in current list:', expectedUnitType);
          setSelectedUnitType(''); // Reset to empty to avoid invalid value
          setSnackbarMessage(`Warning: The unit type "${expectedUnitType}" from this purchase is no longer available. Please select a new unit type.`);
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
        }

        console.log('🏪 Fetching suppliers...');
        const suppliersResponse = await axiosInstance.get('/suppliers');
        const fetchedSuppliers = suppliersResponse.data;
        console.log('✅ Suppliers fetched successfully:', fetchedSuppliers);

        const combinedSources = fetchedSuppliers.map((source) => ({
          name: source.supplier_name
            ? `Supplier - ${source.supplier_name}`
            : `Market - ${source.market_name}`,
          type: source.supplier_name ? 'supplier' : 'market'
        }));
        console.log('🎯 Processed sources:', combinedSources);
        setSources(combinedSources);

        // Only fetch all products when needed (for the dropdown)
        console.log('📦 Fetching all products for dropdown...');
        const productsResponse = await axiosInstance.get('/products');
        console.log('✅ All products fetched successfully for dropdown');
        setProducts(productsResponse.data);

        console.log('🎉 All data loaded successfully, setting loading to false');
        setLoading(false);
        
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        console.error('❌ Error response:', error.response);
        console.error('❌ Error message:', error.message);
        setSnackbarMessage('Error fetching data: ' + (error.response?.data?.error || error.message));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleProductChange = async (e) => {
    const newProductDetails = e.target.value;
    setProductDetails(newProductDetails);

    // Reset unit selection when product changes
    setSelectedUnitType('');
    setUnitTypes([]);

    if (!newProductDetails) {
      return;
    }

    // Handle cases where variety might not exist
    const productParts = newProductDetails.split(' - ');
    const productName = productParts[0];
    const variety = productParts[1] || null; // Handle undefined variety
    
    const product = products.find(
      (product) => {
        const productMatch = product.product_name === productName;
        const varietyMatch = (!variety && !product.variety) || (variety === product.variety);
        return productMatch && varietyMatch;
      }
    );

    if (product) {
      try {
        console.log('🔧 Fetching units for product:', product.product_id);
        const unitsResponse = await axiosInstance.get(
          `/units/product/${product.product_id}`
        );
        
        if (unitsResponse.data && unitsResponse.data.length > 0) {
          // Filter for buying units only and use consistent format
          const buyingUnits = unitsResponse.data.filter(unit => unit.unit_category === 'buying');
          const units = buyingUnits.map((unit) => ({
            id: unit.unit_id,
            type: unit.unit_category ? `${unit.unit_type} (${unit.unit_category})` : unit.unit_type
          }));
          
          setUnitTypes(units);
          console.log('✅ Units loaded successfully:', units);
          
          if (units.length === 0) {
            setSnackbarMessage('No buying units found for this product. Please add units first.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
          }
        } else {
          setSnackbarMessage('No units found for this product. Please add units first.');
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error fetching units:', error);
        setSnackbarMessage('Error fetching units for this product.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } else {
      console.warn('Product not found:', productName, variety);
      setSnackbarMessage('Product not found. Please select a valid product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!productDetails) {
      setSnackbarMessage('Please select a product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!selectedUnitType) {
      setSnackbarMessage('Please select a unit type.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!selectedSource) {
      setSnackbarMessage('Please select a source (supplier or market).');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const selectedSourceDetails = sources.find(
      (source) => source.name === selectedSource
    );
    
    // Handle cases where variety might not exist
    const productParts = productDetails.split(' - ');
    const productName = productParts[0];
    const variety = productParts[1] || null; // Handle undefined variety

    // Validate that product exists
    if (!productName) {
      setSnackbarMessage('Invalid product selection. Please select a valid product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Map selectedUnitType to unit_id
    const selectedUnit = unitTypes.find(
      (unit) => unit.type === selectedUnitType
    );

    if (!selectedUnit) {
      setSnackbarMessage('Please select a valid unit type.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      await axiosInstance.put(`/purchases/${id}`, {
        product_name: productName,
        variety: variety,
        supplier_name:
          selectedSourceDetails?.type === 'supplier'
            ? selectedSourceDetails.name.replace('Supplier - ', '')
            : null,
        market_name:
          selectedSourceDetails?.type === 'market'
            ? selectedSourceDetails.name.replace('Market - ', '')
            : null,
        order_price: orderPrice,
        quantity: quantity,
        purchase_date: purchaseDate,
        unit_id: selectedUnit.id // Send unit_id instead of unit_type
      });
      setSnackbarMessage('Purchase updated successfully!');
      setSnackbarSeverity('success');
      navigate('/dashboard/purchases/view');
    } catch (error) {
      console.error('Error updating purchase:', error);
      setSnackbarMessage('Error updating purchase');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const getOrderPriceLabel = () => {
    return selectedUnitType
      ? `Order Price (per ${selectedUnitType})`
      : 'Order Price per unit';
  };

  const checkFutureDate = (date) => {
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      setDateWarning('Warning: You are entering a future date for this purchase.');
    } else {
      setDateWarning('');
    }
  };

  return (
    <Container maxWidth="md">
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Edit Purchase
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!loading && (
                <>
                  <FormControl fullWidth required>
                    <InputLabel>Product Name</InputLabel>
                    <Select
                      value={productDetails}
                      onChange={handleProductChange}
                      disabled={loading}
                    >
                      {products.map((product) => {
                        const productDisplay = `${product.product_name}${product.variety ? ` - ${product.variety}` : ''}`;
                        return (
                          <MenuItem
                            key={product.product_id}
                            value={productDisplay}
                          >
                            {productDisplay}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required>
                    <InputLabel>Unit Type</InputLabel>
                    <Select
                      value={selectedUnitType}
                      onChange={(e) => setSelectedUnitType(e.target.value)}
                      disabled={loading || unitTypes.length === 0}
                    >
                      {unitTypes.map((unit) => (
                        <MenuItem key={unit.id} value={unit.type}>
                          {unit.type}
                        </MenuItem>
                      ))}
                    </Select>
                    {unitTypes.length === 0 && productDetails && (
                      <Typography variant="caption" color="warning.main" sx={{ mt: 1 }}>
                        No units available for this product. Please add units first.
                      </Typography>
                    )}
                  </FormControl>
                  <FormControl fullWidth required>
                    <InputLabel>Purchased From</InputLabel>
                    <Select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      disabled={loading}
                    >
                      {sources.map((source) => (
                        <MenuItem key={source.name} value={source.name}>
                          {source.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label={getOrderPriceLabel()}
                    variant="outlined"
                    fullWidth
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    required
                    type="number"
                    disabled={loading}
                  />
                  <TextField
                    label="Quantity"
                    variant="outlined"
                    fullWidth
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    type="number"
                    disabled={loading}
                  />
                  <TextField
                    label="Purchase Date"
                    variant="outlined"
                    fullWidth
                    value={purchaseDate}
                    onChange={(e) => {
                      setPurchaseDate(e.target.value);
                      checkFutureDate(e.target.value);
                    }}
                    required
                    type="date"
                    InputLabelProps={{
                      shrink: true
                    }}
                    disabled={loading}
                  />
                  {dateWarning && (
                    <Typography color="warning.main" variant="body2">
                      {dateWarning}
                    </Typography>
                  )}
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={loading || !productDetails || !selectedUnitType || !selectedSource}
                  >
                    Update Purchase
                  </Button>
                </>
              )}
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Typography>Loading purchase data...</Typography>
                </Box>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditPurchase;

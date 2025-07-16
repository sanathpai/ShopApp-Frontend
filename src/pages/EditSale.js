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

const EditSale = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [retailPrice, setRetailPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [loading, setLoading] = useState(true);
  const [isProductSelected, setIsProductSelected] = useState(false);
  const [dateWarning, setDateWarning] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      console.log('🚀 Starting to fetch edit sale data for ID:', id);
      try {
        console.log('💰 Fetching sale details for ID:', id);
        const saleResponse = await axiosInstance.get(`/sales/${id}`);
        const sale = saleResponse.data;
        console.log('✅ Sale details fetched successfully:', sale);

        // Fetch the specific product for this sale using product_id
        console.log('🎯 Fetching specific product for product_id:', sale.product_id);
        const specificProductResponse = await axiosInstance.get(`/products/${sale.product_id}`);
        const specificProduct = specificProductResponse.data;
        console.log('✅ Specific product fetched successfully:', specificProduct);

        // Format product details for display using the actual product data
        let productDetailsDisplay = specificProduct.product_name;
        if (specificProduct.variety) {
          productDetailsDisplay += ` - ${specificProduct.variety}`;
        }
        if (specificProduct.brand) {
          productDetailsDisplay += ` (${specificProduct.brand})`;
        }
        console.log('✅ Using actual product format:', productDetailsDisplay);
        
        console.log('📝 Setting form fields:');
        console.log('   Product Details:', productDetailsDisplay);
        console.log('   Retail Price:', sale.retail_price);
        console.log('   Quantity:', sale.quantity);
        console.log('   Sale Date:', sale.sale_date.split('T')[0]);
        console.log('   Unit ID:', sale.unit_id);
        
        setProductDetails(productDetailsDisplay);
        setRetailPrice(sale.retail_price);
        setQuantity(sale.quantity);
        setSaleDate(sale.sale_date.split('T')[0]);
        
        // Fetch units for the specific product
        console.log('🔧 Fetching units for product ID:', sale.product_id);
        const unitsResponse = await axiosInstance.get(
          `/units/product/${sale.product_id}`
        );
        console.log('✅ Units fetched successfully:', unitsResponse.data);
        
        // Add debugging for unit matching
        console.log('🔍 Unit matching debug:');
        console.log('   Looking for unit_id:', sale.unit_id);
        console.log('   Available units:', unitsResponse.data);
        
        // Filter for selling units only and remove category from display
        const sellingUnits = unitsResponse.data.filter(unit => unit.unit_category === 'selling');
        const units = sellingUnits.map((unit) => ({
          unit_type: unit.unit_type, // Remove (selling) from display
          unit_id: unit.unit_id,
          unit_category: unit.unit_category
        }));
        console.log('🎯 Processed selling units:', units);
        
        // Check if the sale's unit_id exists in available units
        const unitExists = units.find(unit => unit.unit_id === sale.unit_id);
        console.log('   Unit exists?', !!unitExists);
        
        if (unitExists) {
          setSelectedUnitId(sale.unit_id);
          console.log('✅ Unit found in current list:', unitExists);
        } else {
          console.warn('⚠️ Unit not found in current list for unit_id:', sale.unit_id);
          setSelectedUnitId(''); // Reset to empty to avoid invalid value
          setSnackbarMessage(`Warning: The unit type from this sale is no longer available. Please select a new unit type.`);
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
        }
        
        setUnitTypes(units);

        // Only fetch all products when needed (for the dropdown)
        console.log('📦 Fetching all products for dropdown...');
        const productsResponse = await axiosInstance.get('/products');
        console.log('✅ All products fetched successfully for dropdown');
        setProducts(productsResponse.data);

        setIsProductSelected(true); // Enable other fields
        console.log('🎉 All data loaded successfully, setting loading to false');
        setLoading(false);
        
      } catch (error) {
        console.error('❌ Error fetching sale details:', error);
        console.error('❌ Error response:', error.response);
        console.error('❌ Error message:', error.message);
        setSnackbarMessage('Error fetching sale details: ' + (error.response?.data?.error || error.message));
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
    setSelectedUnitId('');
    setUnitTypes([]);

    if (!newProductDetails) {
      return;
    }

    // Parse the product details format: "ProductName - Variety (Brand)" or "ProductName - Variety" or "ProductName (Brand)" or "ProductName"
    let productName, variety, brand;
    
    if (newProductDetails.includes('(') && newProductDetails.includes(')')) {
      // Has brand
      const brandMatch = newProductDetails.match(/\(([^)]+)\)$/);
      brand = brandMatch ? brandMatch[1] : '';
      const withoutBrand = newProductDetails.replace(/\s*\([^)]+\)$/, '');
      
      if (withoutBrand.includes(' - ')) {
        const parts = withoutBrand.split(' - ');
        productName = parts[0];
        variety = parts[1] || null;
      } else {
        productName = withoutBrand;
        variety = null;
      }
    } else if (newProductDetails.includes(' - ')) {
      // Has variety but no brand
      const parts = newProductDetails.split(' - ');
      productName = parts[0];
      variety = parts[1] || null;
      brand = null;
    } else {
      // Just product name
      productName = newProductDetails;
      variety = null;
      brand = null;
    }

    const product = products.find(product => {
      const productMatch = product.product_name === productName;
      // More flexible variety matching
      const varietyMatch = (!variety && !product.variety) || 
                          (variety === product.variety) ||
                          (!variety && product.variety) || 
                          (variety && !product.variety);
      // More flexible brand matching  
      const brandMatch = (!brand && !product.brand) || 
                        (brand === product.brand) ||
                        (!brand && product.brand) || 
                        (brand && !product.brand);
      return productMatch && varietyMatch && brandMatch;
    });

    if (product) {
      try {
        console.log('🔧 Fetching units for product change:', product.product_id);
        const unitsResponse = await axiosInstance.get(
          `/units/product/${product.product_id}`
        );
        
        if (unitsResponse.data && unitsResponse.data.length > 0) {
          // Filter for selling units only
          const sellingUnits = unitsResponse.data.filter(unit => unit.unit_category === 'selling');
          const units = sellingUnits.map((unit) => ({
            unit_type: unit.unit_type,
            unit_id: unit.unit_id,
            unit_category: unit.unit_category
          }));
          
          setUnitTypes(units);
          console.log('✅ Units loaded successfully for product change:', units);
          
          if (units.length === 0) {
            setSnackbarMessage('No selling units found for this product. Please add units first.');
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
      console.warn('Product not found:', productName, variety, brand);
      setSnackbarMessage('Product not found. Please select a valid product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!productDetails) {
      setSnackbarMessage('Please select a product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!selectedUnitId) {
      setSnackbarMessage('Please select a unit type.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Parse the product details format: "ProductName - Variety (Brand)" or "ProductName - Variety" or "ProductName (Brand)" or "ProductName"
    let productName, variety, brand;
    
    if (productDetails.includes('(') && productDetails.includes(')')) {
      // Has brand
      const brandMatch = productDetails.match(/\(([^)]+)\)$/);
      brand = brandMatch ? brandMatch[1] : '';
      const withoutBrand = productDetails.replace(/\s*\([^)]+\)$/, '');
      
      if (withoutBrand.includes(' - ')) {
        const parts = withoutBrand.split(' - ');
        productName = parts[0];
        variety = parts[1] || null;
      } else {
        productName = withoutBrand;
        variety = null;
      }
    } else if (productDetails.includes(' - ')) {
      // Has variety but no brand
      const parts = productDetails.split(' - ');
      productName = parts[0];
      variety = parts[1] || null;
      brand = null;
    } else {
      // Just product name
      productName = productDetails;
      variety = null;
      brand = null;
    }

    // Validate that product exists
    if (!productName) {
      setSnackbarMessage('Invalid product selection. Please select a valid product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const selectedUnit = unitTypes.find(
      (unit) => unit.unit_id === selectedUnitId
    );

    if (!selectedUnit) {
      setSnackbarMessage('Please select a valid unit type.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      await axiosInstance.put(`/sales/${id}`, {
        product_name: productName,
        variety: variety || '', // Ensure variety is never undefined
        brand: brand || '', // Include brand information
        retail_price: retailPrice,
        quantity: quantity,
        sale_date: saleDate,
        unit_id: selectedUnitId, // Use the unit_id
        unit_category: selectedUnit.unit_category // Include the unit_category
      });
      setSnackbarMessage('Sale updated successfully!');
      setSnackbarSeverity('success');
      navigate('/dashboard/sales/view');
    } catch (error) {
      console.error('Error updating sale:', error);
      setSnackbarMessage('Error updating sale');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const getSalePriceLabel = () => {
    const selectedUnit = unitTypes.find(unit => unit.unit_id === selectedUnitId);
    return selectedUnit
      ? `Retail Price (per ${selectedUnit.unit_type})`
      : 'Retail Price per unit';
  };

  const checkFutureDate = (date) => {
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      setDateWarning('Warning: You are entering a future date for this sale.');
    } else {
      setDateWarning('');
    }
  };

  return (
    <Container maxWidth="md">
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Edit Sale
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!loading && (
                <>
                  <FormControl fullWidth required>
                    <InputLabel>Select the product sold</InputLabel>
                    <Select
                      value={productDetails}
                      onChange={handleProductChange}
                    >
                      {products.map((product) => (
                        <MenuItem
                          key={product.product_id}
                          value={formatProductDisplay(product)}
                        >
                          {formatProductDisplay(product)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required>
                    <InputLabel>Unit Type (Category)</InputLabel>
                    <Select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                    >
                      {unitTypes.map((unit) => (
                        <MenuItem key={unit.unit_id} value={unit.unit_id}>
                          {unit.unit_type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label={getSalePriceLabel()}
                    variant="outlined"
                    fullWidth
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    required
                    type="number"
                  />
                  <TextField
                    label="Quantity"
                    variant="outlined"
                    fullWidth
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    type="number"
                  />
                  <TextField
                    label="Sale Date"
                    variant="outlined"
                    fullWidth
                    value={saleDate}
                    onChange={(e) => {
                      setSaleDate(e.target.value);
                      checkFutureDate(e.target.value);
                    }}
                    required
                    type="date"
                    InputLabelProps={{
                      shrink: true
                    }}
                  />
                  {dateWarning && (
                    <Typography color="warning.main" variant="body2">
                      {dateWarning}
                    </Typography>
                  )}
                  <Button type="submit" variant="contained" color="primary">
                    Update Sale
                  </Button>
                </>
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

export default EditSale;

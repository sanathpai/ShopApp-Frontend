import React, { useState, useEffect } from 'react';
import axiosInstance from '../AxiosInstance'; // Use the Axios instance
import { TextField, Button, MenuItem, Select, FormControl, InputLabel, Container, Snackbar, Card, CardContent, Typography, Box } from '@mui/material';
import MuiAlert from '@mui/material/Alert';

const AddProductOffering = () => {
  const [shopName, setShopName] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [unitId, setUnitId] = useState('');
  const [price, setPrice] = useState('');
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shopsResponse = await axiosInstance.get('/shops');
        setShops(shopsResponse.data);
      } catch (error) {
        console.error('Error fetching shops:', error);
        setErrorMessage('Failed to fetch shops.');
      }
      
      try {
        const productsResponse = await axiosInstance.get('/products');
        setProducts(productsResponse.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setErrorMessage('Failed to fetch products.');
      }
    };
    fetchData();
  }, []);

  const handleProductChange = async (event) => {
    const productDetails = event.target.value;
    setProductDetails(productDetails);

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

    const product = products.find((product) => 
      product.product_name === productName && 
      (product.variety || '') === variety &&
      (product.brand || '') === brand
    );
    
    if (product) {
      try {
        const unitsResponse = await axiosInstance.get(`/units/product/${product.product_id}`);
        const unit = unitsResponse.data[0]; // Assuming each product has at least one unit
        if (unit) {
          setUnitId(unit.unit_id);
        } else {
          setUnitId(''); // Clear unit ID if no units found
          setErrorMessage('No unit found for this product.');
        }
      } catch (error) {
        console.error('Error fetching units:', error);
        setErrorMessage('Failed to fetch unit for the selected product.');
      }
    } else {
      setErrorMessage('Product not found.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Parse the product details to get individual fields
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

    try {
      const response = await axiosInstance.post('/productOfferings', {
        shop_name: shopName,
        product_name: productName,
        variety: variety || null,
        brand: brand || null,
        unit_id: unitId,
        price: price,
      });
      setSuccessMessage('Product offering added successfully.');
      setShopName('');
      setProductDetails('');
      setUnitId('');
      setPrice('');
    } catch (error) {
      console.error('Error adding product offering:', error);
      setErrorMessage('Failed to add product offering.');
    }
  };

  const handleSnackbarClose = () => {
    setSuccessMessage('');
    setErrorMessage('');
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
    <Container>
      <Card sx={{ mt: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Add Product Offering
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Shop Name</InputLabel>
                <Select value={shopName} onChange={(e) => setShopName(e.target.value)}>
                  {shops.map((shop) => (
                    <MenuItem key={shop.shop_id} value={shop.shop_name}>
                      {shop.shop_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Product Name</InputLabel>
                <Select value={productDetails} onChange={handleProductChange}>
                  {products.map((product) => (
                    <MenuItem key={product.product_id} value={formatProductDisplay(product)}>
                      {formatProductDisplay(product)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                fullWidth
                required
              />
              <Button type="submit" variant="contained" color="primary">
                Add Product Offering
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
      <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert onClose={handleSnackbarClose} severity="success" elevation={6} variant="filled">
          {successMessage}
        </MuiAlert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert onClose={handleSnackbarClose} severity="error" elevation={6} variant="filled">
          {errorMessage}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default AddProductOffering;

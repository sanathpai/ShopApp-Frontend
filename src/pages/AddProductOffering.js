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

    const [productName, variety] = productDetails.split(' - ');
    const product = products.find((product) => product.product_name === productName && product.variety === variety);
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
    const [productName, variety] = productDetails.split(' - ');
    try {
      const response = await axiosInstance.post('/productOfferings', {
        shop_name: shopName,
        product_name: productName,
        variety: variety,
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
                    <MenuItem key={product.product_id} value={`${product.product_name} - ${product.variety}`}>
                      {`${product.product_name} - ${product.variety}`}
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

import React, { useState, useEffect } from 'react';
import axiosInstance from '../AxiosInstance';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, MenuItem, Select, FormControl, InputLabel, Container, Snackbar, Card, CardContent, Typography, Box } from '@mui/material';
import MuiAlert from '@mui/material/Alert';

const EditProductOffering = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shopName, setShopName] = useState('');
  const [productName, setProductName] = useState('');
  const [unitId, setUnitId] = useState('');
  const [price, setPrice] = useState('');
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offeringsResponse, shopsResponse, productsResponse] = await Promise.all([
          axiosInstance.get(`/productOfferings/${id}`),
          axiosInstance.get('/shops'),
          axiosInstance.get('/products'),
        ]);

        const offering = offeringsResponse.data;
        setShopName(offering.shop_name);
        setProductName(offering.product_name);
        setUnitId(offering.unit_id);
        setPrice(offering.price);

        setShops(shopsResponse.data);
        setProducts(productsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to fetch data.');
      }
    };
    fetchData();
  }, [id]);

  const handleProductChange = async (event) => {
    const selectedProductName = event.target.value;
    setProductName(selectedProductName);

    const selectedProduct = products.find((product) => product.product_name === selectedProductName);
    if (selectedProduct) {
      try {
        const unitsResponse = await axiosInstance.get(`/units/product/${selectedProduct.product_id}`);
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
    try {
      await axiosInstance.put(`/productOfferings/${id}`, {
        shop_name: shopName,
        product_name: productName,
        unit_id: unitId,
        price: price,
      });
      setSuccessMessage('Product offering updated successfully.');
      navigate('/dashboard/productOfferings/view');
    } catch (error) {
      console.error('Error updating product offering:', error);
      setErrorMessage('Failed to update product offering.');
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
            Edit Product Offering
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
                <Select value={productName} onChange={handleProductChange}>
                  {products.map((product) => (
                    <MenuItem key={product.product_id} value={product.product_name}>
                      {product.product_name}
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
                Update Product Offering
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

export default EditProductOffering;

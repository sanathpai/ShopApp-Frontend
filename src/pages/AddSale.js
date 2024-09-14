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
    const [productName, variety] = e.target.value.split(' - ');
    const product = products.find(product => product.product_name === productName && product.variety === variety);

    if (product) {
      try {
        const unitsResponse = await axiosInstance.get(`/units/product/${product.product_id}`);
        const units = unitsResponse.data;

        // Now we map unit IDs instead of unit types
        setUnitTypes(units.map(unit => ({
          unit_type: unit.unit_type,
          unit_id: unit.unit_id
        })));
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const [productName, variety] = productDetails.split(' - ');

    try {
      await axiosInstance.post('/sales', {
        product_name: productName,
        variety: variety,
        retail_price: retailPrice,
        quantity: quantity,
        sale_date: saleDate,
        unit_id: selectedUnitId  // Changed to use unit_id instead of unit_type
      });
      setSnackbarMessage('Sale added successfully!');
      setSnackbarSeverity('success');
      setRetailPrice('');
      setQuantity('');
      setSaleDate(new Date().toISOString().split('T')[0]); // Reset to today's date
      setSelectedUnitId('');
      setProductDetails('');
    } catch (error) {
      console.error('Error adding sale:', error);
      setSnackbarMessage('Error adding sale');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md">
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Add Sale
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              <FormControl fullWidth required>
                <InputLabel>Unit Type</InputLabel>
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
                label="Retail Price per unit"
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
                onChange={(e) => setSaleDate(e.target.value)}
                required
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Button type="submit" variant="contained" color="primary">
                Add Sale
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddSale;

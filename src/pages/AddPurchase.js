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

const AddPurchase = () => {
  const [products, setProducts] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUnitType, setSelectedUnitType] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [suppliers, setSuppliers] = useState([]);

  const staticMarkets = ['Market A', 'Market B', 'Market C', 'Market D', 'Market E'];
  const sources = [...staticMarkets.map(market => ({ name: market, type: 'market' })), ...suppliers.map(supplier => ({ name: supplier.name, type: 'supplier' }))];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await axiosInstance.get('/products');
        setProducts(productsResponse.data);

        const suppliersResponse = await axiosInstance.get('/suppliers'); // Adjust the endpoint as needed
        setSuppliers(suppliersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
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

        const combinedUnits = [...new Set(units.flatMap(unit => [unit.buying_unit_type, unit.selling_unit_type]))];
        setUnitTypes(combinedUnits);
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedSourceDetails = sources.find(source => source.name === selectedSource);
    const [productName, variety] = productDetails.split(' - ');

    try {
      await axiosInstance.post('/purchases', {
        product_name: productName,
        variety: variety,
        supplier_name: selectedSourceDetails && selectedSourceDetails.type === 'supplier' ? selectedSourceDetails.name : null,
        market_name: selectedSourceDetails && selectedSourceDetails.type === 'market' ? selectedSourceDetails.name : null,
        order_price: orderPrice,
        quantity: quantity,
        purchase_date: purchaseDate,
        unit_type: selectedUnitType
      });
      setSnackbarMessage('Purchase added successfully!');
      setSnackbarSeverity('success');
      setSelectedSource('');
      setOrderPrice('');
      setQuantity('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setSelectedUnitType('');
      setProductDetails('');
    } catch (error) {
      console.error('Error adding purchase:', error);
      if (error.response && error.response.data.error === 'Inventory not found. Please add the item to inventory first.') {
        setSnackbarMessage('Inventory not found. Please add the item to inventory first.');
      } else {
        setSnackbarMessage('Error adding purchase');
      }
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
            Add Purchase
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Select the product purchased</InputLabel>
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
                <Select value={selectedUnitType} onChange={(e) => setSelectedUnitType(e.target.value)}>
                  {unitTypes.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Purchased From</InputLabel>
                <Select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
                  {sources.map((source) => (
                    <MenuItem key={source.name} value={source.name}>
                      {source.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Order Price"
                variant="outlined"
                fullWidth
                value={orderPrice}
                onChange={(e) => setOrderPrice(e.target.value)}
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
                label="Purchase Date"
                variant="outlined"
                fullWidth
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Button type="submit" variant="contained" color="primary">
                Add Purchase
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

export default AddPurchase;

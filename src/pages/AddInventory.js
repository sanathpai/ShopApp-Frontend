import React, { useState, useEffect } from 'react';
import axiosInstance from '../AxiosInstance';
import { 
  Container, 
  TextField, 
  Button, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Snackbar, 
  Card, 
  CardContent, 
  Typography, 
  Box 
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';

const AddInventory = () => {
  const [productDetails, setProductDetails] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [stockLimit, setStockLimit] = useState(''); // New state for stock limit
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]); 
  const [unitId, setUnitId] = useState(''); 
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

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
        const fetchedUnits = unitsResponse.data;
        setUnits(fetchedUnits);
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const [productName, variety] = productDetails.split(' - ');
    try {
      await axiosInstance.post('/inventories', {
        product_name: productName,
        variety: variety,
        current_stock: currentStock,
        stock_limit: stockLimit, // Send the stock limit to the backend
        unit_id: unitId 
      });
      setSnackbarMessage('Inventory added successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setProductDetails('');
      setCurrentStock('');
      setStockLimit(''); // Reset stock limit
      setUnitId('');
    } catch (error) {
      console.error('Error adding inventory:', error);
      setSnackbarMessage('Error adding inventory');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Add Inventory
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
                <InputLabel>Unit</InputLabel>
                <Select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                  {units.map((unit) => (
                    <MenuItem key={unit.unit_id} value={unit.unit_id}>
                      {unit.unit_type} ({unit.unit_category}) 
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Current Stock"
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                fullWidth
                required
              />

              {/* New field to set the stock limit */}
              <TextField
                label="Enter the minimum threshold value"
                type="number"
                value={stockLimit}
                onChange={(e) => setStockLimit(e.target.value)}
                fullWidth
                required
              />

              <Button type="submit" variant="contained" color="primary">
                Add Inventory
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <MuiAlert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default AddInventory;

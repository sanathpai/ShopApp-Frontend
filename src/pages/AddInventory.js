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
import { useLocation, useNavigate } from 'react-router-dom';

const AddInventory = () => {
  const [currentStock, setCurrentStock] = useState('');
  const [stockLimit, setStockLimit] = useState(''); // New state for stock limit
  const [units, setUnits] = useState([]); 
  const [unitId, setUnitId] = useState(''); 
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [productInfo, setProductInfo] = useState({ id: '', name: '', variety: '' });

  const location = useLocation();
  const navigate = useNavigate();

  // Auto-calculate threshold when current stock changes
  useEffect(() => {
    if (currentStock && !isNaN(currentStock) && parseFloat(currentStock) > 0) {
      const calculatedThreshold = Math.min(parseFloat(currentStock) * 0.1, 1);
      setStockLimit(calculatedThreshold.toString());
    }
  }, [currentStock]);

  useEffect(() => {
    // Get product information from URL parameters
    const queryParams = new URLSearchParams(location.search);
    const productId = queryParams.get('product_id');
    const productName = queryParams.get('product_name');
    const variety = queryParams.get('variety');

    if (productId && productName) {
      setProductInfo({
        id: productId,
        name: decodeURIComponent(productName),
        variety: variety ? decodeURIComponent(variety) : ''
      });

      // Fetch units for this specific product
      const fetchUnits = async () => {
        try {
          const unitsResponse = await axiosInstance.get(`/units/product/${productId}`);
          const fetchedUnits = unitsResponse.data;
          setUnits(fetchedUnits);
        } catch (error) {
          console.error('Error fetching units:', error);
          setSnackbarMessage('Error fetching units for this product');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      };

      fetchUnits();
    } else {
      // If no product info in URL, redirect back to add product
      navigate('/dashboard/products/add');
    }
  }, [location, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!unitId || !currentStock || !stockLimit) {
      setSnackbarMessage('Please fill in all required fields');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Validate numeric fields
    if (isNaN(parseFloat(currentStock)) || parseFloat(currentStock) <= 0) {
      setSnackbarMessage('Current stock must be a valid positive number');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (isNaN(parseFloat(stockLimit)) || parseFloat(stockLimit) < 0) {
      setSnackbarMessage('Stock limit must be a valid number');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (isNaN(parseInt(unitId))) {
      setSnackbarMessage('Please select a valid unit');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const inventoryData = {
        product_name: productInfo.name,
        variety: productInfo.variety || '',
        current_stock: parseFloat(currentStock),
        stock_limit: parseFloat(stockLimit),
        unit_id: parseInt(unitId)
      };
      
      console.log('Sending inventory data:', inventoryData);
      
      await axiosInstance.post('/inventories', inventoryData);
      
      setSnackbarMessage('Current stock entered successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // After successful submission, navigate back to Add Product after a delay
      setTimeout(() => {
        navigate('/dashboard/products/add');
      }, 2000);
      
    } catch (error) {
      console.error('Error adding inventory:', error);
      
      // Get specific error message from backend
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error entering current stock';
      
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const getProductDisplayName = () => {
    if (productInfo.variety) {
      return `${productInfo.name} - ${productInfo.variety}`;
    }
    return productInfo.name;
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Enter Current Stock of {getProductDisplayName()}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Product info display - read only */}
              <TextField
                label="Product"
                value={getProductDisplayName()}
                fullWidth
                disabled
                variant="filled"
              />

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

              <TextField
                label={`You will be warned that the stock of ${getProductDisplayName()} is low if it falls below`}
                type="number"
                value={stockLimit}
                onChange={(e) => setStockLimit(e.target.value)}
                fullWidth
                required
                InputLabelProps={{
                  style: {
                    whiteSpace: 'normal',
                    fontSize: '0.875rem',
                  },
                }}
              />

              <Button type="submit" variant="contained" color="primary">
                DONE
              </Button>
              
              <Button 
                onClick={() => navigate('/dashboard/products/add')} 
                variant="outlined" 
                color="secondary"
              >
                Back to Add Product
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

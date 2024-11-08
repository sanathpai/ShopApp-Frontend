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
  const [isProductSelected, setIsProductSelected] = useState(false); // To control the visibility

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await axiosInstance.get('/products');
        setProducts(productsResponse.data);

        const suppliersResponse = await axiosInstance.get('/suppliers'); // Fetches both markets and suppliers
        setSuppliers(suppliersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleProductChange = async (e) => {
    setProductDetails(e.target.value);
    setIsProductSelected(true); // Enable visibility of other fields
    const [productName, variety] = e.target.value.split(' - ');
    const product = products.find(product => product.product_name === productName && product.variety === variety);

    if (product) {
      try {
        const unitsResponse = await axiosInstance.get(`/units/product/${product.product_id}`);
        const units = unitsResponse.data;

        // Set the unitTypes with both type and category together
        setUnitTypes(units.map(unit => ({
          id: unit.unit_id,
          type: `${unit.unit_type} (${unit.unit_category})`,
          unitCategory: unit.unit_category,
        })));
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedSourceDetails = suppliers.find(
      (supplier) => supplier.market_name === selectedSource || supplier.name === selectedSource
    );
    const [productName, variety] = productDetails.split(' - ');
    
    // Fetch the unit id corresponding to the selected unit type
    const selectedUnit = unitTypes.find(unit => unit.type === selectedUnitType);

    try {
      await axiosInstance.post('/purchases', {
        product_name: productName,
        variety: variety,
        supplier_name: selectedSourceDetails && selectedSourceDetails.name ? selectedSourceDetails.name : null,
        market_name: selectedSourceDetails && selectedSourceDetails.market_name ? selectedSourceDetails.market_name : null,
        order_price: orderPrice,
        quantity: quantity,
        purchase_date: purchaseDate,
        unit_id: selectedUnit.id, // Send the unit id, not the type
        unit_category: selectedUnit.unitCategory // Include the unit category in your payload
      });
      setSnackbarMessage('Purchase added successfully!');
      setSnackbarSeverity('success');
      setSelectedSource('');
      setOrderPrice('');
      setQuantity('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setSelectedUnitType('');
      setProductDetails('');
      setIsProductSelected(false); // Reset product selection
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

              {/* Show other fields only after a product is selected */}
              {isProductSelected && (
                <>
                  <FormControl fullWidth required>
                    <InputLabel>Unit Type (Category)</InputLabel>
                    <Select value={selectedUnitType} onChange={(e) => setSelectedUnitType(e.target.value)}>
                      {unitTypes.map((unit) => (
                        <MenuItem key={unit.id} value={unit.type}>
                          {unit.type} {/* Display both unit type and category together */}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth required>
                    <InputLabel>Purchased From</InputLabel>
                    <Select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
                      {suppliers.map((supplier) => (
                        <MenuItem key={supplier.market_name || supplier.name} value={supplier.market_name || supplier.name}>
                          {supplier.name ? `Supplier - ${supplier.name}` : `Market - ${supplier.market_name}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Total Order Price"
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
                </>
              )}
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

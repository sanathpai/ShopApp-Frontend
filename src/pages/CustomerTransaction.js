import React, { useState, useEffect } from 'react';
import {
  Container,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ClearIcon from '@mui/icons-material/Clear';
import axiosInstance from '../AxiosInstance';

const CustomerTransaction = () => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([
    { product: '', unitTypes: [], unitType: '', price: '', quantity: '', total: 0 },
  ]);
  const [grandTotal, setGrandTotal] = useState(0);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get('/products'); // API to fetch products
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  const handleProductChange = async (index, productId) => {
    const updatedItems = [...items];
    const selectedProduct = products.find((product) => product.product_id === productId);

    updatedItems[index].product = productId;
    updatedItems[index].price = selectedProduct?.price || '';
    updatedItems[index].unitType = '';
    updatedItems[index].unitTypes = [];

    if (selectedProduct) {
      try {
        const unitsResponse = await axiosInstance.get(`/units/product/${productId}`);
        const units = unitsResponse.data;
        updatedItems[index].unitTypes = units.map((unit) => ({
          id: unit.unit_id,
          type: `${unit.unit_type} (${unit.unit_category})`,
        }));
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    }
    setItems(updatedItems);
  };

  const handleInputChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;

    if (field === 'price' || field === 'quantity') {
      const price = parseFloat(updatedItems[index].price || 0);
      const quantity = parseFloat(updatedItems[index].quantity || 0);
      updatedItems[index].total = price * quantity;
    }
    setItems(updatedItems);

    const totalSum = updatedItems.reduce((sum, item) => sum + item.total, 0);
    setGrandTotal(totalSum);
  };

  const handleAddItem = () => {
    setItems([...items, { product: '', unitTypes: [], unitType: '', price: '', quantity: '', total: 0 }]);
  };

  const handleReset = () => {
    setItems([{ product: '', unitTypes: [], unitType: '', price: '', quantity: '', total: 0 }]);
    setGrandTotal(0);
  };

  return (
    <Container maxWidth="lg" sx={{ paddingY: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Customer Transaction
      </Typography>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 2 }}>
        {items.map((item, index) => (
          <Grid
            container
            spacing={2}
            key={index}
            sx={{
              marginBottom: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'space-between' },
            }}
          >
            <Grid item xs={12} sm={5} md={3}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  value={item.product}
                  onChange={(e) => handleProductChange(index, e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {products.map((product) => (
                    <MenuItem key={product.product_id} value={product.product_id}>
                      {`${product.product_name} - ${product.variety}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={item.unitType}
                  onChange={(e) => handleInputChange(index, 'unitType', e.target.value)}
                  disabled={!item.unitTypes.length}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {item.unitTypes.map((unit) => (
                    <MenuItem key={unit.id} value={unit.type}>
                      {unit.type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <TextField
                label="Price per unit"
                variant="outlined"
                type="number"
                fullWidth
                value={item.price}
                onChange={(e) => handleInputChange(index, 'price', e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <TextField
                label="Quantity"
                variant="outlined"
                type="number"
                fullWidth
                value={item.quantity}
                onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={2} md={1}>
              <Typography
                variant="body1"
                align="center"
                sx={{
                  fontWeight: 'bold',
                  marginTop: { xs: 1, sm: 0 },
                }}
              >
                {item.total.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        ))}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddCircleIcon />}
              onClick={handleAddItem}
              fullWidth
              sx={{ paddingY: 1.5 }}
            >
              Add Item
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="error"
              startIcon={<ClearIcon />}
              onClick={handleReset}
              fullWidth
              sx={{ paddingY: 1.5 }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
        <Typography
          variant="h5"
          align="right"
          sx={{
            marginTop: 4,
            fontWeight: 'bold',
          }}
        >
          Grand Total (ZMW): {grandTotal.toFixed(2)}
        </Typography>
      </Paper>
    </Container>
  );
};

export default CustomerTransaction;

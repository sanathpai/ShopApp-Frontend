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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await axiosInstance.get('/products');
        setProducts(productsResponse.data);

        const saleResponse = await axiosInstance.get(`/sales/${id}`);
        const sale = saleResponse.data;

        const productNameVariety = `${sale.product_name} - ${sale.variety}`;
        setProductDetails(productNameVariety);
        setRetailPrice(sale.retail_price);
        setQuantity(sale.quantity);
        setSaleDate(sale.sale_date.split('T')[0]);
        setSelectedUnitId(sale.unit_id);

        const product = productsResponse.data.find(
          (product) =>
            product.product_name === sale.product_name &&
            product.variety === sale.variety
        );

        if (product) {
          const unitsResponse = await axiosInstance.get(
            `/units/product/${product.product_id}`
          );
          const units = unitsResponse.data.map((unit) => ({
            unit_type: `${unit.unit_type} (${unit.unit_category})`,
            unit_id: unit.unit_id,
            unit_category: unit.unit_category
          }));
          setUnitTypes(units);
        }

        setIsProductSelected(true); // Enable other fields
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sale details:', error);
        setSnackbarMessage('Error fetching sale details');
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

    const [productName, variety] = newProductDetails.split(' - ');
    const product = products.find(
      (product) =>
        product.product_name === productName && product.variety === variety
    );

    if (product) {
      try {
        const unitsResponse = await axiosInstance.get(
          `/units/product/${product.product_id}`
        );
        const units = unitsResponse.data.map((unit) => ({
          unit_type: `${unit.unit_type} (${unit.unit_category})`,
          unit_id: unit.unit_id,
          unit_category: unit.unit_category
        }));
        setUnitTypes(units);
        setSelectedUnitId('');
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const [productName, variety] = productDetails.split(' - ');

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
        variety: variety,
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
                          value={`${product.product_name} - ${product.variety}`}
                        >
                          {`${product.product_name} - ${product.variety}`}
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
                    onChange={(e) => setSaleDate(e.target.value)}
                    required
                    type="date"
                    InputLabelProps={{
                      shrink: true
                    }}
                  />
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

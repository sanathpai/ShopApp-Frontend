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

const EditPurchase = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [selectedUnitType, setSelectedUnitType] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [suppliers, setSuppliers] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await axiosInstance.get('/products');
        setProducts(productsResponse.data);

        const suppliersResponse = await axiosInstance.get('/suppliers');
        const fetchedSuppliers = suppliersResponse.data;

        const purchaseResponse = await axiosInstance.get(`/purchases/${id}`);
        const purchase = purchaseResponse.data;

        const productNameVariety = `${purchase.product_name} - ${purchase.variety}`;
        setProductDetails(productNameVariety);
        setSelectedSource(purchase.supplier_name ? `Supplier - ${purchase.supplier_name}` : `Market - ${purchase.market_name}`);
        setOrderPrice(purchase.order_price);
        setQuantity(purchase.quantity);
        setPurchaseDate(purchase.purchase_date.split('T')[0]);
        setSelectedUnitType(purchase.unit_type);

        const unitsResponse = await axiosInstance.get(`/units/product/${purchase.product_id}`);
        setUnitTypes(unitsResponse.data);

        // Combine suppliers and markets (where supplier_name is null, it's a market)
        const combinedSources = fetchedSuppliers.map((source) => ({
          name: source.supplier_name ? `Supplier - ${source.supplier_name}` : `Market - ${source.market_name}`,
          type: source.supplier_name ? 'supplier' : 'market',
        }));

        setSources(combinedSources);
        setLoading(false); // Data is loaded
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbarMessage('Error fetching data');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false); // Data is loaded even if there is an error
      }
    };

    fetchData();
  }, [id]);

  const handleProductChange = async (e) => {
    const newProductDetails = e.target.value;
    setProductDetails(newProductDetails);

    const [productName, variety] = newProductDetails.split(' - ');
    const product = products.find(product => product.product_name === productName && product.variety === variety);

    if (product) {
      try {
        const unitsResponse = await axiosInstance.get(`/units/product/${product.product_id}`);
        setUnitTypes(unitsResponse.data);
        setSelectedUnitType(''); // Reset selected unit type when product changes
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
      await axiosInstance.put(`/purchases/${id}`, {
        product_name: productName,
        variety: variety,
        supplier_name: selectedSourceDetails && selectedSourceDetails.type === 'supplier' ? selectedSourceDetails.name.replace('Supplier - ', '') : null,
        market_name: selectedSourceDetails && selectedSourceDetails.type === 'market' ? selectedSourceDetails.name.replace('Market - ', '') : null,
        order_price: orderPrice,
        quantity: quantity,
        purchase_date: purchaseDate,
        unit_type: selectedUnitType
      });
      setSnackbarMessage('Purchase updated successfully!');
      setSnackbarSeverity('success');
      navigate('/dashboard/purchases/view'); // Redirect to view purchases page after update
    } catch (error) {
      console.error('Error updating purchase:', error);
      setSnackbarMessage('Error updating purchase');
      setSnackbarSeverity('error');
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
            Edit Purchase
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!loading && (
                <>
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
                    <Select value={selectedUnitType} onChange={(e) => setSelectedUnitType(e.target.value)}>
                      {unitTypes.map((unit) => (
                        <MenuItem key={unit.unit_id} value={unit.unit_type}>
                          {unit.unit_type}
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
                    Update Purchase
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

export default EditPurchase;

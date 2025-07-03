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
  Select,
  Modal,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
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
  const [isProductSelected, setIsProductSelected] = useState(false);
  const [dateWarning, setDateWarning] = useState('');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState('');

  // Modal State for Adding a New Source
  const [modalOpen, setModalOpen] = useState(false);
  const [sourceType, setSourceType] = useState('supplier');
  const [supplierName, setSupplierName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await axiosInstance.get('/products');
        setProducts(productsResponse.data);

        const suppliersResponse = await axiosInstance.get('/suppliers');
        setSuppliers(suppliersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleProductChange = async (e) => {
    setProductDetails(e.target.value);
    setIsProductSelected(true);
    setSelectedUnitType('');
    setSelectedUnitId('');
    setOrderPrice('');
    
    const [productName, variety] = e.target.value.split(' - ');
    const product = products.find(product => product.product_name === productName && product.variety === variety);
    setCurrentProduct(product);

    if (product) {
      try {
        const unitsResponse = await axiosInstance.get(`/units/product/${product.product_id}`);
        const units = unitsResponse.data;
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

  const handleUnitTypeChange = async (e) => {
    setSelectedUnitType(e.target.value);
    const selectedUnit = unitTypes.find(unit => unit.type === e.target.value);
    
    if (selectedUnit && currentProduct) {
      setSelectedUnitId(selectedUnit.id);
      
      try {
        console.log(`🔍 Fetching price suggestions for product ${currentProduct.product_id}, unit ${selectedUnit.id}`);
        const response = await axiosInstance.get(`/purchases/price-suggestions/${currentProduct.product_id}/${selectedUnit.id}`);
        
        console.log('📊 Price suggestions response:', response.data);
        console.log('💰 Suggested order price:', response.data.suggested_order_price);
        console.log('🔢 Price type:', typeof response.data.suggested_order_price);
        console.log('✅ Is > 0?', response.data.suggested_order_price > 0);
        console.log('📜 Has price history?', response.data.has_price_history);
        
        // Populate price if there's any price history (even 0.00 can be useful)
        if (response.data.has_price_history) {
          console.log('✅ Has price history, setting order price to:', response.data.suggested_order_price.toString());
          setOrderPrice(response.data.suggested_order_price.toString());
        } else {
          console.log('❌ No price history found, clearing field');
          setOrderPrice('');
        }
      } catch (error) {
        console.error('Error fetching price suggestions:', error);
        setOrderPrice('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedSourceDetails = suppliers.find(
      (supplier) => supplier.market_name === selectedSource || supplier.name === selectedSource
    );
    const [productName, variety] = productDetails.split(' - ');
    const selectedUnit = unitTypes.find(unit => unit.type === selectedUnitType);

    try {
      await axiosInstance.post('/purchases', {
        product_name: productName,
        variety,
        supplier_name: selectedSourceDetails?.name || null,
        market_name: selectedSourceDetails?.market_name || null,
        order_price: orderPrice,
        quantity,
        purchase_date: purchaseDate,
        unit_id: selectedUnit.id,
        unit_category: selectedUnit.unitCategory,
      });
      setSnackbarMessage('Purchase added successfully!');
      setSnackbarSeverity('success');
      setSelectedSource('');
      setOrderPrice('');
      setQuantity('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setSelectedUnitType('');
      setSelectedUnitId('');
      setProductDetails('');
      setIsProductSelected(false);
      setCurrentProduct(null);
    } catch (error) {
      console.error('Error adding purchase:', error);
      setSnackbarMessage('Error adding purchase');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleAddSource = async () => {
    try {
      await axiosInstance.post('/suppliers', {
        source_type: sourceType,
        supplier_name: sourceType === 'supplier' ? supplierName : '',
        market_name: sourceType === 'market' ? supplierName : '',
        contact_info: contactInfo,
        location,
      });
      setSnackbarMessage('Source added successfully!');
      setSnackbarSeverity('success');
      setSupplierName('');
      setContactInfo('');
      setLocation('');
      setModalOpen(false);

      // Refresh suppliers list
      const suppliersResponse = await axiosInstance.get('/suppliers');
      setSuppliers(suppliersResponse.data);
    } catch (error) {
      setSnackbarMessage('Error adding source');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const checkFutureDate = (date) => {
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      setDateWarning('Warning: You are entering a future date for this purchase.');
    } else {
      setDateWarning('');
    }
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

              {isProductSelected && (
                <>
                  <FormControl fullWidth required>
                    <InputLabel>Unit Type (Category)</InputLabel>
                    <Select value={selectedUnitType} onChange={handleUnitTypeChange}>
                      {unitTypes.map((unit) => (
                        <MenuItem key={unit.id} value={unit.type}>
                          {unit.type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* <FormControl fullWidth required>
                    <InputLabel>Purchased From</InputLabel>
                    <Select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
                      {suppliers.map((supplier) => (
                        <MenuItem key={supplier.market_name || supplier.name} value={supplier.market_name || supplier.name}>
                          {supplier.name ? `Supplier - ${supplier.name}` : `Market - ${supplier.market_name}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl> */}
                  {/* <Button onClick={() => setModalOpen(true)} color="secondary">
                    Add Source
                  </Button> */}

                  <TextField
                    label={`Order Price (per ${selectedUnitType || 'unit'}) (K)`}
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
                    onChange={(e) => {
                      setPurchaseDate(e.target.value);
                      checkFutureDate(e.target.value);
                    }}
                    required
                    type="date"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  {dateWarning && (
                    <Typography color="warning.main" variant="body2">
                      {dateWarning}
                    </Typography>
                  )}
                  <Button type="submit" variant="contained" color="primary">
                    Add Purchase
                  </Button>
                </>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Add Source Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Add Source
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <RadioGroup
              row
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
            >
              <FormControlLabel value="supplier" control={<Radio />} label="Supplier" />
              <FormControlLabel value="market" control={<Radio />} label="Market" />
            </RadioGroup>
          </FormControl>
          <TextField
            label={sourceType === 'supplier' ? 'Supplier Name' : 'Market Name'}
            variant="outlined"
            fullWidth
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Phone Number"
            variant="outlined"
            fullWidth
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Location"
            variant="outlined"
            fullWidth
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <Button onClick={handleAddSource} variant="contained" color="primary" fullWidth>
            Add Source
          </Button>
        </Box>
      </Modal>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddPurchase;

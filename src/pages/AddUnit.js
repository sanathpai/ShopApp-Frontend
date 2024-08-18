import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  MenuItem,
  Card,
  CardContent,
  Snackbar,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Switch
} from '@mui/material';
import axiosInstance from '../AxiosInstance';
import { useLocation } from 'react-router-dom';

const AddUnit = () => {
  const [product_id, setProductId] = useState('');
  const [buying_unit_type, setBuyingUnitType] = useState('');
  const [selling_unit_type, setSellingUnitType] = useState('');
  const [prepackaged, setPrepackaged] = useState(false);
  const [prepackaged_b, setPrepackagedB] = useState(false);
  const [products, setProducts] = useState([]);
  const [existingUnits, setExistingUnits] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [newUnitType, setNewUnitType] = useState('');
  const [selectedExistingUnit, setSelectedExistingUnit] = useState('');
  const [conversionRate, setConversionRate] = useState('');
  const [conversionDirection, setConversionDirection] = useState('buying'); // 'buying' or 'selling'
  const [isDefault, setIsDefault] = useState(false);
  
  const location = useLocation();
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const productIdFromParams = queryParams.get('product_id');
    if (productIdFromParams) {
      setProductId(productIdFromParams);
    }
  }, [location]);

  useEffect(() => {
    if (product_id) {
      const fetchUnits = async () => {
        try {
          const response = await axiosInstance.get(`/units/product/${product_id}`);
          setExistingUnits(response.data);
          setIsDefault(response.data.length === 0 || (response.data[0].buying_unit_type === 'default' && response.data[0].selling_unit_type === 'default'));
        } catch (error) {
          console.error('Error fetching units:', error);
        }
      };
      fetchUnits();
    }
  }, [product_id]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isDefault) {
      if (!buying_unit_type || !selling_unit_type || !conversionRate) {
        setSnackbarMessage('Please enter both Buying and Selling Unit Types and Conversion Rate');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
    } else {
      if (!newUnitType || !selectedExistingUnit || !conversionRate) {
        setSnackbarMessage('Please enter the new unit type, select an existing unit, and provide a conversion rate');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
    }

    try {
      const unitData = isDefault
        ? {
            product_id,
            buying_unit_size: 1,
            selling_unit_size: conversionRate,
            buying_unit_type,
            selling_unit_type,
            prepackaged,
            prepackaged_b
          }
        : {
            product_id,
            buying_unit_size: conversionDirection === 'buying' ? 1 : conversionRate,
            selling_unit_size: conversionDirection === 'buying' ? conversionRate : 1,
            buying_unit_type: conversionDirection === 'buying' ? newUnitType : selectedExistingUnit,
            selling_unit_type: conversionDirection === 'buying' ? selectedExistingUnit : newUnitType,
            prepackaged,
            prepackaged_b
          };

      if (!isDefault && conversionDirection === 'selling') {
        unitData.buying_unit_size = 1;
        unitData.selling_unit_size = conversionRate;
        unitData.buying_unit_type = selectedExistingUnit;
        unitData.selling_unit_type = newUnitType;
      }

      await axiosInstance.post('/units', unitData);
      setSnackbarMessage('Unit added successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setProductId('');
      setBuyingUnitType('');
      setSellingUnitType('');
      setPrepackaged(false);
      setPrepackagedB(false);
      setNewUnitType('');
      setSelectedExistingUnit('');
      setConversionRate('');
    } catch (error) {
      setSnackbarMessage('Error adding unit: ' + (error.response ? error.response.data.error : error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Add Unit
        </Typography>
        <Card>
          <CardContent>
            <form onSubmit={handleFormSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Select Product"
                    variant="outlined"
                    fullWidth
                    value={product_id}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                  >
                    {products.map((product) => (
                      <MenuItem key={product.product_id} value={product.product_id}>
                        {`${product.product_name} - ${product.variety}`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {product_id && (
                  <>
                    {isDefault ? (
                      <>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1">
                            Buying Information
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Buying Unit Type"
                            variant="outlined"
                            fullWidth
                            value={buying_unit_type}
                            onChange={(e) => setBuyingUnitType(e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={prepackaged_b}
                                onChange={(e) => setPrepackagedB(e.target.checked)}
                                color="primary"
                              />
                            }
                            label="Prepackaged (Buying)"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1">
                            Selling Information
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Selling Unit Type"
                            variant="outlined"
                            fullWidth
                            value={selling_unit_type}
                            onChange={(e) => setSellingUnitType(e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={prepackaged}
                                onChange={(e) => setPrepackaged(e.target.checked)}
                                color="primary"
                              />
                            }
                            label="Prepackaged (Selling)"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Enter the number of selling units per buying unit."
                            variant="outlined"
                            fullWidth
                            value={conversionRate}
                            onChange={(e) => setConversionRate(e.target.value)}
                            required
                          />
                        </Grid>
                      </>
                    ) : (
                      <>
                        <Grid item xs={12}>
                          <TextField
                            label="New Unit Type"
                            variant="outlined"
                            fullWidth
                            value={newUnitType}
                            onChange={(e) => setNewUnitType(e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1">
                            Is the new unit a buying unit or a selling unit?
                          </Typography>
                          <FormControl component="fieldset">
                            <RadioGroup
                              row
                              value={conversionDirection}
                              onChange={(e) => setConversionDirection(e.target.value)}
                            >
                              <FormControlLabel value="buying" control={<Radio />} label="Buying Unit" />
                              <FormControlLabel value="selling" control={<Radio />} label="Selling Unit" />
                            </RadioGroup>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            select
                            label="Select Existing Unit"
                            variant="outlined"
                            fullWidth
                            value={selectedExistingUnit}
                            onChange={(e) => setSelectedExistingUnit(e.target.value)}
                            required
                          >
                            {[...new Set(existingUnits.map((unit) => unit.buying_unit_type))].map((unitType, index) => (
                              <MenuItem key={index} value={unitType}>
                                {unitType}
                              </MenuItem>
                            ))}
                            {[...new Set(existingUnits.map((unit) => unit.selling_unit_type))].map((unitType, index) => (
                              <MenuItem key={index} value={unitType}>
                                {unitType}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Enter the number of selling unit per buying unit"
                            variant="outlined"
                            fullWidth
                            value={conversionRate}
                            onChange={(e) => setConversionRate(e.target.value)}
                            required
                          />
                        </Grid>
                      </>
                    )}
                  </>
                )}
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary">
                    Add Unit
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddUnit;

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
  FormControlLabel,
  Switch,
  RadioGroup,
  FormControl,
  Radio
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
  const [isAddingNewUnit, setIsAddingNewUnit] = useState(false);
  const [unitCategory, setUnitCategory] = useState('buying'); // Add state to handle buying or selling radio button

  const location = useLocation();

  // Fetch products when the component loads
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

  // Get the product ID from query params if available
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const productIdFromParams = queryParams.get('product_id');
    if (productIdFromParams) {
      setProductId(productIdFromParams);
    }
  }, [location]);

  // Fetch units based on the selected product
  useEffect(() => {
    if (product_id) {
      const fetchUnits = async () => {
        try {
          const response = await axiosInstance.get(`/units/product/${product_id}`);
          setExistingUnits(response.data);

          // Check if units already exist for this product
          if (response.data.length > 0) {
            setIsAddingNewUnit(true); // This means there are existing units, so show the new unit form
          } else {
            setIsAddingNewUnit(false); // No existing units, show the full form for adding both buying and selling units
          }
        } catch (error) {
          console.error('Error fetching units:', error);
        }
      };
      fetchUnits();
    }
  }, [product_id]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log("Conversion rate before submit:", conversionRate);
    // Validate required fields
    if ((!isAddingNewUnit && (!buying_unit_type || !selling_unit_type)) || !conversionRate) {
      setSnackbarMessage('Please enter all required fields');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Construct unit data based on whether it's the first time adding or adding a new unit
      const unitData = isAddingNewUnit
        ? {
            product_id,
            newUnitType,
            selectedExistingUnit,
            conversion_rate: conversionRate,
            prepackaged,
            unitCategory // Add the unitCategory for buying/selling selection
          }
        : {
            product_id,
            buying_unit_type,
            selling_unit_type,
            conversion_rate: conversionRate,
            prepackaged,
            prepackaged_b,
            unitCategory
          };

      // Send the data to the backend
      await axiosInstance.post('/units', unitData);

      // Show success message
      setSnackbarMessage('Unit added successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Reset the form fields
      setProductId('');
      setBuyingUnitType('');
      setSellingUnitType('');
      setPrepackaged(false);
      setPrepackagedB(false);
      setNewUnitType('');
      setSelectedExistingUnit('');
      setConversionRate('');
    } catch (error) {
      // Show error message
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
          {isAddingNewUnit ? 'Add New Unit' : 'Add Unit'}
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
                    {!isAddingNewUnit ? (
                      <>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1">Buying Information</Typography>
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
                          <Typography variant="subtitle1">Selling Information</Typography>
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
                            label={`Please Enter How many ${selling_unit_type || 'second unit type'} are there in ${buying_unit_type || 'first unit type'}?`}
                            variant="outlined"
                            fullWidth
                            InputLabelProps={{
                              style: {
                                whiteSpace: 'normal',
                                fontSize: '0.875rem', // Reduce the font size to fit the placeholder
                              },
                            }}
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
                        {/* Radio Button for Buying or Selling Unit */}
                        <Grid item xs={12}>
                          <Typography variant="subtitle1">Is the New Unit Buying or Selling?</Typography>
                          <FormControl component="fieldset">
                            <RadioGroup
                              row
                              value={unitCategory}
                              onChange={(e) => {
                                console.log('Selected category:', e.target.value); // Debugging line to check what's being selected
                                setUnitCategory(e.target.value);
                              }}
                            >
                              <FormControlLabel value="buying" control={<Radio />} label="Buying" />
                              <FormControlLabel value="selling" control={<Radio />} label="Selling" />
                            </RadioGroup>
                          </FormControl>
                        </Grid>
                        {/* Prepackaged Toggle for the New Unit */}
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={prepackaged}
                                onChange={(e) => setPrepackaged(e.target.checked)}
                                color="primary"
                              />
                            }
                            label="Prepackaged (New Unit)"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            select
                            label="Select Existing Unit for Comparison"
                            variant="outlined"
                            fullWidth
                            value={selectedExistingUnit}
                            onChange={(e) => setSelectedExistingUnit(e.target.value)}
                            required
                          >
                            {existingUnits.map((unit) => (
                              <MenuItem key={unit.unit_id} value={unit.unit_id}>
                                {unit.unit_type} ({unit.unit_category})
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                           label={`Please Enter How many ${existingUnits.find(unit => unit.unit_id === selectedExistingUnit)?.unit_type || 'selected unit type'} are there in ${newUnitType || 'new unit type'}?`}
                            variant="outlined"
                            fullWidth
                            InputLabelProps={{
                              style: {
                                whiteSpace: 'normal',
                                fontSize: '0.875rem', // Reduce the font size to fit the placeholder
                              },
                            }}
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

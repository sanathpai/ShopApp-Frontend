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
  Radio,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import axiosInstance from '../AxiosInstance';
import { useLocation, useNavigate } from 'react-router-dom';

const AddUnit = () => {
  const [product_id, setProductId] = useState('');
  const [buying_unit_type, setBuyingUnitType] = useState('');
  const [selling_unit_type, setSellingUnitType] = useState('');
  const [prepackaged, setPrepackaged] = useState(false);
  const [prepackaged_b, setPrepackagedB] = useState(false);
  const [products, setProducts] = useState([]);
  const [existingUnits, setExistingUnits] = useState([]);
  const [productUnitTypes, setProductUnitTypes] = useState([]); // Store unit types for selected product only
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [newUnitType, setNewUnitType] = useState('');
  const [selectedExistingUnit, setSelectedExistingUnit] = useState('');
  const [conversionRate, setConversionRate] = useState('');
  const [isAddingNewUnit, setIsAddingNewUnit] = useState(false);
  const [unitCategory, setUnitCategory] = useState('buying'); // Add state to handle buying or selling radio button
  const [addAnotherDialogOpen, setAddAnotherDialogOpen] = useState(false);
  const [fromProductFlow, setFromProductFlow] = useState(false);
  const [currentProductInfo, setCurrentProductInfo] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

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
    const fromProduct = queryParams.get('from_product') === 'true';
    
    if (productIdFromParams) {
      setProductId(productIdFromParams);
    }
    if (fromProduct) {
      setFromProductFlow(true);
    }
  }, [location]);

  // Fetch units based on the selected product
  useEffect(() => {
    if (product_id) {
      const fetchUnits = async () => {
        try {
          // First get the selected product to find its product name
          const selectedProduct = products.find(p => p.product_id === product_id);
          
          if (selectedProduct) {
            // Get all products with the same product name (all varieties)
            const sameProductVarieties = products.filter(p => p.product_name === selectedProduct.product_name);
            
            // Fetch units for all varieties of this product
            const unitPromises = sameProductVarieties.map(product => 
              axiosInstance.get(`/units/product/${product.product_id}`)
            );
            
            const unitResponses = await Promise.all(unitPromises);
            
            // Combine all units from all varieties
            const allUnitsForProduct = unitResponses.flatMap(response => response.data);
            
            // Set existing units (for the specific product_id - needed for the existing unit dropdown)
            const specificProductUnits = allUnitsForProduct.filter(unit => unit.product_id === product_id);
            setExistingUnits(specificProductUnits);
            
            // Extract unique unit types for all varieties of this product
            const uniqueUnitTypes = [...new Set(allUnitsForProduct.map(unit => unit.unit_type))];
            setProductUnitTypes(uniqueUnitTypes);

            // Check if units already exist for this specific product
            if (specificProductUnits.length > 0) {
              setIsAddingNewUnit(true); // This means there are existing units, so show the new unit form
            } else {
              setIsAddingNewUnit(false); // No existing units, show the full form for adding both buying and selling units
            }
          }
        } catch (error) {
          console.error('Error fetching units:', error);
        }
      };
      fetchUnits();
    } else {
      // Clear unit types when no product is selected
      setProductUnitTypes([]);
    }
  }, [product_id, products]);

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

      // If coming from product flow, ask if they want to add another unit
      if (fromProductFlow) {
        const selectedProduct = products.find(p => p.product_id === parseInt(product_id));
        setCurrentProductInfo(selectedProduct);
        setAddAnotherDialogOpen(true);
      } else {
        // Reset the form fields for regular flow
        resetForm();
      }
    } catch (error) {
      // Show error message
      setSnackbarMessage('Error adding unit: ' + (error.response ? error.response.data.error : error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const resetForm = () => {
    setProductId('');
    setBuyingUnitType('');
    setSellingUnitType('');
    setPrepackaged(false);
    setPrepackagedB(false);
    setNewUnitType('');
    setSelectedExistingUnit('');
    setConversionRate('');
  };

  const handleAddAnotherUnit = () => {
    setAddAnotherDialogOpen(false);
    // Reset only the unit-related fields, keep the product_id
    setBuyingUnitType('');
    setSellingUnitType('');
    setPrepackaged(false);
    setPrepackagedB(false);
    setNewUnitType('');
    setSelectedExistingUnit('');
    setConversionRate('');
    setUnitCategory('buying');
    // Refresh the units data
    window.location.reload();
  };

  const handleFinishAddingUnits = () => {
    setAddAnotherDialogOpen(false);
    // Navigate to stock entry page
    const selectedProduct = products.find(p => p.product_id === parseInt(product_id));
    if (selectedProduct) {
      navigate(`/dashboard/inventories/stock-entry?product_id=${selectedProduct.product_id}&product_name=${encodeURIComponent(selectedProduct.product_name)}&variety=${encodeURIComponent(selectedProduct.variety || '')}`);
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
                          <Autocomplete
                            freeSolo
                            options={productUnitTypes}
                            value={buying_unit_type}
                            onChange={(event, newValue) => {
                              setBuyingUnitType(newValue || '');
                            }}
                            onInputChange={(event, newInputValue) => {
                              setBuyingUnitType(newInputValue);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Buying Unit Type"
                                variant="outlined"
                                fullWidth
                                required
                              />
                            )}
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
                          <Autocomplete
                            freeSolo
                            options={productUnitTypes}
                            value={selling_unit_type}
                            onChange={(event, newValue) => {
                              setSellingUnitType(newValue || '');
                            }}
                            onInputChange={(event, newInputValue) => {
                              setSellingUnitType(newInputValue);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Selling Unit Type"
                                variant="outlined"
                                fullWidth
                                required
                              />
                            )}
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
                          <Autocomplete
                            freeSolo
                            options={productUnitTypes}
                            value={newUnitType}
                            onChange={(event, newValue) => {
                              setNewUnitType(newValue || '');
                            }}
                            onInputChange={(event, newInputValue) => {
                              setNewUnitType(newInputValue);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="New Unit Type"
                                variant="outlined"
                                fullWidth
                                required
                              />
                            )}
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

      {/* Add Another Unit Dialog */}
      <Dialog open={addAnotherDialogOpen} onClose={() => setAddAnotherDialogOpen(false)}>
        <DialogTitle>Add Another Unit?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Would you like to add another unit for "{currentProductInfo?.product_name}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFinishAddingUnits} color="primary">
            No, Proceed to Stock Entry
          </Button>
          <Button onClick={handleAddAnotherUnit} color="primary" variant="contained">
            Yes, Add Another Unit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddUnit;

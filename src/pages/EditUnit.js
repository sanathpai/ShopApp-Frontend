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
import { useParams, useNavigate } from 'react-router-dom';

const EditUnit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product_id, setProductId] = useState('');
  const [buying_unit_type, setBuyingUnitType] = useState('default');
  const [selling_unit_type, setSellingUnitType] = useState('default');
  const [prepackaged, setPrepackaged] = useState(false);
  const [products, setProducts] = useState([]);
  const [existingUnits, setExistingUnits] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [newUnitType, setNewUnitType] = useState('');
  const [selectedExistingUnit, setSelectedExistingUnit] = useState('');
  const [conversionRate, setConversionRate] = useState('');
  const [conversionDirection, setConversionDirection] = useState('buying'); // 'buying' or 'selling'

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    const fetchUnitDetails = async () => {
      try {
        const response = await axiosInstance.get(`/units/${id}`);
        const unit = response.data;
        setProductId(unit.product_id);
        setBuyingUnitType(unit.buying_unit_type);
        setSellingUnitType(unit.selling_unit_type);
        setPrepackaged(unit.prepackaged);
        setConversionRate(
          unit.buying_unit_size !== 1 ? unit.buying_unit_size : unit.selling_unit_size
        );
        setConversionDirection(
          unit.buying_unit_size !== 1 ? 'buying' : 'selling'
        );
      } catch (error) {
        console.error('Error fetching unit details:', error);
      }
    };

    fetchProducts();
    fetchUnitDetails();
  }, [id]);

  useEffect(() => {
    if (product_id) {
      const fetchUnits = async () => {
        try {
          const response = await axiosInstance.get(`/units/product/${product_id}`);
          setExistingUnits(response.data);
        } catch (error) {
          console.error('Error fetching units:', error);
        }
      };

      fetchUnits();
    }
  }, [product_id]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (existingUnits.length === 0 || (existingUnits[0].buying_unit_type === 'default' && existingUnits[0].selling_unit_type === 'default')) {
      if (!buying_unit_type || !selling_unit_type || !conversionRate) {
        setSnackbarMessage('Please enter both Buying and Selling Unit Types and Conversion Rate');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      try {
        const unitData = {
          product_id,
          buying_unit_size: 1,
          selling_unit_size: conversionRate,
          buying_unit_type,
          selling_unit_type,
          prepackaged
        };

        await axiosInstance.put(`/units/${id}`, unitData);
        setSnackbarMessage('Unit updated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        navigate('/dashboard/units/view');
      } catch (error) {
        setSnackbarMessage('Error updating unit: ' + (error.response ? error.response.data.error : error.message));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } else {
      if (!selectedExistingUnit || !newUnitType || !conversionRate) {
        setSnackbarMessage('Please select an existing unit, enter a new unit type, and provide a conversion rate');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      try {
        const unitData = {
          product_id,
          buying_unit_size: conversionDirection === 'buying' ? 1 : conversionRate,
          selling_unit_size: conversionDirection === 'buying' ? conversionRate : 1,
          buying_unit_type: conversionDirection === 'buying' ? selectedExistingUnit : newUnitType,
          selling_unit_type: conversionDirection === 'buying' ? newUnitType : selectedExistingUnit,
          prepackaged
        };

        if (conversionDirection === 'selling') {
          unitData.buying_unit_size = 1;
          unitData.selling_unit_size = conversionRate;
          unitData.buying_unit_type = newUnitType;
          unitData.selling_unit_type = selectedExistingUnit;
        }

        await axiosInstance.put(`/units/${id}`, unitData);
        setSnackbarMessage('Unit updated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        navigate('/dashboard/units/view');
      } catch (error) {
        setSnackbarMessage('Error updating unit: ' + (error.response ? error.response.data.error : error.message));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
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
          Edit Unit
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
                {existingUnits.length === 0 || (existingUnits[0].buying_unit_type === 'default' && existingUnits[0].selling_unit_type === 'default') ? (
                  <>
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
                      <Typography variant="subtitle1">
                        Is the selected unit a buying unit or selling unit?
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
                        label=" Select a Unit from Existing Units"
                        variant="outlined"
                        fullWidth
                        value={selectedExistingUnit}
                        onChange={(e) => setSelectedExistingUnit(e.target.value)}
                        required
                      >
                        {existingUnits.map((unit) => (
                          <MenuItem key={unit.unit_id} value={unit.buying_unit_type}>
                            {unit.buying_unit_type}
                          </MenuItem>
                        ))}
                        {existingUnits.map((unit) => (
                          <MenuItem key={unit.unit_id} value={unit.selling_unit_type}>
                            {unit.selling_unit_type}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label={conversionDirection === 'buying' ? "New Selling Unit Type" : "New Buying Unit Type"}
                        variant="outlined"
                        fullWidth
                        value={newUnitType}
                        onChange={(e) => setNewUnitType(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Conversion Rate"
                        variant="outlined"
                        fullWidth
                        value={conversionRate}
                        onChange={(e) => setConversionRate(e.target.value)}
                        required
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={prepackaged}
                        onChange={(e) => setPrepackaged(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Prepackaged"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary">
                    Update Unit
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

export default EditUnit;

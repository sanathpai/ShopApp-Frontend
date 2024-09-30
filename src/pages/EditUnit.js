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
  Switch
} from '@mui/material';
import axiosInstance from '../AxiosInstance';
import { useParams, useNavigate } from 'react-router-dom';

const EditUnit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State variables for the unit details
  const [product_id, setProductId] = useState('');
  const [unit_type, setUnitType] = useState(''); // Changed variable name to be more general
  const [opposite_unit_id, setOppositeUnitId] = useState(''); // Store the selected opposite unit
  const [prepackaged, setPrepackaged] = useState(false);
  const [products, setProducts] = useState([]);
  const [existingUnits, setExistingUnits] = useState([]); // For dropdown of existing units
  const [conversionRate, setConversionRate] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Fetch the data for the product list and unit details
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
    
        console.log('Fetched unit details:', unit);
    
        if (unit) {
          setProductId(unit.product_id || '');
          setUnitType(unit.unit_type || '');
          setOppositeUnitId(unit.opposite_unit_id || ''); // Store the opposite unit ID
          setPrepackaged(unit.prepackaged || false);
          setConversionRate(unit.conversion_factor || '');
        }
      } catch (error) {
        console.error('Error fetching unit details:', error);
      }
    };

    fetchProducts();
    fetchUnitDetails();
  }, [id]);

  // Fetch existing units for the selected product
  useEffect(() => {
    if (product_id) {
      const fetchExistingUnits = async () => {
        try {
          const response = await axiosInstance.get(`/units/product/${product_id}`);
          setExistingUnits(response.data);
        } catch (error) {
          console.error('Error fetching existing units:', error);
        }
      };

      fetchExistingUnits();
    }
  }, [product_id]);

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare the data to be sent to the backend
      const updatedUnitData = {
        product_id,
        unit_type,
        unit_category: 'buying', // Assuming 'buying' as default; adjust as needed
        opposite_unit_id, // Include opposite unit ID
        prepackaged,
        conversion_rate: parseFloat(conversionRate)
      };

      const response = await axiosInstance.put(`/units/${id}`, updatedUnitData);
    
      if (response.status === 200) {
        setSnackbarMessage('Unit updated successfully. Please note: You will need to reconcile inventory for the changes to reflect accurately.');
        setSnackbarSeverity('warning'); // Set the severity to warning for this alert
        setSnackbarOpen(true);
      }
      
      // Redirect to view page after a brief delay
      setTimeout(() => navigate('/dashboard/units/view'), 3000);

    } catch (error) {
      setSnackbarMessage('Error updating unit: ' + (error.response ? error.response.data.error : error.message));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
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
                {/* Select Product */}
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

                {/* Unit Type */}
                <Grid item xs={12}>
                  <TextField
                    label="Unit Type"
                    variant="outlined"
                    fullWidth
                    value={unit_type}
                    onChange={(e) => setUnitType(e.target.value)}
                    required
                  />
                </Grid>

                {/* Dropdown for selecting existing units */}
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Select Opposite Unit"
                    variant="outlined"
                    fullWidth
                    value={opposite_unit_id}
                    onChange={(e) => setOppositeUnitId(e.target.value)}
                    required
                  >
                    {existingUnits.map((unit) => (
                      <MenuItem key={unit.unit_id} value={unit.unit_id}>
                        {unit.unit_type} ({unit.unit_category})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Conversion Rate */}
                <Grid item xs={12}>
                  <TextField
                    label={`How many ${existingUnits.find(unit => unit.unit_id === opposite_unit_id)?.unit_type || 'selected unit type'} are there in ${unit_type || 'current unit type'}?`}
                    variant="outlined"
                    fullWidth
                    value={conversionRate}
                    onChange={(e) => setConversionRate(e.target.value)}
                    required
                  />
                </Grid>

                {/* Prepackaged */}
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

                {/* Submit Button */}
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

      {/* Snackbar Notification */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditUnit;

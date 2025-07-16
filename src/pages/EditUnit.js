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
  CircularProgress
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
  const [products, setProducts] = useState([]);
  const [existingUnits, setExistingUnits] = useState([]); // For dropdown of existing units
  const [conversionRate, setConversionRate] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [loading, setLoading] = useState(true);

  // Fetch the data for the product list and unit details
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch products and unit details in parallel
        const [productsResponse, unitResponse] = await Promise.all([
          axiosInstance.get('/products'),
          axiosInstance.get(`/units/${id}`)
        ]);

        const unit = unitResponse.data;
        console.log('Fetched unit details:', unit);

        // Set products first
        setProducts(productsResponse.data);

        if (unit && unit.product_id) {
          // Fetch existing units for the specific product
          const unitsResponse = await axiosInstance.get(`/units/product/${unit.product_id}`);
          setExistingUnits(unitsResponse.data);

          // Now set all the form values after we have all the data
          setProductId(unit.product_id || '');
          setUnitType(unit.unit_type || '');
          setOppositeUnitId(unit.opposite_unit_id || '');
          setConversionRate(unit.conversion_factor || '');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbarMessage('Error fetching unit details');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  // Fetch existing units when product changes (for when user manually changes product)
  useEffect(() => {
    if (product_id && !loading) {
      const fetchExistingUnits = async () => {
        try {
          const response = await axiosInstance.get(`/units/product/${product_id}`);
          setExistingUnits(response.data);
          // Reset opposite unit selection when product changes
          setOppositeUnitId('');
        } catch (error) {
          console.error('Error fetching existing units:', error);
        }
      };

      fetchExistingUnits();
    }
  }, [product_id, loading]);

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

  // Helper function to format product display
  const formatProductDisplay = (product) => {
    let display = product.product_name;
    if (product.variety && product.variety !== 'undefined' && product.variety !== 'null') {
      display += ` - ${product.variety}`;
    }
    if (product.brand && product.brand !== 'undefined' && product.brand !== 'null') {
      display += ` (${product.brand})`;
    }
    return display;
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Unit
        </Typography>
        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
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
                          {formatProductDisplay(product)}
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
                      label="Select Comparison Unit" /*opposite unit*/
                      variant="outlined"
                      fullWidth
                      value={opposite_unit_id}
                      onChange={(e) => setOppositeUnitId(e.target.value)}
                      required
                      disabled={!existingUnits.length}
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

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" color="primary">
                      Update Unit
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
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

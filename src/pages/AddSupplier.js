import React, { useState } from 'react';
import axiosInstance from '../AxiosInstance';
import { Container, TextField, Button, Grid, Card, CardContent, Snackbar, Alert, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';

const AddSupplier = () => {
  const [sourceType, setSourceType] = useState('supplier');
  const [supplierName, setSupplierName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [location, setLocation] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/suppliers', {
        source_type: sourceType, // send the source type
        supplier_name: sourceType === 'supplier' ? supplierName : '', // send supplier name if source is supplier
        market_name: sourceType === 'market' ? supplierName : '', // send market name if source is market
        contact_info: contactInfo,
        location,
      });
      setSupplierName('');
      setContactInfo('');
      setLocation('');
      setSuccess(true);
    } catch (error) {
      setError(true);
    }
  };

  return (
    <Container maxWidth="md">
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <h2>Add Source</h2> {/* Add Source title */}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Source Type</FormLabel>
                  <RadioGroup
                    row
                    aria-label="source-type"
                    name="source-type"
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                  >
                    <FormControlLabel value="supplier" control={<Radio />} label="Supplier" />
                    <FormControlLabel value="market" control={<Radio />} label="Market" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={sourceType === 'supplier' ? "Supplier Name" : "Market Name"} // Dynamically change label
                  variant="outlined"
                  fullWidth
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Phone Number"
                  variant="outlined"
                  fullWidth
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Location"
                  variant="outlined"
                  fullWidth
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary" fullWidth>
                  Add Source
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert onClose={() => setSuccess(false)} severity="success">
          Source added successfully!
        </Alert>
      </Snackbar>
      <Snackbar open={error} autoHideDuration={6000} onClose={() => setError(false)}>
        <Alert onClose={() => setError(false)} severity="error">
          Error adding source!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddSupplier;

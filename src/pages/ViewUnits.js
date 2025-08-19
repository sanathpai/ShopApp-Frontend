import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Snackbar,
  Alert,
  Pagination,
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import axiosInstance from '../AxiosInstance';

const ViewUnits = () => {
  const [units, setUnits] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); // New state for delete confirmation dialog
  const [unitToDelete, setUnitToDelete] = useState(null); // Track the unit to delete
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await axiosInstance.get('/units');
        console.log(response.data);
        setUnits(response.data);
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };

    fetchUnits();
  }, []);

  const handleEdit = (unit) => {
    console.log(`Unit id is ${unit.unit_id}`);
    navigate(`/dashboard/units/edit/${unit.unit_id}`);
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/units/${unitToDelete.unit_id}`);
      setUnits(units.filter((unit) => unit.unit_id !== unitToDelete.unit_id));
      setSnackbarMessage('Unit deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setDeleteConfirmOpen(false); // Close the confirmation dialog
    } catch (error) {
      setSnackbarMessage('Error deleting unit: ' + (error.response ? error.response.data.error : error.message));
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

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleInfoClick = (unit) => {
    setSelectedUnit(unit);
  };

  const handleDialogClose = () => {
    setSelectedUnit(null);
  };

  const confirmDelete = (unit) => {
    setUnitToDelete(unit);
    setDeleteConfirmOpen(true); // Open the confirmation dialog
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setUnitToDelete(null);
  };

  const paginatedUnits = units.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        View Units
      </Typography>
      <Grid container spacing={4}>
        {paginatedUnits.map((unit) => (
          <Grid item xs={12} sm={6} md={4} key={unit.unit_id}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  {unit.product_name || 'Product Name Unavailable'}
                  {unit.brand && ` (${unit.brand})`}
                </Typography>
                {unit.variety && <Typography variant="body2">Variety: {unit.variety}</Typography>}
                <Typography variant="body2">Unit Type: {unit.unit_type}</Typography>
                <Typography variant="body2">Unit Category: {unit.unit_category}</Typography>
                <Typography variant="body2">Unit compared to: {unit.opposite_unit_type || 'N/A'}</Typography>
                <Typography variant="body2">conversion factor between this unit and compared unit: {unit.conversion_rate ? unit.conversion_rate : 'N/A'}</Typography>
                {/* <Typography variant="body2">Prepackaged: {unit.prepackaged ? 'Yes' : 'No'}</Typography> */}
              </CardContent>
              <CardActions>
                <Button variant="contained" color="primary" onClick={() => handleEdit(unit)}>
                  Edit
                </Button>
                <Button variant="contained" color="secondary" onClick={() => confirmDelete(unit)}>
                  Delete
                </Button>
                <Tooltip title="View Details">
                  <IconButton onClick={() => handleInfoClick(unit)}>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={Math.ceil(units.length / rowsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Dialog open={Boolean(selectedUnit)} onClose={handleDialogClose}>
        <DialogTitle>Unit Details</DialogTitle>
        <DialogContent>
          {selectedUnit && (
            <>
              <Typography variant="body1">
                Product Name: {selectedUnit.product_name}
                {selectedUnit.brand && ` (${selectedUnit.brand})`}
              </Typography>
              {selectedUnit.variety && <Typography variant="body1">Variety: {selectedUnit.variety}</Typography>}
              <Typography variant="body1">Unit Type: {selectedUnit.unit_type}</Typography>
              <Typography variant="body1">Unit Category: {selectedUnit.unit_category}</Typography>
              <Typography variant="body1">Opposite Unit: {selectedUnit.opposite_unit_type ? selectedUnit.opposite_unit_type : 'N/A'}</Typography>
              {/* <Typography variant="body1">Prepackaged: {selectedUnit.prepackaged ? 'Yes' : 'No'}</Typography> */}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Deletion */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            All inventories, purchases, and sales made on these units will be deleted. Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="secondary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ViewUnits;

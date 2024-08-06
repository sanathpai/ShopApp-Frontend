import React, { useState, useEffect } from 'react';
import axiosInstance from '../AxiosInstance';
import { 
  Container, 
  TextField, 
  Button, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Snackbar, 
  Card, 
  CardContent, 
  Typography, 
  Grid 
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { useParams } from 'react-router-dom';

const EditInventory = () => {
  const { id } = useParams(); // Assuming the inventory ID is passed as a URL parameter
  const [shopName, setShopName] = useState('');
  const [productName, setProductName] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState(false);
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shopsResponse = await axiosInstance.get('/shops');
        const productsResponse = await axiosInstance.get('/products');
        const inventoryResponse = await axiosInstance.get(`/inventories/${id}`);
        
        setShops(shopsResponse.data);
        setProducts(productsResponse.data);
        
        const inventory = inventoryResponse.data;
        setShopName(inventory.shop_name);
        setProductName(inventory.product_name);
        setCurrentStock(inventory.current_stock);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axiosInstance.put(`/inventories/${id}`, {
        shop_name: shopName,
        product_name: productName,
        current_stock: currentStock,
      });
      setOpenSuccessSnackbar(true);
    } catch (error) {
      console.error('Error updating inventory:', error);
      setOpenErrorSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSuccessSnackbar(false);
    setOpenErrorSnackbar(false);
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Edit Inventory
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Shop Name</InputLabel>
                  <Select
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    label="Shop Name"
                  >
                    {shops.map((shop) => (
                      <MenuItem key={shop.shop_id} value={shop.shop_name}>
                        {shop.shop_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Product Name</InputLabel>
                  <Select
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    label="Product Name"
                  >
                    {products.map((product) => (
                      <MenuItem key={product.product_id} value={product.product_name}>
                        {product.product_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Current Stock"
                  type="number"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary">
                  Update Inventory
                </Button>
              </Grid>
            </Grid>
          </form>
          <Snackbar
            open={openSuccessSnackbar}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity="success">
              Inventory updated successfully!
            </MuiAlert>
          </Snackbar>
          <Snackbar
            open={openErrorSnackbar}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity="error">
              Error updating inventory!
            </MuiAlert>
          </Snackbar>
        </CardContent>
      </Card>
    </Container>
  );
};

export default EditInventory;

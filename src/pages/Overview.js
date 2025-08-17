import React, { useEffect, useState } from 'react';
import axiosInstance from '../AxiosInstance';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Button,
  Paper,
  Modal,
  Divider,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Overview = () => {
  const [overviewData, setOverviewData] = useState([]);
  const [productUnits, setProductUnits] = useState({});
  const [selectedUnits, setSelectedUnits] = useState({});
  const [convertedProfits, setConvertedProfits] = useState({});
  const [convertedProfitsLastWeek, setConvertedProfitsLastWeek] = useState({});
  const [productColors, setProductColors] = useState({});
  const [productsBelowThreshold, setProductsBelowThreshold] = useState([]);
  const [productsWithoutInventory, setProductsWithoutInventory] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const response = await axiosInstance.get('/overview');
        const { finalProfits } = response.data;

        const products = finalProfits.profitsForWeek
          .filter((item) => item.profit > 0)
          .map((item, index) => ({
            productName: `${item.productName}-${item.variety || 'Unknown Variety'}`,
            productId: item.productId,
            profit: item.profit,
            profitLastWeek: finalProfits.profitsForPrevWeek[index]?.profit || 'N/A',
            inventoryUnitId: item.unitId,
          }));

        setOverviewData(products);

        const allProducts = products;
        generateUniqueColors(allProducts);

        const unitPromises = products.map((product) =>
          axiosInstance.get(`/units/product/${product.productId}/unitInfo`)
        );

        const unitResponses = await Promise.all(unitPromises);
        const units = unitResponses.reduce((acc, res, idx) => {
          acc[products[idx].productId] = res.data.units;
          return acc;
        }, {});

        setProductUnits(units);

        // Set default units for dropdown
        const defaultUnits = products.reduce((acc, product) => {
          acc[product.productId] = product.inventoryUnitId;
          return acc;
        }, {});
        setSelectedUnits(defaultUnits);
      } catch (error) {
        console.error('Error fetching overview data:', error);
      }
    }

    const fetchProductsBelowThreshold = async () => {
      try {
        const response = await axiosInstance.get('/overview/below-threshold');
        setProductsBelowThreshold(response.data.productsBelowThreshold);
      } catch (error) {
        console.error('Error fetching products below threshold:', error);
      }
    };

    const fetchProductsWithoutInventory = async () => {
      try {
        const response = await axiosInstance.get('/overview/without-inventory');
        setProductsWithoutInventory(response.data.productsWithoutInventory);
      } catch (error) {
        console.error('Error fetching products without inventory:', error);
      }
    };

    fetchOverviewData();
    fetchProductsBelowThreshold();
    fetchProductsWithoutInventory();
  }, []);

  // Open modal if there are products below threshold OR products without inventory
  useEffect(() => {
    if (productsBelowThreshold.length > 0 || productsWithoutInventory.length > 0) {
      setModalOpen(true);
    }
  }, [productsBelowThreshold, productsWithoutInventory]);

  const generateUniqueColors = (products) => {
    const colorMap = {};
    products.forEach((product, index) => {
      if (!colorMap[product.productId]) {
        colorMap[product.productId] = `hsl(${(index * 360) / products.length}, 70%, 50%)`;
      }
    });
    setProductColors(colorMap);
  };

  const handleUnitChange = async (productId, selectedUnitId) => {
    setSelectedUnits((prev) => ({ ...prev, [productId]: selectedUnitId }));
    const product = overviewData.find((item) => item.productId === productId);

    try {
      const response = await axiosInstance.get(
        `/overview/calculate-profit`,
        {
          params: {
            profitPerInventoryUnit: product.profit,
            profitLastWeek: product.profitLastWeek === 'N/A' ? 0 : product.profitLastWeek,
            inventoryUnitId: product.inventoryUnitId,
            selectedUnitId,
          },
        }
      );

      setConvertedProfits((prev) => ({
        ...prev,
        [productId]: response.data.profit,
      }));
      setConvertedProfitsLastWeek((prev) => ({
        ...prev,
        [productId]: response.data.profitLastWeek,
      }));
    } catch (error) {
      console.error('Error converting profit:', error);
    }
  };

  const truncateLabel = (label) => (label.length > 5 ? `${label.substring(0, 5)}...` : label);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
  };

  const handleCloseModal = () => setModalOpen(false);

  const formatProductDisplay = (product) => {
    let display = product.productName;
    if (product.variety) {
      display += ` - ${product.variety}`;
    }
    if (product.brand) {
      display += ` (${product.brand})`;
    }
    return display;
  };

  const generateAddInventoryLink = (product) => {
    const encodedName = encodeURIComponent(product.productName);
    const encodedVariety = encodeURIComponent(product.variety || '');
    return `/dashboard/inventories/stock-entry?product_id=${product.productId}&product_name=${encodedName}&variety=${encodedVariety}`;
  };

  return (
    <Box sx={{ padding: 2 }}>
      {/* Modal for Products Below Threshold and Without Inventory */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box sx={{ 
          padding: 4, 
          background: 'white', 
          margin: 'auto', 
          marginTop: '5%', 
          width: '60%', 
          maxWidth: '800px',
          borderRadius: 2,
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          {/* <Typography variant="h6" gutterBottom>
            Inventory Notifications
          </Typography> */}
          
          {/* Products Without Inventory Section */}
          {productsWithoutInventory.length > 0 && (
            <>
              <Typography variant="h6" color="error" gutterBottom>
                Products Without Initial Stock Set
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                The following products do not have their initial stocks set:
              </Typography>
              <TableContainer component={Paper} sx={{ marginBottom: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell>Variety</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productsWithoutInventory.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>{formatProductDisplay(product)}</TableCell>
                        <TableCell>{product.variety || 'N/A'}</TableCell>
                        <TableCell>
                          <Button
                            component={Link}
                            to={generateAddInventoryLink(product)}
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={handleCloseModal}
                          >
                            Set Stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Divider if both sections exist */}
          {productsWithoutInventory.length > 0 && productsBelowThreshold.length > 0 && (
            <Divider sx={{ marginY: 2 }} />
          )}

          {/* Products Below Threshold Section */}
          {productsBelowThreshold.length > 0 && (
            <>
              <Typography variant="h6" color="warning.main" gutterBottom>
           Low Stock Warning
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell>Variety</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productsBelowThreshold.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>
                          {product.productName}
                          {product.brand && ` (${product.brand})`}
                        </TableCell>
                        <TableCell>{product.variety || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Show message if no issues */}
          {productsWithoutInventory.length === 0 && productsBelowThreshold.length === 0 && (
            <Typography>No inventory issues found.</Typography>
          )}

          <Button variant="contained" onClick={handleCloseModal} sx={{ marginTop: 2 }}>
            Close
          </Button>
        </Box>
      </Modal>

      {/* Buttons */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 3 }}>
        <Link to="/dashboard/purchases/add" style={{ textDecoration: 'none' }}>
          <Button variant="contained" color="primary">
            Add Purchase
          </Button>
        </Link>
        <Link to="/dashboard/sales/add" style={{ textDecoration: 'none' }}>
          <Button variant="contained" color="secondary">
            Add Sale
          </Button>
        </Link>
        <Link to="/dashboard/inventories/view" style={{ textDecoration: 'none' }}>
          <Button variant="contained" color="info">
            Reconcile Inventory
          </Button>
        </Link>
        <Link to="/dashboard/customertransaction" style={{ textDecoration: 'none' }}>
          <Button variant="contained" color="secondary">
            Transaction
          </Button>
        </Link>
      </Box>

      {/* Profits Chart */}
      <Box sx={{ height: 400, marginBottom: 4 }}>
        <Typography variant="h6" gutterBottom>
          Profits by Product
        </Typography>
        <Bar
          data={{
            labels: overviewData.map((item) => truncateLabel(item.productName)),
            datasets: [
              {
                label: 'Profit per Inventory Unit (This Week)',
                data: overviewData.map((item) => convertedProfits[item.productId] || item.profit),
                backgroundColor: overviewData.map((item) => productColors[item.productId]),
              },
              {
                label: 'Profit per Inventory Unit (Last Week)',
                data: overviewData.map((item) =>
                  convertedProfitsLastWeek[item.productId] || item.profitLastWeek
                ),
                backgroundColor: overviewData.map((item) => `${productColors[item.productId]}80`),
              },
            ],
          }}
          options={chartOptions}
        />
      </Box>

      {/* Unit Conversion Table */}
      <Paper sx={{ padding: 3, marginBottom: 4, overflowX: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Unit Conversion Table
        </Typography>
        <TableContainer>
          <Table sx={{ border: '1px solid #ddd', width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Profit per Inventory Unit</TableCell>
                <TableCell>Profit Last Week</TableCell>
                <TableCell>Select Unit</TableCell>
                <TableCell>Profit per Selected Unit</TableCell>
                <TableCell>Profit Last Week (Selected Unit)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overviewData.map((product) => (
                <TableRow key={product.productId}>
                  <TableCell>{product.productName}</TableCell>
                  <TableCell>{product.profit.toFixed(2)}</TableCell>
                  <TableCell>
                    {product.profitLastWeek === 'N/A' ? 'N/A' : product.profitLastWeek}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={selectedUnits[product.productId] || product.inventoryUnitId}
                      onChange={(e) => handleUnitChange(product.productId, e.target.value)}
                      fullWidth
                    >
                      {productUnits[product.productId]?.map((unit) => (
                        <MenuItem key={unit.unit_id} value={unit.unit_id}>
                          {unit.unit_type}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    {convertedProfits[product.productId]
                      ? convertedProfits[product.productId].toFixed(2)
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {convertedProfitsLastWeek[product.productId]
                      ? convertedProfitsLastWeek[product.productId].toFixed(2)
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Overview;

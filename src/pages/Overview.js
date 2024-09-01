import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Tooltip, 
  Legend
);

const Overview = () => {
  const navigate = useNavigate();
  const [overviewData, setOverviewData] = useState({});
  const [purchaseData, setPurchaseData] = useState([]);
  const [saleData, setSaleData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!token || !isLoggedIn) {
      navigate('/login'); // Redirect to login page if not logged in
    } else {
      const fetchData = async () => {
        try {
          const [overviewResponse, purchasesResponse, salesResponse, inventoriesResponse] = await Promise.all([
            axiosInstance.get('/overview'),
            axiosInstance.get('/purchases'),
            axiosInstance.get('/sales'),
            axiosInstance.get('/inventories'),
          ]);

          console.log('Overview Data:', overviewResponse.data); // Debugging line to check data structure
          setOverviewData(overviewResponse.data);
          setPurchaseData(purchasesResponse.data);
          setSaleData(salesResponse.data);
          setInventoryData(inventoriesResponse.data);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      fetchData();
    }
  }, [navigate]);

  // Grouping data by product name and unit type
  const groupDataByProduct = (data, key) => {
    return data.reduce((acc, item) => {
      const label = `${item.product_name} (${item.unit_type})`;
      if (!acc[label]) {
        acc[label] = 0;
      }
      acc[label] += item[key];
      return acc;
    }, {});
  };

  const purchasesByProduct = groupDataByProduct(purchaseData, 'quantity');
  const salesByProduct = groupDataByProduct(saleData, 'quantity');
  const inventoryByProduct = groupDataByProduct(inventoryData, 'current_stock');

  // Generate unique colors for each product
  const generateUniqueColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const color = `hsl(${(i * 360) / count}, 70%, 50%)`;
      colors.push(color);
    }
    return colors;
  };

  const createBarData = (title, labels, data) => {
    const backgroundColors = generateUniqueColors(labels.length);

    return {
      labels,
      datasets: [
        {
          label: title,
          data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('70%', '90%')),
          borderWidth: 1,
        },
      ],
    };
  };

  const purchaseBarData = createBarData('Purchases by Product', Object.keys(purchasesByProduct), Object.values(purchasesByProduct));
  const saleBarData = createBarData('Sales by Product', Object.keys(salesByProduct), Object.values(salesByProduct));
  const inventoryBarData = createBarData('Inventory Stock by Product', Object.keys(inventoryByProduct), Object.values(inventoryByProduct));

  // Prepare data for the profits bar chart
  const prepareProfitBarChartData = () => {
    // Check if overviewData.profits is valid and not empty
    if (!overviewData.profits || Object.keys(overviewData.profits).length === 0) {
      return { labels: [], datasets: [] }; // Return empty data if profits data is not available
    }

    const labels = Object.keys(overviewData.profits).map(key => {
      const productData = overviewData.profits[key];
      const productName = productData.productName || 'Unknown';
      const inventoryUnitType = productData.inventoryUnitType || 'Unknown';
      return `${productName} (${inventoryUnitType})`;
    });

    const profitPerUnitThisWeek = Object.keys(overviewData.profits).map(key => overviewData.profits[key].profitPerUnitThisWeek || 0);
    const profitPerUnitLastWeek = Object.keys(overviewData.profits).map(key => overviewData.profits[key].profitPerUnitLastWeek || 0);

    const backgroundColors = generateUniqueColors(labels.length);

    return {
      labels,
      datasets: [
        {
          label: 'Profit Per Unit This Week',
          data: profitPerUnitThisWeek,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('70%', '90%')),
          borderWidth: 1,
        },
        {
          label: 'Profit Per Unit Last Week',
          data: profitPerUnitLastWeek,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('70%', '90%')),
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
        <Button variant="contained" color="primary" onClick={() => navigate('/dashboard/purchases/add')}>
          Add Purchase
        </Button>
        <Button variant="contained" color="primary" onClick={() => navigate('/dashboard/sales/add')}>
          Add Sale
        </Button>
        <Button variant="contained" color="primary" onClick={() => navigate('/dashboard/inventories/view')}>
          Reconcile Inventory
        </Button>
      </Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Purchases by Product
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar data={purchaseBarData} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sales by Product
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar data={saleBarData} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Inventory Stock by Product
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar data={inventoryBarData} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Profits by Product
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar data={prepareProfitBarChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Overview;

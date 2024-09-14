import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import { Box, Typography, Paper, Button } from '@mui/material';
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
  const [overviewData, setOverviewData] = useState([]);
  const [totalQuantities, setTotalQuantities] = useState({ purchases: [], sales: [] });
  const [productColors, setProductColors] = useState({});

  // Function to generate unique colors for each product
  const generateUniqueColors = (products) => {
    const count = products.length;
    const colors = [];
    for (let i = 0; i < count; i++) {
      const color = `hsl(${(i * 360) / count}, 70%, 50%)`;
      colors.push(color);
    }
    const productColorMap = products.reduce((acc, product, index) => {
      acc[product] = colors[index];
      return acc;
    }, {});
    return productColorMap;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!token || !isLoggedIn) {
      navigate('/login');
    } else {
      const fetchData = async () => {
        try {
          const overviewResponse = await axiosInstance.get('/overview');
          console.log('Overview Data:', overviewResponse.data);

          // Assuming the backend returns:
          // { finalProfits: { profitsForWeek: [...], profitsForPrevWeek: [...] }, totalQuantities: { purchases: [...], sales: [...] } }
          const { finalProfits, totalQuantities } = overviewResponse.data;
          
          // Create a unique identifier for each product
          const productData = finalProfits.profitsForWeek.map((item, index) => ({
            productName: `${item.productName}-${item.variety || 'Unknown Variety'} (${item.unitType})`,
            productIdentifier: `${item.productName}-${item.variety}-${item.unitType}`,
            thisWeekProfit: item.profit,
            prevWeekProfit: finalProfits.profitsForPrevWeek[index]?.profit || 0,
          }));

          // Process totalQuantities for purchases and sales
          const processedPurchases = totalQuantities.purchases.map(item => ({
            productName: `${item.productName}-${item.variety || 'Unknown Variety'} (${item.unitType})`,
            productIdentifier: `${item.productName}-${item.variety}-${item.unitType}`,
            totalQuantity: item.totalQuantity,
          }));
          const processedSales = totalQuantities.sales.map(item => ({
            productName: `${item.productName}-${item.variety || 'Unknown Variety'} (${item.unitType})`,
            productIdentifier: `${item.productName}-${item.variety}-${item.unitType}`,
            totalQuantity: item.totalQuantity,
          }));

          setOverviewData(productData);
          setTotalQuantities({ purchases: processedPurchases, sales: processedSales });

          // Extract all product identifiers for consistent color mapping
          const allProducts = [
            ...productData.map(p => p.productIdentifier),
            ...processedPurchases.map(p => p.productIdentifier),
            ...processedSales.map(p => p.productIdentifier),
          ];
          const colorMap = generateUniqueColors([...new Set(allProducts)]);
          setProductColors(colorMap);

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      fetchData();
    }
  }, [navigate]);

  // Prepare data for the profits bar chart
  const prepareProfitBarChartData = () => {
    if (!overviewData || overviewData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = overviewData.map(item => item.productName);
    const profitPerUnitThisWeek = overviewData.map(item => item.thisWeekProfit);
    const profitPerUnitLastWeek = overviewData.map(item => item.prevWeekProfit);

    const backgroundColors = overviewData.map(item => productColors[item.productIdentifier] || 'rgba(0, 0, 0, 0.1)');

    return {
      labels,
      datasets: [
        {
          label: 'Profit Per Unit This Week',
          data: profitPerUnitThisWeek,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map((color) => color.replace('70%', '90%')),
          borderWidth: 1,
        },
        {
          label: 'Profit Per Unit Last Week',
          data: profitPerUnitLastWeek,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map((color) => color.replace('70%', '90%')),
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare data for the purchases bar chart
  const preparePurchasesBarChartData = () => {
    if (!totalQuantities.purchases || totalQuantities.purchases.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = totalQuantities.purchases.map(item => item.productName);
    const quantities = totalQuantities.purchases.map(item => item.totalQuantity);
    
    const backgroundColors = totalQuantities.purchases.map(item => productColors[item.productIdentifier] || 'rgba(0, 0, 0, 0.1)');

    return {
      labels,
      datasets: [
        {
          label: 'Total Purchases',
          data: quantities,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map((color) => color.replace('70%', '90%')),
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare data for the sales bar chart
  const prepareSalesBarChartData = () => {
    if (!totalQuantities.sales || totalQuantities.sales.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = totalQuantities.sales.map(item => item.productName);
    const quantities = totalQuantities.sales.map(item => item.totalQuantity);

    const backgroundColors = totalQuantities.sales.map(item => productColors[item.productIdentifier] || 'rgba(0, 0, 0, 0.1)');

    return {
      labels,
      datasets: [
        {
          label: 'Total Sales',
          data: quantities,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map((color) => color.replace('70%', '90%')),
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options for responsive design
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { autoSkip: false },
      },
    },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: { xs: 2, md: 4 } }}>
      <Typography variant="h4" gutterBottom> Dashboard </Typography>
      
      {/* Add Buttons Here */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button variant="contained" color="primary" onClick={() => navigate('/dashboard/purchases/add')}>Add Purchase</Button>
        <Button variant="contained" color="secondary" onClick={() => navigate('/dashboard/sales/add')}>Add Sale</Button>
        <Button variant="contained" color="info" onClick={() => navigate('/dashboard/inventories/view')}>Reconcile Inventory</Button>
      </Box>
      
      {/* Profits by Product */}
      <Paper sx={{ p: 2, width: '100%', maxWidth: '900px' }}>
        <Typography variant="h6" gutterBottom> Profits by Product </Typography>
        <Box sx={{ height: { xs: 300, md: 400 } }}>
          <Bar data={prepareProfitBarChartData()} options={options} />
        </Box>
      </Paper>

      {/* Purchases by Product */}
      <Paper sx={{ p: 2, width: '100%', maxWidth: '900px' }}>
        <Typography variant="h6" gutterBottom> Purchases by Product </Typography>
        <Box sx={{ height: { xs: 300, md: 400 } }}>
          <Bar data={preparePurchasesBarChartData()} options={options} />
        </Box>
      </Paper>

      {/* Sales by Product */}
      <Paper sx={{ p: 2, width: '100%', maxWidth: '900px' }}>
        <Typography variant="h6" gutterBottom> Sales by Product </Typography>
        <Box sx={{ height: { xs: 300, md: 400 } }}>
          <Bar data={prepareSalesBarChartData()} options={options} />
        </Box>
      </Paper>
    </Box>
  );
};

export default Overview;

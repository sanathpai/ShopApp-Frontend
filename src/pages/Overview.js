import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../AxiosInstance';
import { Box, Typography, Button, useMediaQuery, useTheme } from '@mui/material';
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
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [overviewData, setOverviewData] = useState([]);
  const [totalQuantities, setTotalQuantities] = useState({
    purchases: [],
    sales: [],
  });
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
          const { finalProfits, totalQuantities } = overviewResponse.data;

          const productData = finalProfits.profitsForWeek.map((item, index) => ({
            productName: `${item.productName}-${item.variety || 'Unknown Variety'}`,
            productIdentifier: `${item.productName}-${item.variety}`,
            thisWeekProfit: item.profit,
            prevWeekProfit: finalProfits.profitsForPrevWeek[index]?.profit || 0,
          }));

          const processedPurchases = totalQuantities.purchases.map((item) => ({
            productName: `${item.productName}-${item.variety || 'Unknown Variety'}`,
            productIdentifier: `${item.productName}-${item.variety}`,
            totalQuantity: item.totalQuantity,
          }));

          const processedSales = totalQuantities.sales.map((item) => ({
            productName: `${item.productName}-${item.variety || 'Unknown Variety'}`,
            productIdentifier: `${item.productName}-${item.variety}`,
            totalQuantity: item.totalQuantity,
          }));

          setOverviewData(productData);
          setTotalQuantities({
            purchases: processedPurchases,
            sales: processedSales,
          });

          const allProducts = [
            ...productData.map((p) => p.productIdentifier),
            ...processedPurchases.map((p) => p.productIdentifier),
            ...processedSales.map((p) => p.productIdentifier),
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

  // Chart configuration
  const chartContainerStyle = {
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    width: '100%',
    paddingBottom: '1rem',
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: isMobile ? 90 : 0,
          minRotation: isMobile ? 90 : 0,
          padding: isMobile ? 5 : 10,
          callback: function(value, index, values) {
            const label = this.getLabelForValue(value);
            return isMobile
              ? label.length > 6 ? `${label.substring(0, 6)}...` : label
              : label.length > 6 ? `${label.substring(0, 6)}...` : label;
          }
        },
        grid: {
          display: false,
        },
        barPercentage: isMobile ? 1 : 0.8,
        categoryPercentage: isMobile ? 1 : 0.9,
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: !isMobile,
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const item = tooltipItems[0];
            return item.label;
          },
        },
      },
    },
    layout: {
      padding: {
        left: isMobile ? 10 : 20,
        right: isMobile ? 10 : 20,
        top: isMobile ? 20 : 0,
      }
    },
  };

  const prepareProfitChartData = () => {
    const labels = overviewData.map((item) => item.productName);
    const profitPerUnitThisWeek = overviewData.map((item) => item.thisWeekProfit);
    const profitPerUnitLastWeek = overviewData.map((item) => item.prevWeekProfit);
    const backgroundColors = overviewData.map(
      (item) => productColors[item.productIdentifier]
    );

    return {
      labels,
      datasets: [
        {
          label: 'Profit Per Unit This Week',
          data: profitPerUnitThisWeek,
          backgroundColor: backgroundColors,
        },
        {
          label: 'Profit Per Unit Last Week',
          data: profitPerUnitLastWeek,
          backgroundColor: backgroundColors.map((color) => color + '80'),
        },
      ],
    };
  };

  const preparePurchasesChartData = () => {
    const labels = totalQuantities.purchases.map((item) => item.productName);
    const quantities = totalQuantities.purchases.map((item) => item.totalQuantity);
    const backgroundColors = totalQuantities.purchases.map(
      (item) => productColors[item.productIdentifier]
    );

    return {
      labels,
      datasets: [
        {
          label: 'Total Purchases',
          data: quantities,
          backgroundColor: backgroundColors,
        },
      ],
    };
  };

  const prepareSalesChartData = () => {
    const labels = totalQuantities.sales.map((item) => item.productName);
    const quantities = totalQuantities.sales.map((item) => item.totalQuantity);
    const backgroundColors = totalQuantities.sales.map(
      (item) => productColors[item.productIdentifier]
    );

    return {
      labels,
      datasets: [
        {
          label: 'Total Sales',
          data: quantities,
          backgroundColor: backgroundColors,
        },
      ],
    };
  };

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: { xs: 2, md: 4 } }}
    >
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mb: 4, width: '100%' }}>
        <Button fullWidth variant="contained" color="primary" onClick={() => navigate('/dashboard/purchases/add')}>
          Add Purchase
        </Button>
        <Button fullWidth variant="contained" color="secondary" onClick={() => navigate('/dashboard/sales/add')}>
          Add Sale
        </Button>
        <Button fullWidth variant="contained" color="info" onClick={() => navigate('/dashboard/inventories/view')}>
          Reconcile Inventory
        </Button>
      </Box>

      <Box sx={chartContainerStyle}>
        <Box sx={{ height: { xs: 300, md: 400 }, width: isMobile ? '200%' : '150%', minWidth: isMobile ? '300px' : '600px' }}>
          <Typography variant="h6" gutterBottom>
            Profits by Product
          </Typography>
          <Bar data={prepareProfitChartData()} options={options} />
        </Box>
      </Box>

      <Box sx={chartContainerStyle}>
        <Box sx={{ height: { xs: 300, md: 400 }, width: isMobile ? '200%' : '150%', minWidth: isMobile ? '300px' : '600px' }}>
          <Typography variant="h6" gutterBottom>
            Purchases by Product
          </Typography>
          <Bar data={preparePurchasesChartData()} options={options} />
        </Box>
      </Box>

      <Box sx={chartContainerStyle}>
        <Box sx={{ height: { xs: 300, md: 400 }, width: isMobile ? '200%' : '150%', minWidth: isMobile ? '300px' : '600px' }}>
          <Typography variant="h6" gutterBottom>
            Sales by Product
          </Typography>
          <Bar data={prepareSalesChartData()} options={options} />
        </Box>
      </Box>
    </Box>
  );
};

export default Overview;
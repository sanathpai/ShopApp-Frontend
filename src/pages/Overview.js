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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Tooltip, 
  Legend
);

const Overview = () => {
  const navigate = useNavigate();
  const [purchaseData, setPurchaseData] = useState([]);
  const [saleData, setSaleData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [purchasesResponse, salesResponse, inventoriesResponse] = await Promise.all([
          axiosInstance.get('/purchases'),
          axiosInstance.get('/sales'),
          axiosInstance.get('/inventories'),
        ]);

        setPurchaseData(purchasesResponse.data);
        setSaleData(salesResponse.data);
        setInventoryData(inventoriesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Grouping data by product name
  const groupDataByProduct = (data, key) => {
    return data.reduce((acc, item) => {
      const productName = item.product_name;
      if (!acc[productName]) {
        acc[productName] = 0;
      }
      acc[productName] += item[key];
      return acc;
    }, {});
  };

  const purchasesByProduct = groupDataByProduct(purchaseData, 'quantity');
  const salesByProduct = groupDataByProduct(saleData, 'quantity');
  const inventoryByProduct = groupDataByProduct(inventoryData, 'current_stock');

  const createBarData = (title, labels, data) => ({
    labels,
    datasets: [
      {
        label: title,
        data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  });

  const purchaseBarData = createBarData('Purchases by Product', Object.keys(purchasesByProduct), Object.values(purchasesByProduct));
  const saleBarData = createBarData('Sales by Product', Object.keys(salesByProduct), Object.values(salesByProduct));
  const inventoryBarData = createBarData('Inventory Stock by Product', Object.keys(inventoryByProduct), Object.values(inventoryByProduct));

  const handleDownload = () => {
    const wb = XLSX.utils.book_new();

    // Add purchase data to the Excel file
    const purchaseDataSheet = purchaseData.map(purchase => ({
      'Product Name': purchase.product_name,
      'Quantity': purchase.quantity,
      'Order Price': purchase.order_price,
      'Purchase Date': purchase.purchase_date,
    }));
    const ws1 = XLSX.utils.json_to_sheet(purchaseDataSheet);
    XLSX.utils.book_append_sheet(wb, ws1, 'Purchases');

    // Add sale data to the Excel file
    const saleDataSheet = saleData.map(sale => ({
      'Product Name': sale.product_name,
      'Quantity': sale.quantity,
      'Retail Price': sale.retail_price,
      'Sale Date': sale.sale_date,
    }));
    const ws2 = XLSX.utils.json_to_sheet(saleDataSheet);
    XLSX.utils.book_append_sheet(wb, ws2, 'Sales');

    // Add inventory data to the Excel file
    const inventoryDataSheet = inventoryData.map(inventory => ({
      'Product Name': inventory.product_name,
      'Current Stock': inventory.current_stock,
      'Shop Name': inventory.shop_name,
    }));
    const ws3 = XLSX.utils.json_to_sheet(inventoryDataSheet);
    XLSX.utils.book_append_sheet(wb, ws3, 'Inventories');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'DashboardData.xlsx');
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
        <Button variant="contained" color="primary" onClick={() => navigate('/dashboard/inventories/view')}>
          Reconcile Inventory
        </Button>
        <Button variant="contained" color="primary" onClick={handleDownload}>
          Download Data
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
      </Grid>
    </Box>
  );
};

export default Overview;

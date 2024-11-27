import React, { useEffect, useState } from 'react';
import axiosInstance from '../AxiosInstance';
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
  const [purchasesData, setPurchasesData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [productColors, setProductColors] = useState({});

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const response = await axiosInstance.get('/overview');
        const { finalProfits, totalQuantities } = response.data;

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

        const processedPurchases = totalQuantities.purchases.map((item) => ({
          productName: `${item.productName}-${item.variety || 'Unknown Variety'}`,
          productId: item.productId,
          totalQuantity: item.totalQuantity,
        }));

        const processedSales = totalQuantities.sales.map((item) => ({
          productName: `${item.productName}-${item.variety || 'Unknown Variety'}`,
          productId: item.productId,
          totalQuantity: item.totalQuantity,
        }));

        setPurchasesData(processedPurchases);
        setSalesData(processedSales);

        const allProducts = [
          ...products,
          ...processedPurchases,
          ...processedSales,
        ];
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
      } catch (error) {
        console.error('Error fetching overview data:', error);
      }
    };

    fetchOverviewData();
  }, []);

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
        `/overview/calculate-profit?profitPerInventoryUnit=${product.profit}&inventoryUnitId=${product.inventoryUnitId}&selectedUnitId=${selectedUnitId}`
      );
      setConvertedProfits((prev) => ({
        ...prev,
        [productId]: response.data.profit,
      }));
    } catch (error) {
      console.error('Error converting profit:', error);
    }
  };

  const truncateLabel = (label) => (label.length > 5 ? `${label.substring(0, 5)}...` : label);

  const prepareChartData = (data, label) => ({
    labels: data.map((item) => truncateLabel(item.productName)),
    datasets: [
      {
        label,
        data: data.map((item) => convertedProfits[item.productId] || item.profit),
        backgroundColor: data.map((item) => productColors[item.productId]),
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
  };

  return (
    <Box sx={{ padding: 2 }}>
      {/* Buttons */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 3 }}>
        <Button variant="contained" color="primary">
          Add Purchase
        </Button>
        <Button variant="contained" color="secondary">
          Add Sale
        </Button>
        <Button variant="contained" color="info">
          Manage Inventory
        </Button>
        <Button variant="contained" color="success">
          Generate Report
        </Button>
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
                  item.profitLastWeek === 'N/A' ? 0 : item.profitLastWeek
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
                      value={selectedUnits[product.productId] || ''}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Purchases Chart */}
      <Box sx={{ height: 400, marginBottom: 4 }}>
        <Typography variant="h6" gutterBottom>
          Purchases by Product
        </Typography>
        <Bar data={prepareChartData(purchasesData, 'Total Purchases')} options={chartOptions} />
      </Box>

      {/* Sales Chart */}
      <Box sx={{ height: 400, marginBottom: 4 }}>
        <Typography variant="h6" gutterBottom>
          Sales by Product
        </Typography>
        <Bar data={prepareChartData(salesData, 'Total Sales')} options={chartOptions} />
      </Box>
    </Box>
  );
};

export default Overview;

import React, { useState, useEffect } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import { Button, Badge } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import StoreIcon from '@mui/icons-material/Store';
import BarChartIcon from '@mui/icons-material/BarChart';
import LayersIcon from '@mui/icons-material/Layers';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CategoryIcon from '@mui/icons-material/Category';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import axiosInstance from '../AxiosInstance';
import insightsService from '../services/insightsService';
import { useShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';
import { ListSubheader } from '@mui/material';
import { jwtDecode } from 'jwt-decode';

const MainListItems = ({ onItemClick }) => {
  const { shopCount, setShopCount } = useShopContext();
  const [openProducts, setOpenProducts] = useState(false);
  const [openUnits, setOpenUnits] = useState(false);
  const [openShops, setOpenShops] = useState(false);
  const [openInventories, setOpenInventories] = useState(false);
  const [openMarkets, setOpenMarkets] = useState(false);
  const [openPurchases, setOpenPurchases] = useState(false);
  const [openSuppliers, setOpenSuppliers] = useState(false);
  const [openSales, setOpenSales] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [insightNotificationCount, setInsightNotificationCount] = useState(0);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    setIsAdmin(role === 'admin');

    // Extract userId from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const extractedUserId = decoded.id || decoded.userId || decoded.user_id;
        setUserId(extractedUserId);
        console.log('ListItems - Extracted userId:', extractedUserId); // Debug log
      } catch (error) {
        console.error('Invalid token in ListItems:', error);
      }
    }

    const fetchShops = async () => {
      try {
        const response = await axiosInstance.get('/shops');
        setShopCount(response.data.length);
      } catch (error) {
        console.error('Error fetching shops:', error);
      }
    };

    fetchShops();
  }, [setShopCount]);

  // Separate useEffect for insights checking when userId is available
  useEffect(() => {
    if (!userId || isAdmin) return;

    const checkInsightNotifications = async () => {
      try {
        console.log('Checking notifications for userId:', userId); // Debug log
        const count = await insightsService.getNotificationCount(userId);
        setInsightNotificationCount(count);
      } catch (error) {
        console.error('Error checking insight notifications:', error);
      }
    };

    checkInsightNotifications();

    // Set up periodic check for new insights
    const unsubscribe = insightsService.subscribeToUpdates(userId, ({ hasNewInsights }) => {
      setInsightNotificationCount(hasNewInsights ? 1 : 0);
    });

    return unsubscribe;
  }, [userId, isAdmin]);

  const handleProductsClick = () => {
    setOpenProducts(!openProducts);
  };

  const handleExport = async () => {
    try {
        const response = await axiosInstance.get('/admin/export-full-database', {
            responseType: 'blob', // Ensure proper file download
        });

        // Create a blob link for download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'exported_data.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting data:', error);
    }
};

const handleReportExport = async (filter) => {
  try {
      const response = await axiosInstance.get(`/admin/export-report?filter=${filter}`, { responseType: 'blob' });

      // Create a blob link for download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filter}_report.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  } catch (error) {
      console.error('Error exporting report:', error);
  }
};

  const handleUnitsClick = () => {
    setOpenUnits(!openUnits);
  };

  const handleShopsClick = () => {
    setOpenShops(!openShops);
  };

  const handleInventoriesClick = () => {
    setOpenInventories(!openInventories);
  };

  const handleMarketsClick = () => {
    setOpenMarkets(!openMarkets);
  };

  const handlePurchasesClick = () => {
    setOpenPurchases(!openPurchases);
  };

  const handleSuppliersClick = () => {
    setOpenSuppliers(!openSuppliers);
  };

  const handleSalesClick = () => {
    setOpenSales(!openSales);
  };

  if (isAdmin) {
    return (
      <>
        <ListItem button component={Link} to="/dashboard/admin/users" onClick={() => { console.log("Users link clicked"); onItemClick(); }}>
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Users" />
        </ListItem>
        <ListItem button component={Link} to="/dashboard/admin/users/purchases" onClick={onItemClick}>
          <ListItemIcon>
            <ShoppingCartIcon />
          </ListItemIcon>
          <ListItemText primary="Purchases" />
        </ListItem>
        <ListItem button component={Link} to="/dashboard/admin/users/sales" onClick={onItemClick}>
          <ListItemIcon>
            <BarChartIcon />
          </ListItemIcon>
          <ListItemText primary="Sales" />
        </ListItem>
        <ListItem button onClick={handleExport}>
    <ListItemIcon>
        <FileDownloadIcon />
    </ListItemIcon>
    <ListItemText primary="Export Data" />
</ListItem>
<div>
    <ListSubheader inset>Saved reports</ListSubheader>
    <ListItem button onClick={() => handleReportExport("current_month")}>
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="Current Month" />
        </ListItem>

        <ListItem button onClick={() => handleReportExport("last_quarter")}>
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="Last Quarter" />
        </ListItem>

        <ListItem button onClick={() => handleReportExport("year_end")}>
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="Year-End Sale" />
        </ListItem>
  </div>
      </>
    );
  }

  return (
    <>
      <ListItem button component={Link} to="/dashboard" onClick={onItemClick}>
        <ListItemIcon>
          <BarChartIcon />
        </ListItemIcon>
        <ListItemText primary="Overview" />
      </ListItem>

      <ListItem button component={Link} to="/dashboard/insights" onClick={onItemClick}>
        <ListItemIcon>
          <Badge badgeContent={insightNotificationCount} color="error">
            <TrendingUpIcon />
          </Badge>
        </ListItemIcon>
        <ListItemText primary="Business Insights" />
      </ListItem>

      <ListItem button onClick={handleProductsClick}>
        <ListItemIcon>
          <CategoryIcon />
        </ListItemIcon>
        <ListItemText primary="Products" />
        {openProducts ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={openProducts} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem button component={Link} to="/dashboard/products/add" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Add Product" />
          </ListItem>
          <ListItem button component={Link} to="/dashboard/products/view" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="View Products" />
          </ListItem>
        </List>
      </Collapse>

      <ListItem button onClick={handleUnitsClick}>
        <ListItemIcon>
          <LayersIcon />
        </ListItemIcon>
        <ListItemText primary="Units" />
        {openUnits ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={openUnits} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem button component={Link} to="/dashboard/units/add" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="Add Unit" />
          </ListItem>
          <ListItem button component={Link} to="/dashboard/units/view" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="View Units" />
          </ListItem>
        </List>
      </Collapse>

      <ListItem button onClick={handleInventoriesClick}>
        <ListItemIcon>
          <InventoryIcon />
        </ListItemIcon>
        <ListItemText primary="Inventories" />
        {openInventories ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={openInventories} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem button component={Link} to="/dashboard/inventories/view" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <InventoryIcon />
            </ListItemIcon>
            <ListItemText primary="View Inventory" />
          </ListItem>
        </List>
      </Collapse>
      
      <ListItem button onClick={handlePurchasesClick}>
        <ListItemIcon>
          <LayersIcon />
        </ListItemIcon>
        <ListItemText primary="Purchases" />
        {openPurchases ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={openPurchases} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem button component={Link} to="/dashboard/purchases/add" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="Add Purchase" />
          </ListItem>
          <ListItem button component={Link} to="/dashboard/purchases/view" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="View Purchases" />
          </ListItem>
        </List>
      </Collapse>

      {/* <ListItem button onClick={handleSuppliersClick}>
        <ListItemIcon>
          <LayersIcon />
        </ListItemIcon>
        <ListItemText primary="Sources" />
        {openSuppliers ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={openSuppliers} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem button component={Link} to="/dashboard/suppliers/add" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="Add Source" />
          </ListItem>
          <ListItem button component={Link} to="/dashboard/suppliers/view" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="View Sources" />
          </ListItem>
        </List>
      </Collapse> */}

      <ListItem button onClick={handleSalesClick}>
        <ListItemIcon>
          <LayersIcon />
        </ListItemIcon>
        <ListItemText primary="Sales" />
        {openSales ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={openSales} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem button component={Link} to="/dashboard/sales/add" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="Add Sale" />
          </ListItem>
          <ListItem button component={Link} to="/dashboard/sales/view" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="View Sales" />
          </ListItem>
        </List>
      </Collapse>

      <ListItem button component={Link} to="/dashboard/customertransaction" onClick={onItemClick}>
  <ListItemIcon>
    <ShoppingCartIcon />
  </ListItemIcon>
  <ListItemText primary="Customer Transaction" />
</ListItem>
    </>
  );
};



export { MainListItems};

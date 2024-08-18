import React, { useState, useEffect } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
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
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import axiosInstance from '../AxiosInstance';
import { useShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';
import { ListSubheader } from '@mui/material';

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

  useEffect(() => {
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

  const handleProductsClick = () => {
    setOpenProducts(!openProducts);
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

  return (
    <>
      <ListItem button component={Link} to="/dashboard" onClick={onItemClick}>
        <ListItemIcon>
          <BarChartIcon />
        </ListItemIcon>
        <ListItemText primary="Overview" />
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
          <ListItem button component={Link} to="/dashboard/inventories/add" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <InventoryIcon />
            </ListItemIcon>
            <ListItemText primary="Add Inventory" />
          </ListItem>
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

      <ListItem button onClick={handleSuppliersClick}>
        <ListItemIcon>
          <LayersIcon />
        </ListItemIcon>
        <ListItemText primary="Suppliers" />
        {openSuppliers ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={openSuppliers} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem button component={Link} to="/dashboard/suppliers/add" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="Add Supplier" />
          </ListItem>
          <ListItem button component={Link} to="/dashboard/suppliers/view" sx={{ pl: 4 }} onClick={onItemClick}>
            <ListItemIcon>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText primary="View Suppliers" />
          </ListItem>
        </List>
      </Collapse>

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
    </>
  );
};

const SecondaryListItems = () => (
  <div>
    <ListSubheader inset>Saved reports</ListSubheader>
    <ListItem button>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Current month" />
    </ListItem>
    <ListItem button>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Last quarter" />
    </ListItem>
    <ListItem button>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Year-end sale" />
    </ListItem>
  </div>
);

export { MainListItems, SecondaryListItems };

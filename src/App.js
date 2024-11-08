import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';
import Overview from './pages/Overview';
import AddProduct from './pages/AddProduct';
import ViewProducts from './pages/ViewProducts';
import EditProduct from './pages/EditProduct';
import EditProductOffering from './pages/EditProductOffering';
import AddInventory from './pages/AddInventory';
import EditInventory from './pages/EditInventory';
import ViewInventory from './pages/ViewInventory';
import AddShop from './pages/AddShop';
import EditShop from './pages/EditShop';
import ViewShops from './pages/ViewShops';
import AddUnit from './pages/AddUnit';
import ViewUnits from './pages/ViewUnits';
import EditUnit from './pages/EditUnit';
import DashboardLayout from './components/DashboardLayout';
import AddProductOffering from './pages/AddProductOffering';
import ViewProductOfferings from './pages/ViewProductOfferings';
import AddMarket from './pages/AddMarket';
import EditMarket from './pages/EditMarket';
import ViewMarkets from './pages/ViewMarkets';
import AddPurchase from './pages/AddPurchase';
import EditPurchase from './pages/EditPurchase';
import ViewPurchases from './pages/ViewPurchases';
import AddSupplier from './pages/AddSupplier';
import EditSupplier from './pages/EditSupplier';
import ViewSuppliers from './pages/ViewSuppliers';
import AddSale from './pages/AddSale';
import EditSale from './pages/EditSale';
import ViewSales from './pages/ViewSales';
import ReconcileInventory from './pages/ReconcileInventory';
import TestPage from './pages/testPage';
import PrivateRoute from './components/PrivateRoute';

// Admin-specific pages
import UserList from './pages/admin/UserList';
import UserDetails from './pages/admin/UserDetails';
import UserPurchases from './pages/admin/UserPurchases';
import UserSales from './pages/admin/UserSales';

import { ShopProvider } from './context/ShopContext';
import theme from './theme';

const App = () => {
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';

  return (
    <ThemeProvider theme={theme}>
      <ShopProvider>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/testpage" element={<TestPage />} />
          <Route path="/register" element={<Register />} />
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardLayout isAdmin={isAdmin} />}>
              <Route index element={<Overview />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/view" element={<ViewProducts />} />
              <Route path="products/edit/:id" element={<EditProduct />} />
              <Route path="inventories/add" element={<AddInventory />} />
              <Route path="inventories/edit/:id" element={<EditInventory />} />
              <Route path="inventories/view" element={<ViewInventory />} />
              <Route path="shops/add" element={<AddShop />} />
              <Route path="shops/edit/:id" element={<EditShop />} />
              <Route path="shops/view" element={<ViewShops />} />
              <Route path="units/add" element={<AddUnit />} />
              <Route path="units/edit/:id" element={<EditUnit />} />
              <Route path="units/view" element={<ViewUnits />} />
              <Route path="productOfferings/add" element={<AddProductOffering />} />
              <Route path="productOfferings/edit/:id" element={<EditProductOffering />} />
              <Route path="productOfferings/view" element={<ViewProductOfferings />} />
              <Route path="markets/add" element={<AddMarket />} />
              <Route path="markets/edit/:id" element={<EditMarket />} />
              <Route path="markets/view" element={<ViewMarkets />} />
              <Route path="purchases/add" element={<AddPurchase />} />
              <Route path="purchases/edit/:id" element={<EditPurchase />} />
              <Route path="purchases/view" element={<ViewPurchases />} />
              <Route path="suppliers/add" element={<AddSupplier />} />
              <Route path="suppliers/edit/:id" element={<EditSupplier />} />
              <Route path="suppliers/view" element={<ViewSuppliers />} />
              <Route path="sales/add" element={<AddSale />} />
              <Route path="sales/edit/:id" element={<EditSale />} />
              <Route path="sales/view" element={<ViewSales />} />
              <Route path="inventories/reconcile/:id" element={<ReconcileInventory />} />

              {/* Admin-specific routes */}
              {isAdmin && (
                <>
                  <Route path="admin/users" element={<UserList />} />
                  <Route path="admin/users/:id/activity" element={<UserDetails />} />
                  <Route path="admin/users/purchases" element={<UserPurchases/>} />
                  <Route path="admin/users/sales" element={<UserSales/>} />
                </>
              )}
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </ShopProvider>
    </ThemeProvider>
  );
};

export default App;

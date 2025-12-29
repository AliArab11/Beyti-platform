import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { SignalRProvider } from './contexts/SignalRContext';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import RegistrationPage from "./Pages/Registration";
import MembershipPage from "./Pages/Membership";
import AddPlanPage from "./Pages/Membership/AddPlan";
import AdminPage from './Pages/Admin/AdminPage';
import ServiceProviderPage from "./Pages/ServiceProvider";
import AdminUsersPage from './Pages/Admin/AdminDash';
import ServiceProviderRequests from './Pages/Admin/ServiceProviderRequests.jsx';
import CustomerPage from "./Pages/Customer";
import SellerPage from "./Pages/Seller";
import MainStoreView from "./Beyti-Website/Store/MainStoreView.jsx";
import HomePage from "./Beyti-Website/Store/HomePage.jsx";
import ServiceProviderStoresView from "./Beyti-Website/Store/ServiceProviderStoresView.jsx";
import ServiceProviderDetailView from "./Beyti-Website/Store/ServiceProviderDetailView.jsx";
import StoreView from "./Beyti-Website/Store/StoreView.jsx";
import ProductPage from "./Beyti-Website/Store/Components/ProductPage.jsx";
import Checkout from "./Beyti-Website/Store/Components/Checkout.jsx";
import StoreDetailsPage from "./Pages/Seller/StoreDetails";
import CustomerDashboardPage from './Beyti-Website/Customer/CustomerDashboard.jsx';

import SellerDashboardLayout from "./Beyti-Website/Seller/SellerDashboard.jsx";
import SellerProductsPage from "./Beyti-Website/Seller/Components/Products.jsx";
import SellerOrdersPage from "./Beyti-Website/Seller/Components/Orders.jsx";
import SellerAnalyticsPage from "./Beyti-Website/Seller/Components/Analytics.jsx";
import SellerReviewsPage from "./Beyti-Website/Seller/Components/Reviews.jsx";

import ProductsPage from "./Pages/Product/Products";
import CategoryPage from "./Pages/Product/Categories";

import DriverPage from "./Pages/Driver";
import DriverDashboardPage from "./Beyti-Website/Driver/DriverDashboard.jsx";

import ServiceProviderDashboard from './Beyti-Website/ServiceProvider/ServiceProviderDashboard';
import DesignSystemDemo from './components/DesignSystemDemo';
import DashboardTemplate from './Pages/DashboardTemplate';
import AdminUserManagementNew from './Pages/Admin/AdminUserManagementNew';
import Login from './Beyti-Website/Registration/Login';
import Register from './Beyti-Website/Registration/Register';
import RoleSelect from './Beyti-Website/Registration/RoleSelect';
import SellerOnboarding from './Beyti-Website/Registration/SellerOnboarding';
import ProviderOnboarding from './Beyti-Website/Registration/ProviderOnboarding';
import DriverOnboarding from './Beyti-Website/Registration/DriverOnboarding';
import AdminView from './Beyti-Website/Admin/AdminView.jsx';
import DashboardRouter from './components/DashboardRouter';
import DriverDashboardPlaceholder from './Beyti-Website/Driver/DriverDashboardPlaceholder';
import AccountSuspended from './Beyti-Website/Auth/AccountSuspended';
import PendingApproval from './components/PendingApproval';

import ProfilePage from './components/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder components for pages that don't exist yet
const PlaceholderPage = ({ pageName }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">{pageName}</h1>
      <p className="text-gray-600">This page is coming soon...</p>
    </div>
  </div>
);

const ProfilePageWrapper = () => {
  // You'll need to get the actual user data here
  // This is a placeholder - adjust based on your auth/state management
  const userProfile = {
    userProfileId: 'user123',
    displayName: 'John Doe',
    phone: '+973 1234 5678',
    address: 'Manama, Bahrain',
    status: 'Active',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z'
  };

  const handleProfileUpdate = async (updates) => {
    console.log('Profile update:', updates);
    // Add your API call here
  };

  return (
    <div className="min-h-screen bg-cream-50 p-6">
      <div className="max-w-7xl mx-auto">
        <ProfilePage
          userProfile={userProfile}
          userRole="Customer" // Change this based on actual user role
          entityId={null}
          onProfileUpdate={handleProfileUpdate}
          readOnly={false}
        />
      </div>
    </div>
  );
};

export default function App() {
 const navItems = [
    // { path: '/', label: 'Registration' },
    { path: '/login', label: 'Login' },
    { path: '/register', label: 'Sign Up' },
    // { path: '/membership', label: 'Membership' },
    // { path: '/addplan', label: 'Add Plan' },
    // { path: '/seller', label: 'Seller' },
    { path: '/seller-dashboard', label: 'Seller Dashboard' },
    { path: '/stores', label: 'Home' },
    { path: '/mainStore', label: 'Seller Stores' },
    { path: '/serviceProviders', label: 'Service Providers' },
    // { path: '/product', label: 'Product' },
    // { path: '/category', label: 'Category' },
    // { path: '/customer', label: 'Customer' },
    // { path: '/driver', label: 'Driver' },
    { path: '/driver-dashboard', label: 'Driver Dashboard' },
    // { path: '/admin', label: 'Admin' },
    // { path: '/serviceprovider', label: 'Service Provider' },
    { path: '/serviceprovider-dashboard', label: 'SP Dashboard' },
    { path: '/admin-view', label: 'Admin Dashboard' },
    // { path: '/notification', label: 'Notification' },
    // { path: '/admindashboard', label: 'Admin Dash (Old)'},
    // { path: '/servicerequest', label: 'Service Request'},
    // { path: '/design-demo', label: 'Design Demo'},
    // { path: '/dashboard-template', label: 'Dashboard Template'},
    // { path: '/user-management', label: 'User Management (New)'}
  ];
  return (
    <ThemeProvider>
      <SignalRProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-md sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  {/* Logo/Brand */}
                  <div className="flex-shrink-0">
                    <h1 className="text-2xl font-bold text-blue-600">Beyti Platform</h1>
                  </div>

                  {/* Navigation Items */}
                  <div className="hidden md:flex items-center space-x-1">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>

                  {/* Mobile Menu Button */}
                  <div className="md:hidden">
                    <button
                      onClick={() => {
                        const menu = document.getElementById('mobile-menu');
                        menu.classList.toggle('hidden');
                      }}
                      className="text-gray-700 hover:text-blue-600 focus:outline-none"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Menu */}
              <div id="mobile-menu" className="hidden md:hidden bg-white border-t border-gray-200">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        document.getElementById('mobile-menu').classList.add('hidden');
                      }}
                      className={({ isActive }) =>
                        `block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </nav>

            {/* Page Content */}
            <main>
              <Routes>
                <Route path="/" element={<RegistrationPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/role-selection" element={<RoleSelect />} />
                <Route path="/seller-onboarding" element={<SellerOnboarding />} />
                <Route path="/provider-onboarding" element={<ProviderOnboarding />} />
                <Route path="/driver-onboarding" element={<DriverOnboarding />} />
                <Route path="/membership" element={<MembershipPage />} />
                <Route path="/addplan" element={<AddPlanPage />} />
                <Route path="/seller" element={<SellerPage />} />

                <Route path="/seller-dashboard" element={<SellerDashboardLayout />}>
                  <Route index element={<SellerAnalyticsPage />} />
                  <Route path="dashboard" element={<SellerAnalyticsPage />} />
                  <Route path="orders" element={<SellerOrdersPage />} />
                  <Route path="products" element={<SellerProductsPage />} />
                  <Route path="analytics" element={<SellerAnalyticsPage />} />
                  <Route path="reviews" element={<SellerReviewsPage />} />
                  <Route path="notifications" element={<div />} />
                  <Route path="profile" element={<div />} />
                </Route>

                <Route path="/customer-dashboard" element={<CustomerDashboardPage />}>
                  <Route index element={<div />} />
                  <Route path="bookings" element={<div />} />
                  <Route path="history" element={<div />} />
                  <Route path="notifications" element={<div />} />
                  <Route path="profile" element={<div />} />
                </Route>

                <Route path="/checkout" element={<Checkout />} />


                <Route path="/stores" element={<HomePage />} />
                <Route path="/mainStore" element={<MainStoreView />} />
                <Route path="/serviceProviders" element={<ServiceProviderStoresView />} />
                <Route path="/service-provider/:providerId" element={<ServiceProviderDetailView />} />
                <Route path="/store/:storeId" element={<StoreView />} />
                <Route path="/store/:storeId/product/:productId" element={<ProductPage />} />
                <Route path="/store/:id" element={<StoreDetailsPage />} />
                <Route path="/product" element={<ProductsPage />} />
                <Route path="/category" element={<CategoryPage />} />
                <Route path="/customer" element={<CustomerPage />} />

                <Route path="/driver" element={<DriverPage />} />
                <Route path="/driver-dashboard" element={<DriverDashboardPage />}>
                  <Route index element={<div />} />
                  <Route path="dashboard" element={<div />} />
                  <Route path="orders" element={<div />} />
                  <Route path="analytics" element={<div />} />
                  <Route path="notifications" element={<div />} />
                  <Route path="profile" element={<div />} />
                </Route>

                <Route path="/admin" element={<AdminPage />} />
                <Route path="/serviceprovider" element={<ServiceProviderPage />} />
                <Route path="/serviceprovider-dashboard" element={<ServiceProviderDashboard />} />
                <Route path="/account-suspended" element={<AccountSuspended />} />
                <Route path="/admin-view" element={<AdminView />} />
                <Route path="/admindashboard" element={<AdminUsersPage />} />
                <Route path="/servicerequest" element={<ServiceProviderRequests />} />
                <Route path="/notification" element={<PlaceholderPage pageName="Notification" />} />
                <Route path="/design-demo" element={<DesignSystemDemo />} />
                <Route path="/dashboard-template" element={<DashboardTemplate />} />
                <Route path="/user-management" element={<AdminUserManagementNew />} />
                <Route path="/dashboard" element={<DashboardRouter />} />
                <Route path="/driver-placeholder" element={<DriverDashboardPlaceholder />} />
                <Route path="/profile" element={<ProfilePageWrapper />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </SignalRProvider>
    </ThemeProvider>
  );
}
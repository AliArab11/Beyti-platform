import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { CaretUp, CaretDown } from '@phosphor-icons/react';
import { SignalRProvider } from './contexts/SignalRContext';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
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
import ProfilePage from './components/ProfilePage'

// Wrapper to use useNavigate hook
const BrowseAsDropdownWrapper = () => {
  return <BrowseAsDropdown />;
};

// Browse As Dropdown Component
const BrowseAsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('beyti_browse_role') || 'Customer';
  });
  const navigate = useNavigate();

  const roles = [
    { name: 'Customer', path: '/stores', icon: '🛍️' },
    { name: 'Seller', path: '/seller-dashboard', icon: '🏪' },
    { name: 'Driver', path: '/driver-dashboard', icon: '🚗' },
    { name: 'Service Provider', path: '/serviceprovider-dashboard', icon: '🔧' },
    { name: 'Admin', path: '/admin-view', icon: '👨‍💼' }
  ];

  const handleRoleSelect = (role) => {
    setCurrentRole(role.name);
    localStorage.setItem('beyti_browse_role', role.name);
    setIsOpen(false);
    navigate(role.path);
  };

  const getCurrentIcon = () => {
    return roles.find(r => r.name === currentRole)?.icon || '🛍️';
  };

  return (
    <div className="relative">
      {/* Current Role Display Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-6 py-3 bg-cream-50 hover:bg-cream-100 rounded-xl border border-grey-stroke transition-all"
      >
        <span className="text-sm text-charcoal-500 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
          Browsing as:
        </span>
        <span className="text-base font-bold text-sage-600" style={{ fontFamily: 'Inter, sans-serif' }}>
          {getCurrentIcon()} {currentRole}
        </span>
        <svg 
          className={`w-5 h-5 text-charcoal-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-grey-stroke z-50 overflow-hidden">
            <div className="p-3">
              <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wide mb-2 px-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                Select Role
              </p>
              {roles.map((role) => (
                <button
                  key={role.name}
                  onClick={() => handleRoleSelect(role)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentRole === role.name
                      ? 'bg-sage-100 text-sage-700'
                      : 'hover:bg-cream-50 text-charcoal-600'
                  }`}
                >
                  <span className="text-2xl">{role.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {role.name}
                    </p>
                    <p className="text-xs text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {role.name === 'Customer' && 'Browse stores & services'}
                      {role.name === 'Seller' && 'Manage your store'}
                      {role.name === 'Driver' && 'View delivery orders'}
                      {role.name === 'Service Provider' && 'Manage services'}
                      {role.name === 'Admin' && 'Platform administration'}
                    </p>
                  </div>
                  {currentRole === role.name && (
                    <svg className="w-5 h-5 text-sage-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Navbar with Show/Hide Toggle
const NavbarWithToggle = () => {
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem('beyti_navbar_visible');
    return saved === null ? true : saved === 'true';
  });

  const toggleNavbar = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem('beyti_navbar_visible', newState.toString());
  };

  return (
    <>
      {isVisible ? (
       <nav className="sticky top-0 z-50 border-b" style={{ backgroundColor: '#FAF7F2', borderColor: '#D4D4D4' }}>
          <div className="max-w-5xl mx-auto px-8 py-2">
            <div className="flex items-center justify-between">
              {/* Logo/Brand */}
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-sage-600" style={{ fontFamily: 'Merriweather, serif' }}>
                  Beyti Platform
                </h1>
              </div>

              <div className="flex items-center gap-4">
                {/* Browse As Dropdown */}
                <BrowseAsDropdownWrapper />
              </div>
            </div>
          </div>

          {/* Arrow Toggle Button - 35% from left */}
          <div className="flex justify-start">
            <button
              onClick={toggleNavbar}
              className="relative -mb-3 bg-white hover:bg-cream-50 p-2 rounded-full shadow-md transition-all border"
              style={{ borderColor: '#D4D4D4', marginLeft: '35%' }}
              title="Hide navbar"
            >
              <CaretUp size={20} weight="bold" className="text-sage-600" />
            </button>
          </div>
        </nav>
      ) : (
        // Show Button (when navbar is hidden) - 35% from left
        <div className="fixed top-0 z-50" style={{ left: '35%', transform: 'translateX(-50%)' }}>
          <button
            onClick={toggleNavbar}
            className="mt-2 bg-white hover:bg-cream-50 p-2 rounded-full shadow-lg transition-all border"
            style={{ borderColor: '#D4D4D4' }}
            title="Show navbar"
          >
            <CaretDown size={20} weight="bold" className="text-sage-600" />
          </button>
        </div>
      )}
    </>
  );
};

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
//  const navItems = [
//     // { path: '/', label: 'Registration' },
//     { path: '/login', label: 'Login' },
//     { path: '/register', label: 'Sign Up' },
//     // { path: '/membership', label: 'Membership' },
//     // { path: '/addplan', label: 'Add Plan' },
//     // { path: '/seller', label: 'Seller' },
//     { path: '/seller-dashboard', label: 'Seller Dashboard' },
//     { path: '/stores', label: 'Home Page' },
//     { path: '/mainStore', label: 'Seller Stores' },
//     { path: '/serviceProviders', label: 'Service Providers' },
//     // { path: '/product', label: 'Product' },
//     // { path: '/category', label: 'Category' },
//     // { path: '/customer', label: 'Customer' },
//     // { path: '/driver', label: 'Driver' },
//     { path: '/driver-dashboard', label: 'Driver Dashboard' },
//     // { path: '/admin', label: 'Admin' },
//     // { path: '/serviceprovider', label: 'Service Provider' },
//     { path: '/serviceprovider-dashboard', label: 'SP Dashboard' },
//     { path: '/admin-view', label: 'Admin Dashboard' },
//     // { path: '/notification', label: 'Notification' },
//     // { path: '/admindashboard', label: 'Admin Dash (Old)'},
//     // { path: '/servicerequest', label: 'Service Request'},
//     // { path: '/design-demo', label: 'Design Demo'},
//     // { path: '/dashboard-template', label: 'Dashboard Template'},
//     // { path: '/user-management', label: 'User Management (New)'}
//   ];
  return (
    <ThemeProvider>
      <SignalRProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
           {/* Navigation Bar */}
            <NavbarWithToggle />

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
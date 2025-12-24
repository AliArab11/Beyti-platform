import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Storefront, Star } from '@phosphor-icons/react';
import CustomerHeader from '../../components/CustomerHeader';
import ActiveOrderBanner from './Components/ActiveOrderBanner';
import { isStoreOpen } from '../Seller/Components/storeStatus';
import { getUserProfileId, getUserRole, isLoggedIn, logout } from '../../utils/auth';

const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredStores, setFeaturedStores] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Customer state
  const [customerId, setCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showBrowseOnlyBanner, setShowBrowseOnlyBanner] = useState(false);

  useEffect(() => {
    // Load logged-in user's data automatically
    const userProfileId = getUserProfileId();
    const userName = localStorage.getItem('userName') || 'User';
    const userRole = getUserRole();
    const authenticated = isLoggedIn();

    console.log('[HomePage] User auth status:', { authenticated, userProfileId, userName, userRole });

    if (authenticated && userProfileId) {
      // Use logged user's profile as customer
      setCustomerId(userProfileId);
      setCustomerName(userName);

      // Save to sessionStorage for compatibility with other components
      sessionStorage.setItem('beyti_customerId', userProfileId.toString());
      sessionStorage.setItem('beyti_customerName', userName);
      sessionStorage.setItem('beyti_userProfileId', userProfileId.toString());

      // Show browse-only banner for non-Customer roles
      if (userRole && userRole !== 'Customer') {
        setShowBrowseOnlyBanner(true);
        console.log(`[HomePage] User is ${userRole}, showing browse-only mode`);
      }
    }

    // Fetch categories
    fetch('https://localhost:7062/api/Categories')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load categories:', err));

    // Fetch stores for carousel
    fetch('https://localhost:7062/api/Sellers')
      .then(res => res.json())
      .then(data => setFeaturedStores(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(err => console.error('Failed to load stores:', err));
  }, []);

  // Fetch customer orders
  useEffect(() => {
    if (!customerId) {
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`https://localhost:7062/api/Orders?customerId=${customerId}`);
        if (response.ok) {
          const data = await response.json();
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setOrders([]);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [customerId]);

  // Load banner dismissed state
  useEffect(() => {
    if (customerId) {
      const dismissed = localStorage.getItem(`beyti_bannerDismissed_${customerId}`) === 'true';
      setBannerDismissed(dismissed);
    }
  }, [customerId]);

  // Update cart when customer changes
  useEffect(() => {
    if (!customerId) {
      setCart([]);
      return;
    }

    const updateCart = () => {
      try {
        let allItems = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
            const savedCart = localStorage.getItem(key);
            if (savedCart) {
              const parsedCart = JSON.parse(savedCart);
              if (parsedCart.length > 0) {
                allItems = parsedCart;
                break;
              }
            }
          }
        }
        setCart(allItems);
      } catch (err) {
        console.error('Error updating cart:', err);
      }
    };

    updateCart();
    const interval = setInterval(updateCart, 500);
    return () => clearInterval(interval);
  }, [customerId]);

  // Auto-scroll carousel
  useEffect(() => {
    if (featuredStores.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.max(1, featuredStores.length - 3));
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredStores.length]);

  const handleCustomerLogout = () => {
    // Clear sessionStorage
    sessionStorage.removeItem('beyti_customerId');
    sessionStorage.removeItem('beyti_customerName');
    sessionStorage.removeItem('beyti_userProfileId');

    // Clear customer-specific localStorage data
    if (customerId) {
      localStorage.removeItem(`beyti_activeOrder_${customerId}`);
      localStorage.removeItem(`beyti_bannerDismissed_${customerId}`);
    }

    // Clear all auth data from localStorage
    logout();

    // Reset state
    setCustomerId(null);
    setCustomerName(null);

    // Redirect to login
    navigate('/login');
  };

  const handleNavigateToStores = () => {
    navigate('/mainStore', { state: { customerId, customerName } });
  };

  const handleNavigateToServices = () => {
    navigate('/serviceProviders', { state: { customerId, customerName } });
  };

  const handleCategoryClick = (categoryId) => {
    navigate('/mainStore', { state: { selectedCategory: categoryId, customerId, customerName } });
  };

  const handleStoreClick = (storeId) => {
    navigate(`/store/${storeId}`, { state: { customerId, customerName } });
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem(`beyti_bannerDismissed_${customerId}`, 'true');
  };

  const handleTrackOrder = () => {
    navigate('/customer-dashboard');
  };

  const getStoreInitials = (storeName) => {
    const words = storeName.split(' ').filter(w => w.length > 0);
    return words.length >= 2 
      ? words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
      : words[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <CustomerHeader
        customerName={customerName}
        customerId={customerId}
        cart={cart}
        stores={featuredStores}
        customerAddresses={[]}
        onLogout={handleCustomerLogout}
        variant="store"
        showSearch={false}
      />

      {/* Browse-Only Banner for non-Customer roles */}
      {showBrowseOnlyBanner && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mx-6 mt-4 rounded-md shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                <strong>Browse-Only Mode:</strong> You are viewing the store as <strong>{getUserRole()}</strong>. Only Customer accounts can place orders.
                {' '}
                <button
                  onClick={() => navigate('/role-selection')}
                  className="underline hover:text-yellow-900 font-semibold"
                >
                  Create Customer Profile
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Order Banner */}
      {(() => {
        const count = orders.filter(o => 
          !['completed', 'cancelled', 'delivered'].includes(o.status?.toLowerCase())
        ).length;
        return count > 0 && !bannerDismissed && (
          <ActiveOrderBanner 
            activeOrderCount={count}
            onTrack={handleTrackOrder}
            onDismiss={handleDismissBanner}
          />
        );
      })()}

      {/* Hero Section */}
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-sage-500 via-sage-600 to-sage-700">
        {/* Animated decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cream-100 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-40px) translateX(-10px); }
            75% { transform: translateY(-20px) translateX(10px); }
          }
        `}</style>

        <div className="max-w-[1400px] mx-auto px-8 py-24 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <span className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold text-sm border border-white/30">
                Welcome to Your Local Marketplace
              </span>
            </div>
            <h1 
              className="text-[72px] font-bold text-white mb-6 leading-tight animate-fade-in" 
              style={{ fontFamily: 'Merriweather, serif' }}
            >
              Discover Beyti
            </h1>
            <p 
              className="text-2xl text-sage-100 max-w-3xl mx-auto leading-relaxed mb-12 animate-fade-in" 
              style={{ fontFamily: 'Inter, sans-serif', animationDelay: '0.2s' }}
            >
              Your trusted marketplace for local stores and services. Support your community, discover quality products, and book reliable services—all in one place.
            </p>
            <div className="flex justify-center gap-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <button
                onClick={handleNavigateToStores}
                className="bg-white text-sage-700 px-12 py-5 rounded-xl font-bold text-lg hover:bg-cream-50 transition-all shadow-2xl hover:scale-110 hover:shadow-white/20 flex items-center gap-3 group"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Explore Stores
                <ArrowRight size={24} weight="bold" className="group-hover:translate-x-2 transition-transform" />
              </button>
              <button
                onClick={handleNavigateToServices}
                className="bg-transparent border-2 border-white text-white px-12 py-5 rounded-xl font-bold text-lg hover:bg-white hover:text-sage-700 transition-all backdrop-blur-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Browse Services
              </button>
            </div>
          </div>
        </div>

        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="#FAF7F2"/>
          </svg>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="max-w-[1400px] mx-auto px-8 -mt-16 relative z-20 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Local Stores Section */}
          <div onClick={handleNavigateToStores} className="bg-white rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] hover:shadow-[0_30px_80px_rgba(85,107,92,0.3)] transition-all duration-500 hover:scale-[1.03] cursor-pointer group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sage-500/10 rounded-full blur-3xl group-hover:bg-sage-500/20 transition-all"></div>
            <div className="p-12 pb-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-sage-100 rounded-full mb-4">
                <Storefront size={20} className="text-sage-600" weight="bold" />
                <span className="text-sm font-bold text-sage-700" style={{ fontFamily: 'Inter, sans-serif' }}>STORES</span>
              </div>
              <h3 
                className="text-[36px] font-bold text-charcoal-600 mb-4 group-hover:text-sage-700 transition-colors duration-300" 
                style={{ fontFamily: 'Merriweather, serif' }}
              >
                Shop from Local Stores
              </h3>
              <p 
                className="text-xl text-charcoal-400 group-hover:text-charcoal-600 transition-colors duration-300 leading-relaxed" 
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Discover fresh food, stylish clothing, unique gifts, and so much more from trusted local businesses
              </p>
            </div>

            <div className="w-full overflow-hidden relative" style={{ height: '380px' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-all"></div>
              <img 
                src="/images/BeytiStoreSection.jpeg" 
                alt="Local stores illustration"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                style={{ objectPosition: 'center' }}
              />
            </div>

            <div className="p-12 pt-8 flex justify-center">
              <button
                onClick={handleNavigateToStores}
                className="bg-sage-500 text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-sage-700 transition-all duration-300 flex items-center gap-3 group-hover:gap-4 hover:shadow-[0_8px_30px_rgba(85,107,92,0.5)] group/btn"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                View All Stores
                <ArrowRight size={24} className="transition-transform duration-300 group-hover/btn:translate-x-2" weight="bold" />
              </button>
            </div>
          </div>

          {/* Service Providers Section */}
          <div onClick={handleNavigateToServices} className="bg-white rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] hover:shadow-[0_30px_80px_rgba(91,155,213,0.3)] transition-all duration-500 hover:scale-[1.03] cursor-pointer group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="p-12 pb-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: '#E3F2FD' }}>
                <Star size={20} className="text-blue-600" weight="fill" />
                <span className="text-sm font-bold text-blue-700" style={{ fontFamily: 'Inter, sans-serif' }}>SERVICES</span>
              </div>
              <h3 
                className="text-[36px] font-bold text-charcoal-600 mb-4 group-hover:text-blue-600 transition-colors duration-300" 
                style={{ fontFamily: 'Merriweather, serif' }}
              >
                Book Local Services
              </h3>
              <p 
                className="text-xl text-charcoal-400 group-hover:text-charcoal-600 transition-colors duration-300 leading-relaxed" 
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Access on-demand and scheduled services from verified professionals in your community
              </p>
            </div>

            <div className="w-full overflow-hidden relative" style={{ height: '380px' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-all"></div>
              <img 
                src="/images/ServiceProvidersSection.jpeg" 
                alt="Service providers illustration"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                style={{ objectPosition: 'center' }}
              />
            </div>

            <div className="p-12 pt-8 flex justify-center">
              <button
                onClick={handleNavigateToServices}
                className="text-white px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-3 group-hover:gap-4 hover:shadow-[0_8px_30px_rgba(91,155,213,0.5)] group/btn"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  backgroundColor: '#5B9BD5'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4A8AC4'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5B9BD5'}
              >
                View All Services
                <ArrowRight size={24} className="transition-transform duration-300 group-hover/btn:translate-x-2" weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Stores Carousel */}
      <section className="w-full px-8 py-24 bg-gradient-to-b from-white to-cream-50">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-5 py-2 bg-sage-100 text-sage-700 rounded-full text-sm font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                 FEATURED
              </span>
            </div>
            <h2 
              className="text-[48px] font-bold text-charcoal-600 mb-4" 
              style={{ fontFamily: 'Merriweather, serif' }}
            >
              Popular Stores Near You
            </h2>
            <p 
              className="text-xl text-charcoal-400 max-w-2xl mx-auto" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Discover the most loved local businesses in your community
            </p>
          </div>

          {featuredStores.length > 0 && (
            <>
              <div className="relative">
                <button
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                  className="absolute -left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-sage-500 hover:bg-sage-600 rounded-full shadow-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="overflow-hidden">
                  <div 
                    className="flex gap-6 transition-transform duration-500"
                    style={{ transform: `translateX(-${currentSlide * (100 / 4)}%)` }}
                  >
                    {featuredStores.map((store) => (
                      <div
                        key={store.id}
                        onClick={() => handleStoreClick(store.id)}
                        className="flex-shrink-0 w-[calc(25%-18px)] bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer group"
                      >
                        <div className="relative h-48 bg-gradient-to-br from-cream-100 to-cream-200 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent group-hover:from-black/20 transition-all"></div>
                          <div className="absolute top-4 left-4 z-10">
                            <div className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-sm ${
                              isStoreOpen(store) ? 'bg-success-btn/90 text-white' : 'bg-error-btn/90 text-white'
                            }`}>
                              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                              {isStoreOpen(store) ? 'OPEN NOW' : 'CLOSED'}
                            </div>
                          </div>
                          
                          <div className="absolute -bottom-10 left-5">
                            <div className="w-20 h-20 rounded-2xl border-4 border-white flex items-center justify-center overflow-hidden bg-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                              {store.storeImageUrl ? (
                                <img 
                                  src={`https://localhost:7062${store.storeImageUrl}`}
                                  alt={store.storeName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sage-100 to-sage-200">
                                  <span className="text-lg font-black text-sage-700">
                                    {getStoreInitials(store.storeName)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-12 px-6 pb-6">
                          <h3 className="font-bold text-charcoal-600 text-lg mb-3 truncate group-hover:text-sage-600 transition-colors" style={{ fontFamily: 'Merriweather, serif' }}>
                            {store.storeName}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {store.averageRating ? (
                              <>
                                {[0,1,2,3,4].map(i => {
                                  const fillPercentage = Math.max(0, Math.min(100, (store.averageRating - i) * 100));
                                  return (
                                    <div key={i} className="relative w-4 h-4">
                                      <Star size={16} className="text-grey-stroke absolute" weight="fill" />
                                      <div className="overflow-hidden absolute" style={{ width: `${fillPercentage}%` }}>
                                        <Star size={16} className="text-sage-500" weight="fill" />
                                      </div>
                                    </div>
                                  );
                                })}
                                <span className="text-sm font-bold text-charcoal-600 ml-1">
                                  {store.averageRating.toFixed(1)}
                                </span>
                              </>
                            ) : (
                              <span className="px-3 py-1.5 bg-sage-500 text-white text-xs font-bold rounded-full">
                                NEW STORE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setCurrentSlide(Math.min(featuredStores.length - 4, currentSlide + 1))}
                  disabled={currentSlide >= featuredStores.length - 4}
                  className="absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-sage-500 hover:bg-sage-600 rounded-full shadow-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: Math.max(1, featuredStores.length - 3) }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all ${
                        currentSlide === idx ? 'bg-sage-500 w-8' : 'bg-grey-stroke w-2'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center mt-16">
                <button
                  onClick={handleNavigateToStores}
                  className="bg-sage-500 text-white px-14 py-5 rounded-xl font-bold text-lg hover:bg-sage-600 transition-all shadow-xl hover:scale-110 hover:shadow-sage-500/30 inline-flex items-center gap-3 group"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  View All Stores
                  <ArrowRight size={24} weight="bold" className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why Choose Beyti Section */}
      <section className="w-full px-8 py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sage-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cream-200/50 rounded-full blur-3xl"></div>
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="px-5 py-2 bg-sage-100 text-sage-700 rounded-full text-sm font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                 WHY CHOOSE US
              </span>
            </div>
            <h2 
              className="text-[48px] font-bold text-charcoal-600 mb-4" 
              style={{ fontFamily: 'Merriweather, serif' }}
            >
              The Beyti Difference
            </h2>
            <p 
              className="text-xl text-charcoal-400 max-w-2xl mx-auto" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Your trusted partner for local shopping and services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-white to-cream-50 rounded-3xl p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(85,107,92,0.15)] transition-all duration-300 hover:scale-105 group border border-grey-stroke/50">
              <div className="w-24 h-24 bg-gradient-to-br from-sage-400 to-sage-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-lg">
                <Storefront size={48} className="text-white" weight="bold" />
              </div>
              <h3 className="text-3xl font-bold text-charcoal-600 mb-5" style={{ fontFamily: 'Merriweather, serif' }}>
                Local First
              </h3>
              <p className="text-lg text-charcoal-400 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                Support your community by shopping from trusted local businesses. Every purchase makes a difference.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-white to-cream-50 rounded-3xl p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(85,107,92,0.15)] transition-all duration-300 hover:scale-105 group border border-grey-stroke/50">
              <div className="w-24 h-24 bg-gradient-to-br from-sage-400 to-sage-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-lg">
                <Star size={48} className="text-white" weight="fill" />
              </div>
              <h3 className="text-3xl font-bold text-charcoal-600 mb-5" style={{ fontFamily: 'Merriweather, serif' }}>
                Quality Assured
              </h3>
              <p className="text-lg text-charcoal-400 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                All vendors are carefully verified for quality, reliability, and customer satisfaction.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-white to-cream-50 rounded-3xl p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(85,107,92,0.15)] transition-all duration-300 hover:scale-105 group border border-grey-stroke/50">
              <div className="w-24 h-24 bg-gradient-to-br from-sage-400 to-sage-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-lg">
                <ArrowRight size={48} className="text-white" weight="bold" />
              </div>
              <h3 className="text-3xl font-bold text-charcoal-600 mb-5" style={{ fontFamily: 'Merriweather, serif' }}>
                Easy & Fast
              </h3>
              <p className="text-lg text-charcoal-400 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                Browse, order, and book services with just a few clicks. Shopping made simple.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
<footer className="w-full px-8 py-12 bg-charcoal-700">
  <div className="max-w-[1400px] mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
      <div>
        <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Merriweather, serif' }}>Beyti</h3>
        <p className="text-charcoal-300 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
          Your trusted local marketplace for stores and services.
        </p>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Quick Links</h4>
        <ul className="space-y-2">
          <li><button onClick={handleNavigateToStores} className="text-charcoal-300 hover:text-white text-sm transition-colors">Browse Stores</button></li>
          <li><button onClick={handleNavigateToServices} className="text-charcoal-300 hover:text-white text-sm transition-colors">Browse Services</button></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Support</h4>
        <ul className="space-y-2">
          <li><a href="#" className="text-charcoal-300 hover:text-white text-sm transition-colors">Help Center</a></li>
          <li><a href="#" className="text-charcoal-300 hover:text-white text-sm transition-colors">Contact Us</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Legal</h4>
        <ul className="space-y-2">
          <li><a href="#" className="text-charcoal-300 hover:text-white text-sm transition-colors">Privacy Policy</a></li>
          <li><a href="#" className="text-charcoal-300 hover:text-white text-sm transition-colors">Terms of Service</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-charcoal-600 pt-6 text-center">
      <p className="text-charcoal-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
        © 2024 Beyti. All rights reserved.
      </p>
    </div>
  </div>
</footer>
    </div>
  );
};

export default HomePage;
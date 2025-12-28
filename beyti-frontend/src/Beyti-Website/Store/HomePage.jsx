import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Storefront, Star } from '@phosphor-icons/react';
import CustomerHeader from '../../components/CustomerHeader';
import ActiveOrderBanner from './Components/ActiveOrderBanner';
import { isStoreOpen } from '../Seller/Components/storeStatus';
import { StoreBanner } from '../../components/StoreBanner';

// Customer Select Modal
const CustomerSelectModal = ({ isOpen, customers, onSelect, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-cream-50 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-grey-stroke transform transition-all">
        <h2 className="text-2xl font-semibold text-charcoal-700 mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
          Select Customer Account
        </h2>

        <p className="text-sm text-charcoal-400 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          Choose which customer account you want to shop as.
        </p>

        <select
          className="w-full border border-grey-stroke rounded-lg p-3 mb-6 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 text-charcoal-600"
          style={{ fontFamily: 'Inter, sans-serif' }}
          defaultValue=""
          onChange={(e) => {
            const id = e.target.value;
            if (id) {
              const numericId = parseInt(id, 10);
              const selected = customers.find((c) => c.id === numericId);
              onSelect(selected);
            }
          }}
        >
          <option value="">-- Select Customer --</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.fullName || customer.name || `Customer #${customer.id}`}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-grey-300 hover:bg-grey-400 text-charcoal-700 py-2.5 rounded-lg font-semibold transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredStores, setFeaturedStores] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [subcategories, setSubcategories] = useState([]);
  const [favoriteStores, setFavoriteStores] = useState([]);
  
  // Customer state
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Load customer session
    const savedId = sessionStorage.getItem('beyti_customerId');
    const savedName = sessionStorage.getItem('beyti_customerName');
    if (savedId && savedName) {
      setCustomerId(parseInt(savedId));
      setCustomerName(savedName);
    }

    // Fetch customers
    fetch('https://localhost:7062/api/Customers')
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load customers:', err));

    // Fetch categories
    fetch('https://localhost:7062/api/Categories')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load categories:', err));

    // Fetch stores for carousel
    const fetchStores = async () => {
      try {
        const response = await fetch('https://localhost:7062/api/Sellers');
        const sellers = await response.json();
        
        // Fetch products for each seller
        const sellersWithProducts = await Promise.all(
          sellers.map(async (seller) => {
            try {
              const productsRes = await fetch(`https://localhost:7062/api/Sellers/${seller.id}/products`);
              if (productsRes.ok) {
                const productsData = await productsRes.json();
                return { ...seller, products: productsData.products || [] };
              }
              return { ...seller, products: [] };
            } catch (err) {
              return { ...seller, products: [] };
            }
          })
        );
        
        setFeaturedStores(Array.isArray(sellersWithProducts) ? sellersWithProducts : []);
      } catch (err) {
        console.error('Failed to load stores:', err);
      }
    };
    
    fetchStores();
    
    // Fetch subcategories
    fetch('https://localhost:7062/api/SubCategories')
      .then(res => res.json())
      .then(data => setSubcategories(Array.isArray(data) ? data.filter(sub => sub.isActive === true) : []))
      .catch(err => console.error('Failed to load subcategories:', err));
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

  // Fetch favorites when customer changes
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!customerId) {
        setFavoriteStores([]);
        return;
      }

      try {
        const response = await fetch(`https://localhost:7062/api/CustomerFavorites/${customerId}`);
        if (response.ok) {
          const data = await response.json();
          setFavoriteStores(Array.isArray(data) ? data.map(f => f.sellerId) : []);
        } else {
          setFavoriteStores([]);
        }
      } catch (error) {
        console.error("Failed to load favorites:", error);
        setFavoriteStores([]);
      }
    };

    fetchFavorites();
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

  // Auto-scroll carousel - DISABLED to prevent scrolling past stores
  useEffect(() => {
    if (featuredStores.length === 0) return;
    
    // Calculate max slides based on filtered stores
    const popularStores = featuredStores
      .filter(store => {
        const hasActiveProducts = store.products && 
                                 store.products.length > 0 && 
                                 store.products.some(p => p.isActive === true);
        return hasActiveProducts;
      })
      .slice(0, 5);
    
    const maxSlide = Math.max(0, popularStores.length - 4);
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        const next = prev + 1;
        return next > maxSlide ? 0 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredStores]);

  const handleCustomerSelect = (customer) => {
    const name = customer.fullName || customer.name || `Customer #${customer.id}`;
    setCustomerId(customer.id);
    setCustomerName(name);
    setCustomerModalOpen(false);
    
    sessionStorage.setItem('beyti_customerId', customer.id.toString());
    sessionStorage.setItem('beyti_customerName', name);
  };

  const handleCustomerLogout = () => {
    sessionStorage.removeItem('beyti_customerId');
    sessionStorage.removeItem('beyti_customerName');
    setCustomerId(null);
    setCustomerName(null);
    
    if (customerId) {
      localStorage.removeItem(`beyti_activeOrder_${customerId}`);
      localStorage.removeItem(`beyti_bannerDismissed_${customerId}`);
    }
  };

  const handleCustomerClick = () => {
    setCustomerModalOpen(true);
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

  const toggleFavorite = async (sellerId) => {
    if (!customerId) {
      alert('Please login to save favorites');
      return;
    }

    const isFavorited = favoriteStores.includes(sellerId);

    try {
      if (isFavorited) {
        const response = await fetch(
          `https://localhost:7062/api/CustomerFavorites/${customerId}/${sellerId}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          setFavoriteStores(prev => prev.filter(id => id !== sellerId));
        }
      } else {
        const response = await fetch('https://localhost:7062/api/CustomerFavorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, sellerId })
        });

        if (response.ok) {
          setFavoriteStores(prev => [...prev, sellerId]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getStoreInitials = (storeName) => {
    const words = storeName.split(' ').filter(w => w.length > 0);
    return words.length >= 2 
      ? words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
      : words[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <CustomerSelectModal
        isOpen={customerModalOpen}
        customers={customers}
        onSelect={handleCustomerSelect}
        onClose={() => setCustomerModalOpen(false)}
      />

      <CustomerHeader
        pageTitle="Home" 
        customerName={customerName}
        customerId={customerId}
        cart={cart}
        stores={featuredStores}
        customerAddresses={[]}
        onCustomerClick={handleCustomerClick}
        onLogout={handleCustomerLogout}
        variant="store"
        showSearch={false}
      />

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
      <section className="w-full px-8 py-16" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block mb-3">
              <span className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#E8F0EB', color: '#556B5C' }}>
                ✨ FEATURED
              </span>
            </div>
            <h2 
              className="text-4xl font-bold text-charcoal-600 mb-3" 
              style={{ fontFamily: 'Merriweather, serif' }}
            >
              Featured Stores
            </h2>
            <p 
              className="text-base text-charcoal-400 max-w-xl mx-auto" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Discover the most loved local businesses in your community
            </p>
          </div>

          {featuredStores.length > 0 && (() => {
            // Filter and sort stores
            const popularStores = featuredStores
              .filter(store => {
                const hasActiveProducts = store.products && 
                                         store.products.length > 0 && 
                                         store.products.some(p => p.isActive === true);
                return hasActiveProducts;
              })
              .sort((a, b) => {
                const aRecentOrders = (a.recentCompletedOrders || 0);
                const bRecentOrders = (b.recentCompletedOrders || 0);
                
                if (aRecentOrders !== bRecentOrders) {
                  return bRecentOrders - aRecentOrders;
                }
                
                const ratingA = a.averageRating || 0;
                const ratingB = b.averageRating || 0;
                return ratingB - ratingA;
              })
              .slice(0, 5);

            return (
              <>
                <div className="relative mb-4">
                  <button
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0 || popularStores.length <= 4}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-cream-50 transition-all disabled:opacity-30"
                  >
                    <svg className="w-5 h-5 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="overflow-hidden px-12 py-3">
                    <div className="flex gap-6 transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * (100 / 4)}%)` }}>
                      {popularStores.map((store) => (
                        <div 
                          key={store.id}
                          onClick={() => handleStoreClick(store.id)}
                          className="flex-shrink-0 w-[calc(25%-18px)] bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all cursor-pointer"
                        >
                          <div className="relative h-32">
                            <div className="absolute inset-0 overflow-hidden z-0">
                              <StoreBanner
                                storeName={store.storeName}
                                storeImageUrl={store.storeImageUrl ? `https://localhost:7062${store.storeImageUrl}` : null}
                                bannerThemeKey={store.bannerThemeKey || 'modern-gradient'}
                                bannerAccentColor={store.bannerAccentColor || '#F97316'}
                                variant="card"
                              />
                            </div>
                            
                            <div className="absolute top-3 left-3">
                              <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
                                isStoreOpen(store) ? 'bg-success-btn text-white' : 'bg-error-btn text-white'
                              }`}>
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                {isStoreOpen(store) ? 'OPEN' : 'CLOSED'}
                              </div>
                            </div>

                            {customerId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(store.id);
                                }}
                                className="absolute top-3 right-3 w-9 h-9 bg-white hover:bg-cream-50 rounded-full flex items-center justify-center shadow-md transition-all z-10"
                              >
                                <Star 
                                  size={20} 
                                  weight={favoriteStores.includes(store.id) ? 'fill' : 'regular'} 
                                  className={favoriteStores.includes(store.id) ? 'text-error-btn' : 'text-charcoal-400'}
                                />
                              </button>
                            )}
                            
                            <div className="absolute -bottom-8 left-4 z-20">
                              <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] overflow-hidden">
                                {store.storeImageUrl ? (
                                  <img 
                                    src={`https://localhost:7062${store.storeImageUrl}`}
                                    alt={store.storeName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-grey-200 to-grey-300">
                                    <span className="text-lg font-black text-charcoal-600">
                                      {getStoreInitials(store.storeName)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-10 p-4 bg-white">
                            <h3 className="font-bold text-charcoal-600 text-base mb-2" style={{ fontFamily: 'Merriweather, serif' }}>{store.storeName}</h3>
                            <div className="flex items-center gap-1 mb-3">
                              {(() => {
                                const rating = store.averageRating || 0;
                                const hasEnoughReviews = store.averageRating !== null && store.averageRating !== undefined;
                                
                                if (!hasEnoughReviews) {
                                  return (
                                    <span className="px-3 py-1 bg-sage-500 text-white text-xs font-bold rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                                      NEW
                                    </span>
                                  );
                                }
                                
                                return (
                                  <>
                                    {[0,1,2,3,4].map(i => {
                                      const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100));
                                      return (
                                        <div key={i} className="relative w-3.5 h-3.5">
                                          <Star size={14} className="text-grey-stroke absolute" weight="fill" />
                                          <div className="overflow-hidden absolute" style={{ width: `${fillPercentage}%` }}>
                                            <Star size={14} className="text-sage-500" weight="fill" />
                                          </div>
                                        </div>
                                      );
                                    })}
                                    <span className="text-xs font-semibold text-charcoal-600 ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                                      {rating.toFixed(1)}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {(() => {
                                const storeSubcategoryIds = store.subCategoryIds || [];
                                const storeSubcategories = subcategories.filter(sub => storeSubcategoryIds.includes(sub.id));
                                
                                return storeSubcategories.length > 0 ? (
                                  storeSubcategories.slice(0, 2).map(subcat => (
                                    <span key={subcat.id} className="px-3 py-1 bg-cream-100 rounded-full text-xs font-medium text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                                      {subcat.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="px-3 py-1 bg-grey-200 rounded-full text-xs font-medium text-charcoal-400 italic" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    No categories
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentSlide(Math.min(Math.max(0, popularStores.length - 4), currentSlide + 1))}
                    disabled={popularStores.length <= 4 || currentSlide >= Math.max(0, popularStores.length - 4)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-cream-50 transition-all disabled:opacity-30"
                  >
                    <svg className="w-5 h-5 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <div className="flex justify-center gap-2 mt-6">
                    {popularStores.length > 4 && Array.from({ length: Math.max(1, popularStores.length - 3) }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all ${
                          currentSlide === idx ? 'w-8' : 'bg-grey-stroke w-2'
                        }`}
                        style={currentSlide === idx ? { backgroundColor: '#556B5C' } : {}}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center mt-10">
                  <button
                    onClick={handleNavigateToStores}
                    className="text-white px-10 py-4 rounded-xl font-bold text-base transition-all shadow-lg hover:scale-105 inline-flex items-center gap-3 group"
                    style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#556B5C' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#465A4D'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#556B5C'}
                  >
                    View All Stores
                    <ArrowRight size={24} weight="bold" className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </section>

     {/* Why Choose Beyti Section */}
      <section className="w-full px-8 py-24 relative overflow-hidden" style={{ backgroundColor: '#FAF7F2' }}>
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
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-lg" style={{ background: 'linear-gradient(135deg, #6B8E7A 0%, #556B5C 100%)' }}>
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
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-lg" style={{ background: 'linear-gradient(135deg, #6B8E7A 0%, #556B5C 100%)' }}>
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
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-lg" style={{ background: 'linear-gradient(135deg, #6B8E7A 0%, #556B5C 100%)' }}>
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
<footer className="w-full px-8 py-6" style={{ backgroundColor: '#2D2D2D' }}>
  <div className="max-w-[1400px] mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
      <div>
        <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Merriweather, serif' }}>Beyti</h3>
        <p className="text-xs" style={{ fontFamily: 'Inter, sans-serif', color: '#B0B0B0' }}>
          Your trusted local marketplace for stores and services.
        </p>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-2 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Quick Links</h4>
        <ul className="space-y-1">
          <li><button onClick={handleNavigateToStores} className="text-xs transition-colors" style={{ color: '#B0B0B0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'} onMouseLeave={(e) => e.currentTarget.style.color = '#B0B0B0'}>Browse Stores</button></li>
          <li><button onClick={handleNavigateToServices} className="text-xs transition-colors" style={{ color: '#B0B0B0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'} onMouseLeave={(e) => e.currentTarget.style.color = '#B0B0B0'}>Browse Services</button></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-2 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Support</h4>
        <ul className="space-y-1">
          <li><a href="#" className="text-xs transition-colors" style={{ color: '#B0B0B0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'} onMouseLeave={(e) => e.currentTarget.style.color = '#B0B0B0'}>Help Center</a></li>
          <li><a href="#" className="text-xs transition-colors" style={{ color: '#B0B0B0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'} onMouseLeave={(e) => e.currentTarget.style.color = '#B0B0B0'}>Contact Us</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-2 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Legal</h4>
        <ul className="space-y-1">
          <li><a href="#" className="text-xs transition-colors" style={{ color: '#B0B0B0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'} onMouseLeave={(e) => e.currentTarget.style.color = '#B0B0B0'}>Privacy Policy</a></li>
          <li><a href="#" className="text-xs transition-colors" style={{ color: '#B0B0B0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'} onMouseLeave={(e) => e.currentTarget.style.color = '#B0B0B0'}>Terms of Service</a></li>
        </ul>
      </div>
    </div>
    <div className="pt-3 text-center" style={{ borderTop: '1px solid #4D4D4D' }}>
      <p className="text-xs" style={{ fontFamily: 'Inter, sans-serif', color: '#B0B0B0' }}>
        © 2025 Beyti. All rights reserved.
      </p>
    </div>
  </div>
</footer>
    </div>
  );
};

export default HomePage;
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Cake, Heart, Star, MagnifyingGlass, ArrowLeft, Bread, ShoppingCartSimple, X, Package } from "@phosphor-icons/react";
import ProductPage from './Components/ProductPage';
import ProductList from './Components/ProductDetails';  
import Checkout from './Components/Checkout';
import ActiveOrderBanner from './Components/ActiveOrderBanner';
import Snackbar from './../../components/Snackbar';
import PageHeader from '../../components/PageHeader';
import CustomerHeader from '../../components/CustomerHeader';

import OrderDetails from './Components/OrderDetails';
import { createOrder, createOrderItem, getProductVariants, getOrder, getOrders } from '../../services/api';
// Mock API call - replace with your actual API
const getStoreDetails = async (storeId) => {
  try {
    const response = await fetch(`https://localhost:7062/api/Sellers/${storeId}/products`);
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    console.error('Error fetching store:', error);
    return null;
  }
};


// Store Info Section
const StoreInfo = ({ store }) => (
  <div className="bg-cream-50 px-8 py-6">
    <div className="max-w-[1400px] mx-auto">
      
      {/* Main Card Container */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] relative">
        
        {/* Banner Section (Top) */}
        {(() => {
          const storeName = store?.storeName || "Cookies by Maryam";
          const hash = storeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          
          const bannerGradients = [
            'from-[#6366F1]/20 via-[#8B5CF6]/15 to-[#EC4899]/20',
            'from-[#F59E0B]/20 via-[#EF4444]/15 to-[#DC2626]/20',
            'from-[#10B981]/20 via-[#059669]/15 to-[#047857]/20',
            'from-[#3B82F6]/20 via-[#2563EB]/15 to-[#1D4ED8]/20',
            'from-[#EC4899]/20 via-[#DB2777]/15 to-[#BE185D]/20',
            'from-[#8B5CF6]/20 via-[#7C3AED]/15 to-[#6D28D9]/20',
            'from-[#14B8A6]/20 via-[#0D9488]/15 to-[#0F766E]/20',
            'from-[#F97316]/20 via-[#EA580C]/15 to-[#C2410C]/20',
          ];
          
          const accentColors = [
            '#8B5CF6', '#EF4444', '#10B981', '#3B82F6', 
            '#EC4899', '#8B5CF6', '#14B8A6', '#F97316'
          ];
          
          const index = hash % bannerGradients.length;
          const gradient = bannerGradients[index];
          const accentColor = accentColors[index];
          
          return (
            <div className={`relative h-[180px] bg-gradient-to-br ${gradient} rounded-t-3xl overflow-hidden`}
                 style={{ backgroundColor: '#F5F5F7' }}>
              <div className="absolute inset-0 opacity-30">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="diagonalLines" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="40" stroke={accentColor} strokeWidth="1" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#diagonalLines)"/>
                </svg>
              </div>
              
              <div className="absolute inset-0">
                <div className="absolute top-8 right-16 w-32 h-32 rounded-full opacity-20"
                     style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}></div>
                <div className="absolute bottom-6 right-1/3 w-24 h-24 rounded-full opacity-15"
                     style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}></div>
                <div className="absolute top-12 left-1/4 w-20 h-20 rounded-full opacity-25"
                     style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}></div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1200 60" className="w-full" preserveAspectRatio="none">
                  <path d="M0,30 Q300,10 600,30 T1200,30 L1200,60 L0,60 Z" 
                        fill="white" opacity="0.1"/>
                  <path d="M0,40 Q300,20 600,40 T1200,40 L1200,60 L0,60 Z" 
                        fill="white" opacity="0.15"/>
                </svg>
              </div>
            </div>
          );
        })()}
          
          {/* Circular Logo */}
          <div className="absolute -bottom-[112px] left-12 z-30">
            {(() => {
              const gradients = [
                'from-[#6366F1] via-[#8B5CF6] to-[#EC4899]',
                'from-[#F59E0B] via-[#EF4444] to-[#DC2626]',
                'from-[#10B981] via-[#059669] to-[#047857]',
                'from-[#3B82F6] via-[#2563EB] to-[#1D4ED8]',
                'from-[#EC4899] via-[#DB2777] to-[#BE185D]',
                'from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]',
                'from-[#14B8A6] via-[#0D9488] to-[#0F766E]',
                'from-[#F97316] via-[#EA580C] to-[#C2410C]',
              ];
              
              const shadowColors = [
                'rgba(139,92,246,0.5)',
                'rgba(239,68,68,0.5)',
                'rgba(16,185,129,0.5)',
                'rgba(59,130,246,0.5)',
                'rgba(236,72,153,0.5)',
                'rgba(139,92,246,0.5)',
                'rgba(20,184,166,0.5)',
                'rgba(249,115,22,0.5)',
              ];
              
              const storeName = store?.storeName || "Cookies by Maryam";
              const hash = storeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const index = hash % gradients.length;
              const gradient = gradients[index];
              const shadowColor = shadowColors[index];
              
              return (
                <div className={`w-[140px] h-[140px] rounded-full bg-gradient-to-br ${gradient} border-[6px] border-white flex items-center justify-center overflow-hidden relative`}
                     style={{ boxShadow: `0 8px 30px ${shadowColor}` }}>
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full" 
                         style={{
                           backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                            radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 50%)`
                         }}>
                    </div>
                  </div>
                  
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-3">
                    <div className="absolute inset-0 flex items-center justify-center opacity-15">
                      <svg viewBox="0 0 100 100" className="w-28 h-28 text-white">
                        <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="currentColor" stroke="currentColor" strokeWidth="3"/>
                      </svg>
                    </div>
                    
                    <div className="relative">
                      {(() => {
                        const words = storeName.split(' ').filter(w => w.length > 0);
                        const initials = words.length >= 2 
                          ? words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
                          : words[0].slice(0, 2).toUpperCase();
                        
                        return (
                          <span className="text-[52px] font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] tracking-tighter" 
                                style={{ fontFamily: "Inter, sans-serif" }}>
                            {initials}
                          </span>
                        );
                      })()}
                    </div>
                    
                    <div className="w-14 h-1 bg-white/90 rounded-full mt-1 shadow-[0_2px_6px_rgba(0,0,0,0.3)]"></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* White Info Section (Bottom) */}
        <div className="pt-7 pb-3 px-10 bg-white rounded-b-3xl">
          
          {/* HORIZONTAL LAYOUT */}
          <div className="flex items-start gap-8">
            
            {/* LEFT SIDE: Logo space + Store Name + Rating + Categories */}
            <div className="flex items-start gap-6 flex-1">
              {/* Spacer for logo */}
              <div className="w-[140px] flex-shrink-0"></div>
              
              {/* Store Name and Info next to logo */}
              <div className="flex-1">
                {/* Store Name with Rating inline */}
                <div className="flex items-center gap-4 mb-1.5">
                  <h1 className="text-[32px] font-bold text-charcoal-600 leading-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.2)]" 
                      style={{ fontFamily: "Merriweather, serif" }}>
                    {store?.storeName || "Cookies by Maryam"}
                  </h1>
                  
                  {/* Rating inline with name */}
                    <div className="flex items-center gap-2.5">
                      {(() => {
                        const reviewCount = store?.products?.reduce((count, product) => 
                          count + (product.reviews?.filter(r => !r.isCommentHiddenBySeller)?.length || 0), 0
                        ) || 0;
                        
                        const rating = store?.averageRating || 0;
                        
                        if (reviewCount < 5) {
                          return (
                            <span className="px-4 py-1.5 bg-sage-500 text-white text-sm font-bold rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                              NEW
                            </span>
                          );
                        }
                        
                        return (
                          <>
                            <Star className="w-7 h-7 !text-sage-500" weight="fill" />
                            <span className="text-[22px] font-semibold text-[#556B5C]" 
                                  style={{ fontFamily: "Inter, sans-serif" }}>
                              {rating.toFixed(1)}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                </div>
                
                {/* Categories */}
                <p className="text-[15px] text-charcoal-500" 
                   style={{ fontFamily: "Inter, sans-serif" }}>
                  Cakes • Cookies • Desserts
                </p>
              </div>
            </div>

            {/* VERTICAL DIVIDER LINE */}
            <div className="w-[2px] h-16 bg-grey-stroke self-start"></div>

            {/* RIGHT SIDE: Store Information */}
            <div className="flex-1 pr-8">
              {/* Inline Details */}
              <div className="space-y-1.5 text-[15px]" 
                   style={{ fontFamily: "Inter, sans-serif", lineHeight: '1.6' }}>
                
                <p className="text-charcoal-500">
                  {store?.description || "Handcrafted cookies made with love. Perfect for any occasion."}
                </p>

                <p>
                  <span className="font-semibold text-[#556B5C]">Phone:</span>{" "}
                  <span className="text-charcoal-600">{store?.phone || "+1 555-1234"}</span>
                  {"  "}
                  <span className="font-semibold text-[#556B5C]">Email:</span>{" "}
                  <span className="text-charcoal-600">{store?.email || "maryam@beyti.com"}</span>
                </p>

                <p>
                  <span className="font-semibold text-[#556B5C]">Address:</span>{" "}
                  <span className="text-charcoal-600">
                    {store?.sellerAddresses?.[0]?.address 
                      ? `${store.sellerAddresses[0].address.street}, ${store.sellerAddresses[0].address.city}`
                      : "123 Baker Street, Beyti City"}
                  </span>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
);

// Category Sidebar
const CategorySidebar = ({ selected, onSelect }) => {
  const categories = [
    { id: "popular", label: "Most Popular", icon: <Star size={24} weight="regular" /> },
    { id: "cookies", label: "Cookies", icon: <Cake size={24} weight="regular" /> },
    { id: "offers", label: "Offers", icon: <Heart size={24} weight="regular" /> },
    { id: "newest", label: "Newest Cookies", icon: <Cake size={24} weight="regular" /> },
    { id: "chocolate", label: "Chocolate Cookies", icon: <Cake size={24} weight="regular" /> },
    { id: "cakes", label: "Cookies Cakes", icon: <Bread size={24} weight="regular" /> },
  ];

  return (
    <aside className="w-[280px] flex-shrink-0 sticky top-[88px] h-[calc(100vh-88px)] overflow-y-auto">
      <div className="space-y-3 py-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-full text-left transition-all font-medium text-[17px] ${
              selected === cat.id
                ? 'bg-sage-500 text-white shadow-[0_2px_8px_rgba(85,107,92,0.3)]'
                : 'bg-cream-50 text-sage-500 hover:bg-cream-100'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              selected === cat.id ? 'bg-sage-700' : 'bg-[#E8F0EA]'
            }`}>
              <div className={selected === cat.id ? 'text-white' : 'text-sage-500'}>
                {cat.icon}
              </div>
            </div>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

// Product Card
const ProductCard = ({ product, onClick }) => {
  const rating = product?.averageRating || 0;
  const reviewCount = product?.reviewCount || 0;
  const hasEnoughReviews = reviewCount >= 5;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all group"
    >
      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-[#D8E8DC] to-[#C9DFD0] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-white/30 rounded-full flex items-center justify-center">
            <svg className="w-16 h-16 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg">
          <span className="text-lg font-bold text-sage-700">
            {product?.basePrice ? `${product.basePrice.toFixed(3)} BD` : "15.000 BD"}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5">
        <h3 className="font-bold text-charcoal-600 text-lg mb-2 line-clamp-2 group-hover:text-sage-600 transition-colors" style={{ fontFamily: 'Merriweather, serif' }}>
          {product?.name || "Dream Cookie"}
        </h3>
        
        {/* Rating or NEW badge */}
        <div className="flex items-center gap-1 mb-3">
          {!hasEnoughReviews ? (
            <span className="px-3 py-1 bg-sage-500 text-white text-xs font-bold rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
              NEW
            </span>
          ) : (
            <>
              {[...Array(5)].map((_, i) => {
                const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100));
                return (
                  <div key={i} className="relative w-4 h-4">
                    <Star className="w-4 h-4 text-grey-stroke absolute" weight="fill" />
                    <div className="overflow-hidden absolute" style={{ width: `${fillPercentage}%` }}>
                      <Star className="w-4 h-4 text-sage-500" weight="fill" />
                    </div>
                  </div>
                );
              })}
              <span className="text-sm font-semibold text-charcoal-600 ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                {rating.toFixed(1)}
              </span>
            </>
          )}
        </div>

        {product?.description && (
          <p className="text-sm text-charcoal-400 mb-4 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <button className="w-full bg-sage-500 hover:bg-sage-600 text-white font-semibold py-3 rounded-xl transition-all shadow-[0_2px_8px_rgba(85,107,92,0.2)]">
          View Details
        </button>
      </div>
    </div>
  );
};

// Main Store View Component
const StoreView = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

   // Get customer info from navigation state
  const customerId = location.state?.customerId;
  const customerName = location.state?.customerName;

  const itemAdded = location.state?.itemAdded;
  const itemName = location.state?.itemName;
  const itemQuantity = location.state?.itemQuantity;

  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [showDifferentStoreModal, setShowDifferentStoreModal] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState(null);

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");


  const [bannerDismissed, setBannerDismissed] = useState(() => {
  if (!customerId) return false;
  return localStorage.getItem(`beyti_bannerDismissed_${customerId}`) === 'true';
  });

const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

const showSnackbar = (message, type = 'success') => {
  setSnackbar({ open: true, message, type });
  setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 5000);
};

    const [cart, setCart] = useState(() => {
    // Initialize cart from localStorage - CHECK ALL STORES
    try {
        if (customerId) {
        // Check all cart keys for this customer
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
            const savedCart = localStorage.getItem(key);
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                if (parsedCart.length > 0) {
                console.log('📦 Loaded cart from:', key, parsedCart);
                return parsedCart;
                }
            }
            }
        }
        }
    } catch (err) {
        console.error('Error loading cart from localStorage:', err);
    }
    return [];
    });

       // Sync cart state with localStorage changes
            useEffect(() => {
            console.log('🛒 CART STATE CHANGED:', cart);
            console.log('📊 Total items:', cart.length);
            console.log('📦 Total quantity:', cart.reduce((sum, item) => sum + item.quantity, 0));
            
            // Save to localStorage whenever cart changes
            if (customerId && cart.length > 0) {
                // Get the store ID from the cart items
                const cartStoreId = cart[0]?.sellerId;
                if (cartStoreId) {
                localStorage.setItem(`beyti_cart_${cartStoreId}_${customerId}`, JSON.stringify(cart));
                console.log('💾 Saved cart to localStorage for store:', cartStoreId);
                }
            }
            }, [cart, customerId]);

            // Poll localStorage for cart updates from other pages
            useEffect(() => {
            if (!customerId) {
                setCart([]);
                return;
            }

            const updateCart = () => {
                try {
                // Check all cart keys for this customer
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
                    const savedCart = localStorage.getItem(key);
                    if (savedCart) {
                        const parsedCart = JSON.parse(savedCart);
                        if (parsedCart.length > 0) {
                        setCart(parsedCart);
                        return;
                        }
                    }
                    }
                }
                setCart([]);
                } catch (err) {
                console.error('Error updating cart:', err);
                }
            };

            updateCart();
            
            // Update cart every 500ms to catch changes
            const interval = setInterval(updateCart, 500);
            
            return () => clearInterval(interval);
            }, [customerId]);

  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

// Load active order from localStorage on mount
const [activeOrder, setActiveOrder] = useState(null);

const [orders, setOrders] = useState([]);

// Load and poll active order for the selected customer (like cart polling)
useEffect(() => {
  if (!customerId) {
    setActiveOrder(null);
    return;
  }

  const updateActiveOrder = () => {
    try {
      const savedOrder = localStorage.getItem(`beyti_activeOrder_${customerId}`);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        setActiveOrder(parsedOrder);
      } else {
        setActiveOrder(null);
      }
    } catch (err) {
      console.error('Error loading active order:', err);
    }
  };

  // Load immediately
  updateActiveOrder();
  
  // Poll every 1 second to catch changes
  const interval = setInterval(updateActiveOrder, 1000);
  
  return () => clearInterval(interval);
}, [customerId]);

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
}, [customerId]);

// Reset banner dismissed state when customer changes
useEffect(() => {
  if (customerId) {
    const dismissed = localStorage.getItem(`beyti_bannerDismissed_${customerId}`) === 'true';
    setBannerDismissed(dismissed);
  }
}, [customerId]);


const fetchSingleOrder = async (orderId) => {
  try {
    const res = await fetch(`https://localhost:7062/api/Orders/${orderId}`);
    if (!res.ok) throw new Error("Failed to fetch order");
    return await res.json();
  } catch (err) {
    console.error("❌ Error fetching single order:", err);
    return null;
  }
};

const handleCustomerLogout = () => {
  // Clear customer session
  sessionStorage.removeItem('beyti_customerId');
  sessionStorage.removeItem('beyti_customerName');
  
  // Clear active order
  if (customerId) {
    localStorage.removeItem(`beyti_activeOrder_${customerId}`);
    localStorage.removeItem(`beyti_cart_${storeId}_${customerId}`); // ← ADD THIS
    localStorage.removeItem(`beyti_bannerDismissed_${customerId}`);
  }
  
  // Clear cart state
  setCart([]); // ← ADD THIS
  
  // Navigate back to main store view
  navigate('/', { replace: true });
  
  console.log("Customer logged out from store view");
};

const handleDismissBanner = () => {
  setBannerDismissed(true);
  localStorage.setItem(`beyti_bannerDismissed_${customerId}`, 'true');
};

const handleTrackOrder = () => {
  navigate('/customer-dashboard');
};



useEffect(() => {
  if (!activeOrder || !customerId) return;

  console.log("📡 POLLING STARTED for Order:", activeOrder.id);

  const interval = setInterval(async () => {
    console.log("⏳ Polling tick...");

    try {
    const updatedList = await getOrders(
        Number(activeOrder.customerId)
    );


     const updated = await fetchSingleOrder(activeOrder.id);
      console.log("📥 Backend responded with:", updated);

      if (updated.status !== activeOrder.status) {
        console.log("🎉 STATUS CHANGED → updating!");
        
        // Preserve all fields when updating
        const completeUpdatedOrder = {
        ...activeOrder, // Keep all existing fields
        ...updated, // Apply updates from backend
        customerId: activeOrder.customerId,  
        sellerId: activeOrder.sellerId,  
        // Ensure critical fields are preserved
        storeName: updated.sellerName || activeOrder.storeName,
        storePhone: activeOrder.storePhone || updated.sellerPhone,
        pickupAddress: updated.pickupAddress || activeOrder.pickupAddress, // Use backend data first
        deliveryAddress: updated.deliveryAddress || activeOrder.deliveryAddress,
        };
        
        setActiveOrder(completeUpdatedOrder);
        localStorage.setItem(`beyti_activeOrder_${customerId}`, JSON.stringify(completeUpdatedOrder));
      }
    } catch (err) {
      console.error("🔥 POLLING ERROR:", err);
    }
  }, 5000);

  return () => clearInterval(interval);
}, [activeOrder]);









const handleProductClick = (product) => {
  navigate(`/store/${storeId}/product/${product.id}`, {
    state: {
      customerId,
      customerName,
      storeName: store?.storeName,
      storeId,
      customerAddresses,   // ⬅ PASS
    selectedStore: store  // ⬅ PASS
    }
  });
};

    const handleAddToCart = (item) => {
    console.log('🎯 handleAddToCart called with:', item);
    console.log('📊 Current cart state:', cart);
    
    // Ensure sellerId is present
    const itemWithSeller = {
        ...item,
        sellerId: item.sellerId || store?.id
    };
    
    console.log('✅ Item with seller:', itemWithSeller);
    
    // Check if cart has items from a different store
    if (cart.length > 0 && cart[0].sellerId !== itemWithSeller.sellerId) {
        // Show modal asking user what to do
        setPendingCartItem(itemWithSeller);
        setShowDifferentStoreModal(true);
        return;
    }
    
    // Find if this exact product + variant combo exists
    const existingItemIndex = cart.findIndex(cartItem => {
        const sameProduct = cartItem.id === itemWithSeller.id;
        const sameVariant = (!cartItem.selectedVariant && !itemWithSeller.selectedVariant) ||
                            (cartItem.selectedVariant?.id === itemWithSeller.selectedVariant?.id);
        return sameProduct && sameVariant;
    });
    
    console.log('🔍 Existing item index:', existingItemIndex);
    
    if (existingItemIndex !== -1) {
        // Item exists - ADD to existing quantity
        const updatedCart = [...cart];
        const existingItem = updatedCart[existingItemIndex];
        const newQuantity = existingItem.quantity + itemWithSeller.quantity;
        const newTotalPrice = existingItem.basePrice * newQuantity;
        
        console.log('📈 Updating existing item:');
        console.log('   Old quantity:', existingItem.quantity);
        console.log('   Adding:', itemWithSeller.quantity);
        console.log('   New quantity:', newQuantity);
        
        updatedCart[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: newTotalPrice
        };
        
        setCart(updatedCart);
        console.log('✨ Cart updated (existing item):', updatedCart);
        showSnackbar(`Added ${itemWithSeller.quantity}x ${itemWithSeller.name} to cart!`, 'success');
    } else {
        // New item - add to cart
        console.log('🆕 Adding new item to cart');
        const newCart = [...cart, itemWithSeller];
        setCart(newCart);
        console.log('✨ Cart updated (new item):', newCart);
        showSnackbar(`Added ${itemWithSeller.quantity}x ${itemWithSeller.name} to cart!`, 'success');
    }
    };
    

const handleClearAndAdd = () => {
  if (!pendingCartItem) return;
  
  // Clear cart and add new item
  const newCart = [pendingCartItem];
  setCart(newCart);
  
  // Update localStorage - remove old store's cart
  const oldStoreId = cart[0]?.sellerId;
  if (oldStoreId && customerId) {
    localStorage.removeItem(`beyti_cart_${oldStoreId}_${customerId}`);
  }
  
  // Save new cart
  if (customerId && storeId) {
    localStorage.setItem(`beyti_cart_${storeId}_${customerId}`, JSON.stringify(newCart));
  }
  
  setShowDifferentStoreModal(false);
  setPendingCartItem(null);
  showSnackbar(`Cleared previous cart and added ${pendingCartItem.name}!`, 'success');
};

const handleCancelAdd = () => {
  setShowDifferentStoreModal(false);
  setPendingCartItem(null);
  showSnackbar('Item not added to cart', 'warning');
};

const handleUpdateQuantity = (productId, newQuantity) => {
  if (newQuantity < 1) {
    handleRemoveFromCart(productId);
    return;
  }
  setCart(cart.map(item => 
    item.id === productId 
      ? { ...item, quantity: newQuantity, totalPrice: item.basePrice * newQuantity }
      : item
  ));
};

const handleRemoveFromCart = (productId) => {
  setCart(cart.filter(item => item.id !== productId));
};

// Effect 1: Load store data
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const loadStore = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStoreDetails(storeId);
      setStore(data);
    } catch (err) {
      setError(err.message || "Failed to load store");
    } finally {
      setLoading(false);
    }
  };

  if (storeId) {
    loadStore();
  }
}, [storeId]);

// Show snackbar when item is added
useEffect(() => {
  if (itemAdded && itemName && itemQuantity) {
    // Small delay to ensure component is mounted and ready
    const timer = setTimeout(() => {
      showSnackbar(`Added ${itemQuantity}x ${itemName} to cart!`, 'success');
    }, 100);
    
    // Clear the flags after showing
    const clearTimer = setTimeout(() => {
      navigate(location.pathname, { 
        replace: true, 
        state: { customerId, customerName } 
      });
    }, 500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }
}, [itemAdded, itemName, itemQuantity, customerId, customerName, navigate, location.pathname]);


  // Fetch full customer details including addresses
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!customerId) {
        setCustomerAddresses([]);
        return;
      }

      try {
        setLoadingAddresses(true);
        console.log("🔍 Fetching customer details for ID:", customerId);
        
        const response = await fetch(`https://localhost:7062/api/Customers/${customerId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const customerData = await response.json();
        console.log("✅ Full customer data received:", customerData);
        
        // Extract addresses properly
        const addresses = customerData.customerAddresses || [];
        console.log("📍 Customer addresses extracted:", addresses);
        
        setCustomerAddresses(addresses);
      } catch (err) {
        console.error("❌ Error fetching customer details:", err);
        setCustomerAddresses([]);
        showSnackbar('Could not load customer addresses', 'error');
        } finally {
        setLoadingAddresses(false);
      }
    };
    
    fetchCustomerDetails();
  }, [customerId]);


  // Get category title
  const getCategoryTitle = (categoryId) => {
    const titles = {
      popular: "Most Popular",
      cookies: "Cookies",
      offers: "Offers",
      newest: "Newest Cookies",
      chocolate: "Chocolate Cookies",
      cakes: "Cookies Cakes"
    };
    return titles[categoryId] || "Products";
  };

const filteredProducts = (store?.products || [])
  .filter(product => {
    // Filter out inactive products
    if (product.isActive === false) {
      return false;
    }
    
    // Search filter
    if (searchQuery && !product.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  })
  
  .sort((a, b) => {
    // Helper function to check if product is new (less than 5 reviews)
    const isNewProduct = (product) => {
      const reviewCount = product.reviews?.filter(r => !r.isCommentHiddenBySeller)?.length || 0;
      return reviewCount < 5;
    };
    
    const aIsNew = isNewProduct(a);
    const bIsNew = isNewProduct(b);
    const aRating = a.averageRating || 0;
    const bRating = b.averageRating || 0;
    
    // Apply sorting
    if (sortBy === 'price-low') return (a.basePrice || 0) - (b.basePrice || 0);
    if (sortBy === 'price-high') return (b.basePrice || 0) - (a.basePrice || 0);
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    
    if (sortBy === 'rating-high') {
      // New products go last when sorting high to low
      if (aIsNew && !bIsNew) return 1;
      if (!aIsNew && bIsNew) return -1;
      return bRating - aRating;
    }
    
    if (sortBy === 'rating-low') {
      // New products go first when sorting low to high
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      return aRating - bRating;
    }
    
    return 0; // Default: popular (no sorting)
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-grey-stroke border-t-sage-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal-600 font-medium">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-error-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-error-btn" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-charcoal-600 mb-2">Error Loading Store</h3>
          <p className="text-charcoal-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-sage-500 hover:bg-sage-600 text-white font-semibold rounded-full"
          >
            Back to Stores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <CustomerHeader
        title={store?.storeName || "Beyti"}
        customerName={customerName}
        customerId={customerId}
        cart={cart}
        stores={[store]}
        customerAddresses={customerAddresses}
        onCustomerClick={() => navigate('/mainStore')}
        onLogout={handleCustomerLogout}
        onBack={() => navigate('/mainStore', { state: { customerId, customerName }, replace: true })}
        showBackButton={true}
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


      <StoreInfo store={store} />
      
      <div className="max-w-[1440px] mx-auto px-12 py-8">
        <div className="flex gap-8">
          <CategorySidebar selected={selectedCategory} onSelect={setSelectedCategory} />
          
          <div className="flex-1">
            {/* Category Title with Search, Filter and Sort - ALL IN ONE ROW */}
            <div className="flex items-center justify-between mb-8">
              {/* Category Title on the left */}
              <h2 className="text-3xl font-bold text-[#556B5C]" style={{ fontFamily: 'Merriweather, serif' }}>
                {getCategoryTitle(selectedCategory)}
              </h2>
              
              {/* Search and Sort on the right */}
              <div className="flex gap-3 items-center">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-5 py-2.5 bg-white rounded-full border border-grey-stroke hover:border-sage-500 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-charcoal-600 font-medium cursor-pointer text-sm"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="popular">Sort All</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating-high">Rating: High to Low</option>
                  <option value="rating-low">Rating: Low to High</option>
                  <option value="newest">Newest First</option>
                </select>
                  
                  {/* Search Input */}
                  <div className="relative w-64">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Products..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white rounded-full border border-grey-stroke focus:outline-none focus:border-sage-500 text-charcoal-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-sm"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                    <MagnifyingGlass className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" weight="bold" />
                  </div>
                </div>
              </div>
                          
            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-grey-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-charcoal-600 mb-2">No Products Found</h3>
                <p className="text-charcoal-400">This store hasn't added any products yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      



      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar({ open: false, message: '', type: 'success' })}
      />


{/* Different Store Modal */}
{showDifferentStoreModal && (
  <div className="fixed inset-0 bg-charcoal-600/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
    <div className="relative bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-full max-w-lg overflow-hidden border-2 border-grey-stroke">
      
      {/* Header with Sage Green Brand Colors */}
      <div className="relative bg-gradient-to-br from-sage-500 to-sage-700 px-8 py-8">
        {/* Decorative circles */}
        <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 left-8 w-16 h-16 bg-white/10 rounded-full" />
        
        <div className="relative flex items-start gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <ShoppingCartSimple size={32} weight="bold" className="text-sage-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-display-h2 text-white mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
              Different Store Detected
            </h3>
            <p className="text-body-regular text-sage-100" style={{ fontFamily: 'Inter, sans-serif' }}>
              Your cart contains items from another store
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Warning Box */}
        <div className="bg-danger-bg border-2 border-danger-btn rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-danger-btn rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-body-medium text-charcoal-600 font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Important: One store at a time
              </p>
              <p className="text-body-regular text-danger-text leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                You can only order from one store per transaction. Choose how you'd like to proceed.
              </p>
            </div>
          </div>
        </div>

        {/* Current Cart Store */}
        <div className="bg-cream-50 border-2 border-grey-stroke rounded-2xl p-5 mb-4">
          <p className="text-label-medium text-sage-700 uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Current Cart
          </p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-sage-500 to-sage-700 rounded-xl flex items-center justify-center shadow-md">
              <Storefront size={28} weight="fill" className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-card-h2 text-charcoal-600 truncate" style={{ fontFamily: 'Merriweather, serif' }}>
                {cart[0]?.storeName || 'Another Store'}
              </p>
              <p className="text-body-regular text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                {cart.length} item{cart.length !== 1 ? 's' : ''} • {cart.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(3)} BD
              </p>
            </div>
          </div>
        </div>

        {/* New Item to Add */}
        {pendingCartItem && (
          <div className="bg-sage-100 border-2 border-sage-500 rounded-2xl p-5 mb-6">
            <p className="text-label-medium text-sage-700 uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              New Item
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-sage-100 to-cream-100 rounded-xl flex items-center justify-center shadow-md border-2 border-sage-500">
                <Package size={28} className="text-sage-700" weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-medium text-charcoal-600 font-bold truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {pendingCartItem.name}
                </p>
                <p className="text-body-regular text-sage-700 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {pendingCartItem.basePrice.toFixed(3)} BD
                </p>
                <p className="text-label-medium text-charcoal-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  From: {pendingCartItem.storeName || storeName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleClearAndAdd}
            className="w-full bg-sage-500 hover:bg-sage-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-soft-lift hover:shadow-[0_6px_20px_rgba(85,107,92,0.3)] flex items-center justify-center gap-3 group text-button"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <ShoppingCartSimple size={22} weight="bold" />
            <span>Clear Cart & Add This Item</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          
          <button
            onClick={handleCancelAdd}
            className="w-full bg-grey-200 border-2 border-grey-stroke hover:bg-cream-100 text-charcoal-600 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-button"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <X size={20} weight="bold" />
            <span>Keep Current Cart</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-cream-100 rounded-xl p-4 border border-grey-stroke">
          <p className="text-label-medium text-charcoal-500 text-center leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            💡 <span className="font-semibold">Tip:</span> Complete your current order first, then you can shop from other stores
          </p>
        </div>
      </div>
    </div>
  </div>
)}

    {/* Snackbar */}
      <Snackbar 
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

    </div>
  );
};

export default StoreView;
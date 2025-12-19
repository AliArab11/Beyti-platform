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
import { isStoreOpen, formatTime } from '../Seller/Components/storeStatus';

import OrderDetails from './Components/OrderDetails';
import { createOrder, createOrderItem, getProductVariants, getOrder, getOrders } from '../../services/api';



const getStoreDetails = async (storeId) => {
  try {
    const response = await fetch(
      `https://localhost:7062/api/Sellers/${storeId}/products`
    );
    if (!response.ok) throw new Error("Failed to fetch");
    return await response.json();
  } catch (error) {
    console.error("Error fetching store:", error);
    return null;
  }
};



// Store Info Section
const StoreInfo = ({ store, isFavorited, onToggleFavorite, customerId }) => (
  <div className="bg-cream-50 px-8 py-6">
    <div className="max-w-[1400px] mx-auto">
      
      {/* Main Card Container */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] relative">

        {/* Banner Section (Top) */}
        <div className="relative h-[180px] bg-gradient-to-br from-cream-100 to-cream-200 rounded-t-3xl overflow-hidden">
          {/* Store Status Badge */}
          <div className="absolute top-4 left-8 z-20">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
              isStoreOpen(store)
                ? 'bg-success-btn text-white'
                : 'bg-error-btn text-white'
            }`}>
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              {isStoreOpen(store) ? 'OPEN' : 'CLOSED'}
            </div>
          </div>

          {/* Favorite Heart Button */}
          {onToggleFavorite && customerId && (
            <div className="absolute top-4 right-8 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(store.id);
                }}
                className="w-12 h-12 bg-white hover:bg-cream-50 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
              >
                <Heart 
                  size={24} 
                  weight={isFavorited ? 'fill' : 'regular'} 
                  className={isFavorited ? 'text-error-btn' : 'text-charcoal-400'}
                />
              </button>
            </div>
          )}
        </div>
        
        {/* Circular Logo */}
        <div className="absolute -bottom-[112px] left-12 z-30">
          <div className="w-[140px] h-[140px] rounded-full border-[6px] border-white flex items-center justify-center overflow-hidden bg-white shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
            {store?.storeImageUrl ? (
              <img 
                src={`https://localhost:7062${store.storeImageUrl}`}
                alt={store.storeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-grey-200 to-grey-300">
                <span className="text-5xl font-black text-charcoal-600" style={{ fontFamily: "Inter, sans-serif" }}>
                  {(() => {
                    const storeName = store?.storeName || "Store";
                    const words = storeName.split(' ').filter(w => w.length > 0);
                    return words.length >= 2 
                      ? words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
                      : words[0].slice(0, 2).toUpperCase();
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* White Info Section (Bottom) */}
      <div className="pt-7 pb-6 px-10 bg-white rounded-b-3xl">
        
        {/* HORIZONTAL LAYOUT */}
        <div className="flex items-start gap-8">
          
          {/* LEFT SIDE: Logo space + Store Name + Rating + Categories */}
          <div className="flex items-start gap-6 flex-1 min-w-0">
            {/* Spacer for logo */}
            <div className="w-[140px] flex-shrink-0"></div>
            
            {/* Store Name and Info next to logo */}
            <div className="flex-1 min-w-0">
              {/* Store Name with Rating inline */}
              <div className="flex items-center gap-4 mb-1.5 flex-wrap">
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
              <p className="text-[15px] text-charcoal-500 mb-2" 
                style={{ fontFamily: "Inter, sans-serif" }}>
                {store?.subCategoryNames?.length > 0 
                  ? store.subCategoryNames.join(' • ') 
                  : 'No categories'}
              </p>

              {/* Store Hours */}
              {store?.openTime && store?.closeTime && (
                <p className="text-[14px] text-charcoal-400 flex items-center gap-2" 
                  style={{ fontFamily: "Inter, sans-serif" }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Store Hours:</span>
                  <span>{formatTime(store.openTime)} - {formatTime(store.closeTime)}</span>
                </p>
              )}
            </div>
          </div>

          {/* VERTICAL DIVIDER LINE */}
          <div className="w-[2px] self-stretch bg-grey-stroke"></div>

          {/* RIGHT SIDE: Store Information */}
          <div className="flex-1 min-w-0">
            <div className="space-y-3 text-[15px]" 
                 style={{ fontFamily: "Inter, sans-serif", lineHeight: '1.6' }}>
              
              {/* Description - with max height and scroll if needed */}
              <div className="max-h-[120px] overflow-y-auto pr-2">
                <p className="text-charcoal-500 leading-relaxed">
                  {store?.storeDescription }
                </p>
              </div>

              {/* Contact Info - condensed */}
              <div className="space-y-1.5 pt-2 border-t border-grey-stroke/30">
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-semibold text-sage-700">Phone:</span>
                  <span className="text-charcoal-600">{store?.phone || "+1 555-1234"}</span>
                </p>

                <p className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 text-sage-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-semibold text-sage-700">Address:</span>
                  <span className="text-charcoal-600 flex-1">
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
  </div>
);

const CategorySidebar = ({ selected, onSelect, sections = [], systemSections }) => {
  const defaultCategories = [
    { id: "all", label: "All Products", icon: <Package size={24} weight="regular" /> },
  ];

    // Add system sections
    const systemCategories = [];

    if (systemSections?.mostPopular?.products?.length > 0) {
      systemCategories.push({
        id: "system-popular",
        label: "Most Popular",
        icon: <Star size={24} weight="regular" />,
        iconFilled: <Star size={24} weight="fill" />,
        sortOrder: -1,
        isSystemSection: true
      });
    }

    if (systemSections?.discounts?.products?.length > 0) {
      systemCategories.push({
        id: "system-discounts",
        label: "Discounts",
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
        </svg>,
        iconFilled: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
        </svg>,
        sortOrder: -2,
        isSystemSection: true
      });
    }

  const sectionCategories = sections
    .filter(s => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(section => ({
      id: `section-${section.id}`,
      label: section.name,
      icon: <Bread size={24} weight="regular" />,
      sectionId: section.id
    }));

  const allCategories = [...defaultCategories, ...systemCategories, ...sectionCategories];

  return (
    <aside className="w-[280px] flex-shrink-0 sticky top-[88px] h-[calc(100vh-88px)] overflow-y-auto">
      <div className="space-y-3 py-6">
        {allCategories.map(cat => (
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
                {selected === cat.id && cat.iconFilled ? cat.iconFilled : cat.icon}
              </div>
            </div>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
  if (!discountPercentage || discountPercentage <= 0) return null;
  return originalPrice - (originalPrice * (discountPercentage / 100));
};

// Product Card
const ProductCard = ({ product, onClick }) => {
  const rating = product?.averageRating || 0;
  const reviewCount = product?.reviewCount || 0;
  const hasEnoughReviews = reviewCount >= 5;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(85,107,92,0.15)] hover:scale-[1.02] transition-all duration-300 group"
    >
      {/* Product Image - Square */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#D8E8DC] to-[#C9DFD0]">
        {product?.imageUrl ? (
          <img 
            src={`https://localhost:7062${product.imageUrl}`}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ aspectRatio: '1 / 1' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-white/30 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        )}
      </div>

{/* Product Info - Compact & Organized */}
<div className="p-4">
  {/* Product Name - Bigger */}
  <h3 className="font-bold text-charcoal-600 text-xl leading-tight line-clamp-2 group-hover:text-sage-600 transition-colors" style={{ fontFamily: 'Merriweather, serif' }}>
    {product?.name || "Dream Cookie"}
  </h3>
  
  {/* Product Description - NEW */}
  {product?.description && (
    <p className="text-xs text-charcoal-400 line-clamp-1 leading-relaxed mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
      {product.description}
    </p>
  )}
  
  {/* Rating or NEW badge */}
  <div className="flex items-center gap-1.5 mt-2 mb-1">
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
              <span className="text-sm font-bold text-charcoal-600 ml-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                {rating.toFixed(1)}
              </span>
            </>
          )}
        </div>

        {/* Price at Bottom - Compact */}
        <div className="pt-2 border-t border-grey-stroke/40">
          {(() => {
            const originalPrice = product?.basePrice || 15.000;
            const discount = product?.discountPercentage || product?.discount;
            const discountedPrice = discount ? calculateDiscountedPrice(originalPrice, discount) : null;
            
            return discountedPrice ? (
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-sage-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {discountedPrice.toFixed(3)} BD
                  </span>
                  <span className="text-xs font-medium text-charcoal-400 line-through" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {originalPrice.toFixed(3)} BD
                  </span>
                </div>
                <div className="bg-error-btn text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {discount}% OFF
                </div>
              </div>
            ) : (
              <span className="text-xl font-extrabold text-sage-700 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                {originalPrice.toFixed(3)} BD
              </span>
            );
          })()}
        </div>
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

  const [systemSections, setSystemSections] = useState({ discounts: null, mostPopular: null });

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");

  const [isFavorited, setIsFavorited] = useState(false);


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



// Check if this store is favorited
useEffect(() => {
  const checkFavorite = async () => {
    if (!customerId || !storeId) {
      setIsFavorited(false);
      return;
    }

    try {
      const response = await fetch(
        `https://localhost:7062/api/CustomerFavorites/check/${customerId}/${storeId}`
      );
      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.isFavorited);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  checkFavorite();
}, [customerId, storeId]);





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
    // CHECK IF STORE IS CLOSED 
    if (!isStoreOpen(store)) {
        showSnackbar('Store is currently closed and cannot accept orders', 'error');
        return;
    }
  console.log('🎯 handleAddToCart called with:', item);
  console.log('📊 Current cart state:', cart);
  
  // Calculate final price with discount if applicable
  const originalPrice = item.basePrice;
  const discount = item.discountPercentage;
  const finalPrice = discount ? calculateDiscountedPrice(originalPrice, discount) : originalPrice;
  
  // Ensure sellerId is present
  const itemWithSeller = {
    ...item,
    basePrice: finalPrice,
    originalPrice: originalPrice,
    discountPercentage: discount,
    sellerId: item.sellerId || store?.id,
    imageUrl: item.imageUrl || null
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

const toggleFavorite = async (sellerId) => {
  if (!customerId) {
    showSnackbar('Please sign in to save favorites', 'warning');
    return;
  }

  try {
    if (isFavorited) {
      // Remove from favorites
      const response = await fetch(
        `https://localhost:7062/api/CustomerFavorites/${customerId}/${sellerId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setIsFavorited(false);
        showSnackbar('Removed from favorites', 'success');
      }
    } else {
      // Add to favorites
      const response = await fetch('https://localhost:7062/api/CustomerFavorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, sellerId })
      });

      if (response.ok) {
        setIsFavorited(true);
        showSnackbar('Added to favorites', 'success');
      }
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    showSnackbar('Failed to update favorites', 'error');
  }
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
      // ✅ store system sections separately
        if (data?.systemSections) {
          setSystemSections(data.systemSections);
        } else {
          setSystemSections({ discounts: null, mostPopular: null });
        }
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


const getCategoryTitle = (categoryId) => {
  if (categoryId === "all") return "All Products";
  
  if (categoryId === "system-popular") return "Most Popular";
  if (categoryId === "system-discounts") return "Discounts";
  
  if (categoryId.startsWith("section-")) {
    const sectionId = parseInt(categoryId.replace("section-", ""));
    const section = store?.storeSections?.find(s => s.id === sectionId);
    return section ? section.name : "Products";
  }
  
  return "Products";
};

const filteredProducts = (() => {
  // Handle system sections
  if (selectedCategory === "system-popular") {
    return systemSections.mostPopular?.products || [];
  }
  
  if (selectedCategory === "system-discounts") {
    return systemSections.discounts?.products || [];
  }
  
  // Handle regular sections
  return (store?.products || [])
    .filter(product => {
      // Filter out inactive products
      if (product.isActive === false) {
        return false;
      }
      
      // Search filter
      if (searchQuery && !product.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Section filter
      if (selectedCategory !== "all") {
        if (selectedCategory.startsWith("section-")) {
          const sectionId = parseInt(selectedCategory.replace("section-", ""));
          if (product.storeSectionId !== sectionId) {
            return false;
          }
        }
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
})();

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


      <StoreInfo 
        store={store} 
        isFavorited={isFavorited}
        onToggleFavorite={toggleFavorite}
        customerId={customerId}
      />
      
      <div className="max-w-[1440px] mx-auto px-12 py-8">
        <div className="flex gap-8">
          <CategorySidebar 
            selected={selectedCategory} 
            onSelect={setSelectedCategory}
            sections={store?.storeSections || []}
            systemSections={systemSections}
          />
          
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
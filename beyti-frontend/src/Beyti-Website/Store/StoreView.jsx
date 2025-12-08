import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Cake, Heart, Star, MagnifyingGlass, ArrowLeft, Bread, ShoppingCartSimple, X } from "@phosphor-icons/react";
import ProductDetailsSheet from './Components/ProductDetails.jsx';
import Checkout from './Components/Checkout';
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


const StoreHeader = ({ storeName, customerName, onBack }) => (
  <header className="bg-cream-50 py-4 px-8 border-b border-grey-stroke sticky top-0 z-10">
    <div className="max-w-[1440px] mx-auto flex items-center justify-between">
      <div className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-grey-200 rounded-lg transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-charcoal-600" weight="bold" />
        </button>
        <h1 className="text-[32px] font-bold text-charcoal-600" style={{ fontFamily: 'Merriweather, serif' }}>
          Beyti
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-grey-200 rounded-lg transition-all">
          <svg className="w-5 h-5 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <button className="p-2 hover:bg-grey-200 rounded-lg transition-all">
          <svg className="w-5 h-5 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        <button className="p-2 hover:bg-grey-200 rounded-lg transition-all">
          <svg className="w-5 h-5 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </button>
        {customerName ? (
          <div className="flex items-center gap-3 pl-4 border-l border-grey-stroke">
            <div className="w-8 h-8 bg-sage-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{customerName[0]}</span>
            </div>
            <span className="text-charcoal-600 font-medium text-sm">{customerName}</span>
            <svg className="w-4 h-4 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center gap-3 pl-4 border-l border-grey-stroke">
            <div className="w-8 h-8 bg-grey-300 rounded-full flex items-center justify-center">
              <span className="text-charcoal-400 text-sm font-semibold">?</span>
            </div>
            <span className="text-charcoal-400 font-medium text-sm">No Customer</span>
          </div>
        )}
      </div>
    </div>
  </header>
);

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
                    <Star className="w-7 h-7 text-[#556B5C]" weight="fill" />
                    <span className="text-[22px] font-semibold text-[#556B5C]" 
                          style={{ fontFamily: "Inter, sans-serif" }}>
                      {store?.rating || "2.3"}
                    </span>
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
const ProductCard = ({ product, onClick }) => (
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
      
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-[#F5C563]" weight="fill" />
        ))}
        <span className="text-sm font-semibold text-charcoal-600 ml-1">5.0</span>
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

// Main Store View Component
const StoreView = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

   // Get customer info from navigation state
  const customerId = location.state?.customerId;
  const customerName = location.state?.customerName;

  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductSheet, setShowProductSheet] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

    const showSnackbar = (message, type = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 3000);
    };

const handleProductClick = (product) => {
  setSelectedProduct(product);
  setShowProductSheet(true);
};

const handleAddToCart = (item) => {
  // Check if item already exists in cart
  const existingItem = cart.find(cartItem => cartItem.id === item.id);
  
  if (existingItem) {
    // Update quantity if item exists
    setCart(cart.map(cartItem => 
      cartItem.id === item.id 
        ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
        : cartItem
    ));
  } else {
    // Add new item to cart
    setCart([...cart, item]);
  }
  
  // Show success message (optional)
  alert(`Added ${item.quantity}x ${item.name} to cart!`);
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

  useEffect(() => {

    // Scroll to top when component mounts or storeId changes
    window.scrollTo({ top: 70, behavior: 'smooth' });

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

  const filteredProducts = store?.products?.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
      <StoreHeader 
        storeName={store?.storeName} 
        customerName={customerName} 
        onBack={() => navigate(-1)} 
        />
      <StoreInfo store={store} />
      
      <div className="max-w-[1440px] mx-auto px-12 py-8">
        <div className="flex gap-8">
          <CategorySidebar selected={selectedCategory} onSelect={setSelectedCategory} />
          
          <div className="flex-1">
            {/* Category Title with Search and Sort - ALL IN ONE ROW */}
            <div className="flex items-center justify-between mb-8">
              {/* Category Title on the left */}
              <h2 className="text-3xl font-bold text-[#556B5C]" style={{ fontFamily: 'Merriweather, serif' }}>
                {getCategoryTitle(selectedCategory)}
              </h2>
              
              {/* Search and Sort on the right */}
              <div className="flex gap-3 items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-5 py-2.5 bg-white rounded-full border border-grey-stroke hover:border-sage-500 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-charcoal-600 font-medium cursor-pointer text-sm"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="popular">Sort All</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
                
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

      {/* Product Details Bottom Sheet */}
      <ProductDetailsSheet
        product={selectedProduct}
        isOpen={showProductSheet}
        onClose={() => setShowProductSheet(false)}
        onAddToCart={handleAddToCart}
        storeName={store?.storeName}
        />
        {/* Floating Cart Button */}
        {cart.length > 0 && (
        <button
            onClick={() => setShowCheckoutModal(true)}
            className="fixed bottom-8 right-8 z-50 bg-sage-500 hover:bg-sage-600 text-white w-16 h-16 rounded-full shadow-[0_8px_30px_rgba(85,107,92,0.4)] hover:shadow-[0_12px_40px_rgba(85,107,92,0.5)] transition-all transform hover:scale-110 flex items-center justify-center"
        >
            <ShoppingCartSimple className="w-9 h-9 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" weight="regular" />
            
            {/* Item Count Badge */}
            <span className="absolute -top-1 -right-1 bg-red-800 text-white min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center text-xs font-bold shadow-[0_4px_12px_rgba(153,27,27,0.6)]">
            {cart.reduce((total, item) => total + item.quantity, 0)}
            </span>
        </button>
        )}

      {/* Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
              <h2 className="text-3xl font-black text-white mb-2">Your Cart</h2>
              <p className="text-white/90 font-medium">
                {cart.length} item{cart.length !== 1 ? 's' : ''} • {cart.reduce((total, item) => total + item.quantity, 0)} total
              </p>
            </div>

            {/* Cart Items */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {cart.map((item) => (
                <div key={item.id} className="bg-cream-50 p-5 rounded-xl mb-4 border border-grey-stroke">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-charcoal-600 mb-2">{item.name}</h3>
                      <p className="text-sage-600 font-semibold">
                        {item.basePrice.toFixed(3)} BD × {item.quantity}
                      </p>
                      {item.selectedVariant && (
                        <p className="text-sm text-charcoal-400 mt-1">
                          Variant: {item.selectedVariant.colorValue || ''} {item.selectedVariant.sizeValue || ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-sage-700">
                        {item.totalPrice.toFixed(3)} BD
                      </p>
                      <button
                        onClick={() => setCart(cart.filter(c => c.id !== item.id))}
                        className="mt-2 text-red-500 hover:text-red-700 font-semibold text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-grey-stroke p-6 bg-cream-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-charcoal-600">Total:</span>
                <span className="text-3xl font-black text-sage-700">
                  {cart.reduce((total, item) => total + item.totalPrice, 0).toFixed(3)} BD
                </span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCartModal(false)}
                  className="flex-1 bg-grey-200 hover:bg-grey-300 text-charcoal-600 font-bold py-3 rounded-xl transition-all"
                >
                  Continue Shopping
                </button>
                <button
                onClick={() => {
                    setShowCartModal(false);
                    setShowCheckoutModal(true);
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 rounded-xl transition-all"
                >
                Checkout
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowCartModal(false)}
              className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-all"
            >
              <X size={20} className="text-charcoal-600" weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
        {showCheckoutModal && (
        <Checkout
            cart={cart}
            storeName={store?.storeName}
            customerId={customerId}
            customerName={customerName}
            customerAddresses={customerAddresses}
            onClose={() => setShowCheckoutModal(false)}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            showSnackbar={showSnackbar}
        />
        )}
        
{/* Snackbar */}
{snackbar.open && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80]">
    <div 
      className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] transition-all duration-300 ${
        snackbar.type === 'success' ? 'bg-green-500 text-white' :
        snackbar.type === 'error' ? 'bg-red-500 text-white' :
        'bg-yellow-500 text-white'
      }`}
      style={{
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <span className="text-2xl">
        {snackbar.type === 'success' ? '✓' : snackbar.type === 'error' ? '✕' : '⚠'}
      </span>
      <p className="font-semibold">{snackbar.message}</p>
    </div>
  </div>
)}

    </div>
  );
};

export default StoreView;
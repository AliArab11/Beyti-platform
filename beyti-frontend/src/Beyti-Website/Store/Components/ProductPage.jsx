import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Cake, Heart, Star, MagnifyingGlass, ArrowLeft, Bread, ShoppingCartSimple, X, Package, Storefront, Minus, Plus } from "@phosphor-icons/react";

import ActiveOrderBanner from './ActiveOrderBanner';
import Snackbar from './../../../components/Snackbar';

const ProductPage = ({ onAddToCart }) => {
 const { productId, storeId } = useParams();
const location = useLocation();
const navigate = useNavigate();

// Get customer and store info from navigation state - DECLARE THESE FIRST
const customerId = location.state?.customerId;
const customerName = location.state?.customerName;
const storeName = location.state?.storeName;

// Get cart from localStorage
const [localCart, setLocalCart] = useState(() => {
  try {
    if (customerId && storeId) {
      const savedCart = localStorage.getItem(`beyti_cart_${storeId}_${customerId}`);
      if (savedCart) {
        return JSON.parse(savedCart);
      }
    }
  } catch (err) {
    console.error('Error loading cart:', err);
  }
  return [];
});

const cart = localCart; // For backward compatibility

// Poll localStorage for cart updates
useEffect(() => {
  if (!customerId) {
    setLocalCart([]);
    return;
  }

  const updateCart = () => {
    try {
      let allItems = [];
      
      // Check all localStorage keys for this customer
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
      
      setLocalCart(allItems);
    } catch (err) {
      console.error('Error updating cart:', err);
    }
  };

  updateCart();
  
  // Update cart every 500ms to catch changes
  const interval = setInterval(updateCart, 500);
  
  return () => clearInterval(interval);
}, [customerId])

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
  
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');

  const [showDifferentStoreModal, setShowDifferentStoreModal] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState(null);

  const [bannerDismissed, setBannerDismissed] = useState(() => {
  return localStorage.getItem(`beyti_bannerDismissed_${customerId}`) === 'true';
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

const showSnackbar = (message, type = 'success') => {
  console.log('🎯 ProductPage showSnackbar called:', message, type);
  console.log('🎯 Current snackbar state:', snackbar);
  setSnackbar({ open: true, message, type });
  console.log('🎯 After setState - should show now');
};
const [activeOrder, setActiveOrder] = useState(null);

const [orders, setOrders] = useState([]);


  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  // Reset banner dismissed state when customer changes
useEffect(() => {
  if (customerId) {
    const dismissed = localStorage.getItem(`beyti_bannerDismissed_${customerId}`) === 'true';
    setBannerDismissed(dismissed);
  }
}, [customerId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch product details
      const productRes = await fetch(`https://localhost:7062/api/Products/${productId}`);
      if (productRes.ok) {
        const productData = await productRes.json();
        setProduct(productData);
      }

      // Fetch variants
      const variantsRes = await fetch(`https://localhost:7062/api/ProductVariants?productId=${productId}`);
      if (variantsRes.ok) {
        const variantsData = await variantsRes.json();
        setVariants(variantsData);
        if (variantsData.length > 0) {
          setSelectedVariant(variantsData[0]);
        }
      }

      // Fetch reviews
      const reviewsRes = await fetch(`https://localhost:7062/api/Reviews?productId=${productId}`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        const visibleReviews = reviewsData.filter(r => !r.isCommentHiddenBySeller);
        setReviews(visibleReviews);
      }
    } catch (err) {
      console.error('Error loading product:', err);
      showSnackbar('Failed to load product details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

const handleAddToCart = () => {
    if (!product) return;
    
    // Check available stock
    const maxStock = selectedVariant?.stockQty || 0;
    
    const item = {
        id: product.id,
        name: product.name,
        basePrice: selectedVariant?.price || product.basePrice,
        quantity: quantity,
        totalPrice: (selectedVariant?.price || product.basePrice) * quantity,
        selectedVariant: selectedVariant,
        storeName: storeName,
        sellerId: storeId
    };
    
    console.log('🛒 ProductPage: Creating cart item with quantity:', quantity);
    console.log('📦 Full item:', item);
    
    // Get existing cart from localStorage - CHECK ALL STORES
    let existingCart = [];
    let existingStoreId = null;
    
    try {
        // Check all cart keys for this customer
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
                const savedCart = localStorage.getItem(key);
                if (savedCart) {
                    const parsedCart = JSON.parse(savedCart);
                    if (parsedCart.length > 0) {
                        existingCart = parsedCart;
                        // Extract storeId from key: beyti_cart_{storeId}_{customerId}
                        const parts = key.split('_');
                        existingStoreId = parts[2];
                        break;
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error reading cart:', err);
    }
    
    console.log('🔍 Existing cart store ID:', existingStoreId);
    console.log('🔍 Current store ID:', storeId);
    console.log('🔍 Existing cart:', existingCart);
    
    // Check if cart has items from a different store
    if (existingCart.length > 0 && existingStoreId && existingStoreId !== storeId.toString()) {
        console.log('⚠️ Different store detected! Showing modal.');
        setPendingCartItem(item);
        setShowDifferentStoreModal(true);
        return;
    }
    
    // ✅ NEW: Check if adding this quantity would exceed stock
    const existingItem = existingCart.find(cartItem => {
        const sameProduct = cartItem.id === item.id;
        const sameVariant = (!cartItem.selectedVariant && !item.selectedVariant) ||
                            (cartItem.selectedVariant?.id === item.selectedVariant?.id);
        return sameProduct && sameVariant;
    });
    
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const totalQuantity = currentCartQuantity + quantity;
    
    if (totalQuantity > maxStock) {
        showSnackbar(
            `Cannot add ${quantity} more. You already have ${currentCartQuantity} in cart. Only ${maxStock} available in stock.`,
            'warning'
        );
        return;
    }
    
    // Same store or empty cart - proceed with adding
    addItemToCart(item);
};

    // Helper function to actually add the item
    const addItemToCart = (item) => {
    const cartKey = `beyti_cart_${storeId}_${customerId}`;
    let existingCart = [];
    
    try {
        const savedCart = localStorage.getItem(cartKey);
        if (savedCart) {
        existingCart = JSON.parse(savedCart);
        }
    } catch (err) {
        console.error('Error reading cart:', err);
    }
    
    // Find if item exists
    const existingItemIndex = existingCart.findIndex(cartItem => {
        const sameProduct = cartItem.id === item.id;
        const sameVariant = (!cartItem.selectedVariant && !item.selectedVariant) ||
                            (cartItem.selectedVariant?.id === item.selectedVariant?.id);
        return sameProduct && sameVariant;
    });
    
    if (existingItemIndex !== -1) {
        // Update existing item
        existingCart[existingItemIndex].quantity += item.quantity;
        existingCart[existingItemIndex].totalPrice = 
        existingCart[existingItemIndex].basePrice * existingCart[existingItemIndex].quantity;
        console.log('✅ Updated existing item in cart');
    } else {
        // Add new item
        existingCart.push(item);
        console.log('✅ Added new item to cart');
    }
    
    // Save back to localStorage
    localStorage.setItem(cartKey, JSON.stringify(existingCart));
    console.log('💾 Saved updated cart to localStorage:', existingCart);
    
    
    // Navigate back
    navigate(`/store/${storeId}`, {
        state: {
        customerId,
        customerName,
        itemAdded: true,  // ⬅️ ADD THIS
        itemName: item.name,  // ⬅️ ADD THIS
        itemQuantity: item.quantity 
        }
    });
    };

const handleClearAndAdd = () => {
  console.log('🔄 handleClearAndAdd called');
  if (!pendingCartItem) {
    console.log('❌ No pending cart item');
    return;
  }
  
  console.log('🔄 Pending item:', pendingCartItem);
  
  // Find and clear old store's cart
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
        localStorage.removeItem(key);
        console.log('🗑️ Cleared cart from key:', key);
      }
    }
  } catch (err) {
    console.error('Error clearing old cart:', err);
  }
  
  const itemName = pendingCartItem.name;
  console.log('📝 Item name stored:', itemName);
  
  // Add the new item
  addItemToCart(pendingCartItem);
  
  // Close modal
  setShowDifferentStoreModal(false);
  setPendingCartItem(null);
  
  console.log('🎉 About to show snackbar for:', itemName);
  showSnackbar(`Cleared previous cart and added ${itemName}!`, 'success');
  console.log('🎉 Snackbar function called');
};

const handleCancelAdd = () => {
  setShowDifferentStoreModal(false);
  setPendingCartItem(null);
  showSnackbar('Item not added to cart', 'warning');
};

const handleDismissBanner = () => {
  setBannerDismissed(true);
  localStorage.setItem(`beyti_bannerDismissed_${customerId}`, 'true');
};

const handleTrackOrder = () => {
  navigate('/customer-dashboard');
};

  const averageRating = calculateAverageRating();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-grey-stroke border-t-sage-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-bold text-charcoal-600 mb-2">Product Not Found</h3>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-3 bg-sage-500 text-white rounded-lg hover:bg-sage-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-cream-50 py-4 px-8 border-b border-grey-stroke sticky top-0 z-10">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
                onClick={() => navigate(`/store/${storeId}`, { 
                    state: { customerId, customerName },
                    replace: true 
                })}
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

            {/* Cart Button with Badge */}
                <button
                    onClick={() => {
                        navigate("/checkout", {
                            state: {
                                customerId,
                                customerName,
                                storeId,
                                storeName
                            }
                        });
                    }}
                    className="p-2 hover:bg-grey-200 rounded-lg transition-all relative"
                >
                    <ShoppingCartSimple className="w-5 h-5 text-charcoal-400" weight="regular" />
                    {localCart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-sage-500 text-white min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold">
                            {localCart.reduce((total, item) => total + item.quantity, 0)}
                        </span>
                    )}
                </button>

            
            {customerName ? (
              <div className="flex items-center border-l border-grey-stroke pl-4">
                <button
                  onClick={() => navigate('/customer-dashboard')}
                  className="flex items-center gap-3 hover:bg-grey-200 rounded-lg px-3 py-2 transition-all"
                >
                  <div className="w-8 h-8 bg-sage-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{customerName[0]}</span>
                  </div>
                  <span className="text-charcoal-600 font-medium text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {customerName}
                  </span>
                </button>
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

      {/* Main Content */}
<main className="max-w-[1400px] mx-auto px-8 py-12">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
    {/* Left: Product Image */}
    <div className="bg-white rounded-3xl p-12 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <div className="relative aspect-square bg-gradient-to-br from-sage-100 to-sage-200 rounded-2xl flex items-center justify-center">
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:scale-110 transition-transform z-10"
        >
          <Heart 
            size={24} 
            weight={isFavorite ? "fill" : "regular"} 
            className={isFavorite ? "text-red-500" : "text-charcoal-600"}
          />
        </button>
        
        <div className="w-80 h-80 bg-white/30 rounded-full flex items-center justify-center">
          <Package size={120} className="text-white/60" weight="thin" />
        </div>
      </div>
    </div>

    {/* Right: Product Info */}
    <div className="flex flex-col">
      {/* Store Name */}
      {storeName && (
        <p className="text-sage-600 font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          {storeName}
        </p>
      )}
      
      {/* Product Title */}
      <h1 className="text-5xl font-bold text-charcoal-600 mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
        {product.name}
      </h1>
      
      {/* Rating */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={24} 
                weight="fill" 
                className={i < Math.round(averageRating) ? "text-[#F5C563]" : "text-grey-stroke"}
              />
            ))}
          </div>
          <span className="text-2xl font-bold text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            {averageRating}
          </span>
          <span className="text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            ({reviews.length} Reviews)
          </span>
        </div>
      )}

      {/* Description with View More */}
      {product.description && (
        <div className="mb-6">
          <div className={`text-charcoal-600 leading-relaxed ${activeTab === 'description' ? '' : 'line-clamp-3'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
            {product.description}
          </div>
          {product.description.length > 150 && (
            <button
              onClick={() => setActiveTab(activeTab === 'description' ? '' : 'description')}
              className="text-sage-600 font-semibold mt-2 hover:text-sage-700 text-sm"
            >
              {activeTab === 'description' ? '← Show Less' : 'View More →'}
            </button>
          )}
        </div>
      )}

      {/* Price */}
      <div className="mb-8">
        <p className="text-6xl font-black text-sage-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          {(selectedVariant?.price || product.basePrice).toFixed(3)} BD
        </p>
        {product.subCategory && (
          <div className="flex gap-2 mt-4">
            <span className="bg-sage-100 text-sage-700 text-sm font-semibold px-4 py-2 rounded-full">
              {product.subCategory.name}
            </span>
            {product.subCategory.category && (
              <span className="bg-cream-100 text-charcoal-600 text-sm font-semibold px-4 py-2 rounded-full">
                {product.subCategory.category.name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Variants */}
      {variants.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-charcoal-600 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Select Variant
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {variants.map(variant => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={`p-4 rounded-xl font-semibold transition-all border-2 ${
                  selectedVariant?.id === variant.id
                    ? 'bg-sage-500 text-white border-sage-500 shadow-md'
                    : 'bg-white text-charcoal-600 border-grey-stroke hover:border-sage-500'
                }`}
              >
                <div className="text-sm">
                  {variant.colorValue && <div className="font-bold mb-1">{variant.colorValue}</div>}
                  {variant.sizeValue && <div className="font-bold mb-1">{variant.sizeValue}</div>}
                  {variant.price && (
                    <div className={`text-xs font-semibold mt-2 ${
                      selectedVariant?.id === variant.id ? 'text-white' : 'text-charcoal-500'
                    }`}>
                      {variant.price.toFixed(3)} BD
                    </div>
                  )}
                  {variant.stockQty !== undefined && (
                    <div className={`text-xs mt-1 ${
                      selectedVariant?.id === variant.id ? 'text-white/80' : 'text-charcoal-400'
                    }`}>
                      {variant.stockQty > 0 ? `${variant.stockQty} in stock` : 'Out of stock'}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

     {/* Quantity & Add to Cart */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.08)] mb-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-cream-100 rounded-xl p-3 border-2 border-grey-stroke">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              <Minus size={20} weight="bold" className="text-charcoal-600" />
            </button>
            <span className="w-16 text-center text-3xl font-black text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {quantity}
            </span>
            <button
              onClick={() => {
                const maxStock = selectedVariant?.stockQty || 0;
                if (quantity < maxStock) {
                  setQuantity(quantity + 1);
                }
              }}
              disabled={!selectedVariant || selectedVariant.stockQty === 0 || quantity >= (selectedVariant?.stockQty || 0)}
              className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              <Plus size={20} weight="bold" className="text-charcoal-600" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stockQty === 0}
            className="flex-1 bg-sage-500 hover:bg-sage-600 text-white font-bold py-5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            <ShoppingCartSimple size={26} weight="bold" />
            <span>{(!selectedVariant || selectedVariant.stockQty === 0) ? 'Out of Stock' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
      </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-grey-stroke">
          </div>

          {/* Reviews Section */}
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden p-12">
            <h2 className="text-3xl font-bold text-charcoal-600 mb-8" style={{ fontFamily: 'Merriweather, serif' }}>
                Customer Reviews
            </h2>
            
            {reviews.length > 0 ? (
                <>
                {/* Reviews Summary */}
                <div className="flex items-start gap-12 mb-12 pb-12 border-b border-grey-stroke">
                    <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-7xl font-black text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {averageRating}
                        </span>
                        <span className="text-3xl text-charcoal-400 font-medium">/ 5</span>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                        <Star 
                            key={i} 
                            size={28} 
                            weight="fill" 
                            className={i < Math.round(averageRating) ? "text-[#F5C563]" : "text-grey-stroke"}
                        />
                        ))}
                    </div>
                    <span className="text-lg text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </span>
                    </div>

                    {/* Rating Distribution */}
                    <div className="flex-1 space-y-4">
                    {[5, 4, 3, 2, 1].map(rating => {
                        const count = reviews.filter(r => r.rating === rating).length;
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                        <div key={rating} className="flex items-center gap-4">
                            <span className="text-lg font-semibold text-charcoal-600 w-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {rating}
                            </span>
                            <Star size={20} weight="fill" className="text-[#F5C563]" />
                            <div className="flex-1 h-4 bg-cream-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-[#F5C563] rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            />
                            </div>
                            <span className="text-lg font-medium text-charcoal-400 w-16 text-right" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {count}
                            </span>
                        </div>
                        );
                    })}
                    </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-8">
                    {reviews.map((review) => (
                    <div key={review.id} className="bg-cream-50 p-8 rounded-2xl border border-grey-stroke">
                        <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {(review.customerName || 'A')[0].toUpperCase()}
                            </span>
                            </div>
                            
                            <div>
                            <div className="font-bold text-charcoal-600 text-xl mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {review.customerName || 'Anonymous Customer'}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                    key={i} 
                                    size={20} 
                                    weight="fill" 
                                    className={i < review.rating ? "text-[#F5C563]" : "text-grey-stroke"}
                                    />
                                ))}
                                </div>
                                <span className="text-charcoal-400 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {formatDate(review.createdAt)}
                                </span>
                            </div>
                            </div>
                        </div>
                        </div>

                        {review.comment && (
                        <p className="text-charcoal-600 text-lg leading-relaxed ml-20" style={{ fontFamily: 'Inter, sans-serif' }}>
                            "{review.comment}"
                        </p>
                        )}
                    </div>
                    ))}
                </div>
                </>
            ) : (
                <div className="text-center py-16">
                <div className="w-24 h-24 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Star size={48} className="text-grey-stroke" />
                </div>
                <h3 className="text-2xl font-bold text-charcoal-600 mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
                    No Reviews Yet
                </h3>
                <p className="text-lg text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Be the first to share your thoughts about this product!
                </p>
                </div>
            )}
        </div>
        </div>
      </main>
     {/* Different Store Modal */}
{showDifferentStoreModal && (
  <div className="fixed inset-0 bg-charcoal-600/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
    <div className="relative bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-full max-w-2xl overflow-hidden border-2 border-grey-stroke">
      
      {/* Header with Sage Green Brand Colors */}
      <div className="relative bg-gradient-to-br from-sage-500 to-sage-700 px-6 py-5">
        <div className="absolute top-3 right-3 w-16 h-16 bg-white/10 rounded-full" />
        
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <ShoppingCartSimple size={24} weight="bold" className="text-sage-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>
              Different Store Detected
            </h3>
            <p className="text-sm text-sage-100" style={{ fontFamily: 'Inter, sans-serif' }}>
              You can only order from one store at a time
            </p>
          </div>
        </div>
      </div>

      {/* Content - Horizontal Layout */}
      <div className="p-6">
        {/* Instruction Message */}
        <div className="bg-cream-100 border-l-4 border-sage-500 rounded-lg p-4 mb-5">
          <p className="text-body-regular text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            Your cart has items from <span className="font-bold">{cart[0]?.storeName || 'another store'}</span>. 
            Would you like to clear your cart and add this new item, or keep your current cart?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Current Cart Store */}
          <div className="bg-cream-50 border-2 border-grey-stroke rounded-xl p-4">
            <p className="text-xs font-bold text-sage-700 uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Current Cart
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-sage-500 to-sage-700 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                <Storefront size={24} weight="fill" className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-charcoal-600 truncate text-sm" style={{ fontFamily: 'Merriweather, serif' }}>
                  {cart[0]?.storeName || 'Another Store'}
                </p>
                <p className="text-xs text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {cart.length} item{cart.length !== 1 ? 's' : ''} • {cart.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(3)} BD
                </p>
              </div>
            </div>
          </div>

          {/* New Item to Add */}
          {pendingCartItem && (
            <div className="bg-sage-100 border-2 border-sage-500 rounded-xl p-4">
              <p className="text-xs font-bold text-sage-700 uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                New Item
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md border-2 border-sage-500 flex-shrink-0">
                  <Package size={24} className="text-sage-700" weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-charcoal-600 truncate text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {pendingCartItem.name}
                  </p>
                  <p className="text-xs text-sage-700 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {pendingCartItem.basePrice.toFixed(3)} BD
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClearAndAdd}
            className="flex-1 bg-sage-500 hover:bg-sage-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-soft-lift hover:shadow-[0_6px_20px_rgba(85,107,92,0.3)] flex items-center justify-center gap-2 text-sm"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <ShoppingCartSimple size={18} weight="bold" />
            <span>Clear Cart & Add Item</span>
          </button>
          
          <button
            onClick={handleCancelAdd}
            className="flex-1 bg-grey-200 border-2 border-grey-stroke hover:bg-cream-100 text-charcoal-600 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <X size={18} weight="bold" />
            <span>Keep Current Cart</span>
          </button>
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

export default ProductPage;
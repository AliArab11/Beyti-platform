import { useState, useEffect } from "react";
// Add this Toast component
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Determine toast color based on message type
  const isWarning = message.includes('⚠️');
  const isSuccess = message.includes('✅');
  const isInfo = message.includes('🛒');
  
  const bgColor = isWarning 
    ? '!from-orange-500 !to-yellow-500' 
    : isInfo
    ? '!from-blue-500 !to-cyan-500'
    : '!from-green-500 !to-emerald-500';

  return (
    <div className="fixed top-8 right-8 z-[100] animate-slideIn">
      <div className={`!bg-gradient-to-r ${bgColor} !text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}>
        <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isSuccess && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
          {isWarning && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          )}
          {isInfo && (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
        </svg>
        <span className="font-bold text-base flex-1">{message}</span>
        <button onClick={onClose} className="ml-2 hover:!bg-white/20 rounded-full p-1 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const FIXED_DELIVERY_FEE = 5.00;

const StoresPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  // Checkout modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("Delivery");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const [productVariants, setProductVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const [productReviews, setProductReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showCartPreview, setShowCartPreview] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchSellers();
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await fetch('https://localhost:7062/api/Customers');
      
      if (!response.ok) {
        throw new Error('Failed to load customers');
      }

      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      console.error("Error loading customers:", err);
      alert("Failed to load customers: " + err.message);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://localhost:7062/api/Sellers');
      
      if (!response.ok) {
        throw new Error('Failed to load sellers');
      }

      const data = await response.json();
      setSellers(data);
    } catch (err) {
      setError(err.message || "Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  const handleStoreClick = async (storeId) => {
     // Clear cart if switching to a different store
  if (cart.length > 0 && cart[0].sellerId !== storeId) {
    setCart([]);
    setToastMessage("🛒 Cart cleared - switched to different store");
  }
  
    try {
      setLoadingDetails(true);
      setSelectedStoreId(storeId);
      
      const response = await fetch(`https://localhost:7062/api/Sellers/${storeId}/products`);
      
      if (!response.ok) {
        throw new Error(`Failed to load store details`);
      }

      const data = await response.json();
      setSelectedStore(data);
    } catch (err) {
      console.error("Error loading store details:", err);
      alert("Failed to load store details: " + err.message);
      setSelectedStoreId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBackToStores = () => {
    setSelectedStoreId(null);
    setSelectedStore(null);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    fetchProductReviews(product.id); 
    fetchProductVariants(product.id);
  };

  const closeProductModal = () => {
  setSelectedProduct(null);
  setProductReviews([]); // Clear reviews
  setProductVariants([]); // Clear variants
  setSelectedVariant(null); // Clear selected variant
};

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
  };

  const handleChangeCustomer = () => {
    setShowCustomerModal(true);
    setSelectedStoreId(null);
    setSelectedStore(null);
  };

  const handleSkipCustomerSelection = () => {
    setShowCustomerModal(false);
    setSelectedCustomer(null);
  };

const handleAddToCart = (product) => {
  if (!selectedCustomer) {
    setToastMessage("⚠️ Please select a customer first!");
    setShowCustomerModal(true);
    return;
  }
  
  // Check if cart has items from a different store
  if (cart.length > 0 && cart[0].sellerId !== selectedStore.id) {
    setCart([]);
    setToastMessage("⚠️ Cart cleared - can only order from one store at a time");
    
    // Wait a bit before showing the next toast
    setTimeout(() => {
      // Add new item after clearing
      setCart([{ ...product, quantity: 1, sellerId: selectedStore.id, storeName: selectedStore.storeName }]);
      setToastMessage(`✅ ${product.name} added to cart!`);
    }, 500);
  } else {
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Increase quantity
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      setToastMessage(`✅ Increased quantity of ${product.name}`);
    } else {
      // Add new item
      setCart([...cart, { ...product, quantity: 1, sellerId: selectedStore.id, storeName: selectedStore.storeName }]);
      setToastMessage(`✅ ${product.name} added to cart!`);
    }
  }
  
  // Close the product modal if it's open with a slight delay so toast appears first
  if (selectedProduct) {
    setTimeout(() => {
      closeProductModal();
    }, 100);
  }
};

const removeFromCart = (productId) => {
  setCart(cart.filter(item => item.id !== productId));
};

const updateCartQuantity = (productId, newQuantity) => {
  if (newQuantity < 1) return;
  setCart(cart.map(item => 
    item.id === productId ? { ...item, quantity: newQuantity } : item
  ));
};

const clearCart = () => {
  setCart([]);
};

 

const fetchProductReviews = async (productId) => {
  try {
    setLoadingReviews(true);
    const response = await fetch(`https://localhost:7062/api/Reviews?productId=${productId}`);
    if (response.ok) {
      const data = await response.json();
      // Filter out reviews that are hidden by seller
      const visibleReviews = data.filter(review => !review.isCommentHiddenBySeller);
      setProductReviews(visibleReviews);
    }
  } catch (err) {
    console.error("Error loading reviews:", err);
  } finally {
    setLoadingReviews(false);
  }
};

const fetchProductVariants = async (productId) => {
  try {
    setLoadingVariants(true);
    const response = await fetch(`https://localhost:7062/api/ProductVariants?productId=${productId}`);
    if (response.ok) {
      const data = await response.json();
      setProductVariants(data);
      if (data.length > 0) {
        setSelectedVariant(data[0]); // Select first variant by default
      }
    }
  } catch (err) {
    console.error("Error loading variants:", err);
  } finally {
    setLoadingVariants(false);
  }
};

  const closeCheckoutModal = () => {
    setShowCheckoutModal(false);
    setCheckoutProduct(null);
    setQuantity(1);
    setSelectedDeliveryAddress("");
    setOrderError(null);
  };


    const subtotal = cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    

  const handlePlaceOrder = async () => {
    try {
      setPlacingOrder(true);
      setOrderError(null);

      // Validation
    if (!cart || cart.length === 0) {
      setOrderError("Your cart is empty");
      return;
    }

    if (!selectedCustomer) {
      setOrderError("Please select a customer");
      return;
    }

    if (fulfillmentType === "Delivery" && !selectedDeliveryAddress) {
      setOrderError("Please select a delivery address");
      return;
    }

      // Get sellerId from cart (all items should be from same store)
      const sellerId = cart[0]?.sellerId;

      if (!sellerId) {
        setOrderError("Cart is empty or missing store information");
        return;
      }

      // Try to get pickup address if selectedStore exists
      const pickupAddressId = selectedStore?.sellerAddresses?.[0]?.addressId || null;

      const subtotal = cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
      const deliveryFee = fulfillmentType === "Delivery" ? FIXED_DELIVERY_FEE : 0;
      const total = subtotal + deliveryFee;

      // Create order - Note the PascalCase for C# API
      const orderData = {
        CustomerId: selectedCustomer.id,
        SellerId: sellerId,
        DeliveryAddressId: fulfillmentType === "Delivery" ? parseInt(selectedDeliveryAddress) : null,
        PickupAddressId: pickupAddressId,
        PaymentMethod: paymentMethod,
        PaymentStatus: "Pending",
        FulfillmentType: fulfillmentType,
        Status: "Placed",
        SubtotalAmount: subtotal,
        DeliveryFee: deliveryFee,
        TotalAmount: total,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      };

      console.log("Creating order:", orderData);

      const orderResponse = await fetch('https://localhost:7062/api/Orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        throw new Error(`Failed to create order: ${errorText}`);
      }

      const createdOrder = await orderResponse.json();
      console.log("Order created:", createdOrder);

      

      // Create order items for all cart items
for (const cartItem of cart) {
  let variantId = null;
  
  try {
    const variantsResponse = await fetch(`https://localhost:7062/api/ProductVariants?productId=${cartItem.id}`);
    
    if (variantsResponse.ok) {
      const variants = await variantsResponse.json();
      
      if (variants && variants.length > 0) {
        variantId = variants[0].id;
      } else {
        const createVariantResponse = await fetch('https://localhost:7062/api/ProductVariants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ProductId: cartItem.id,
            ColorValue: null,
            SizeValue: null,
            SKU: `DEFAULT-${cartItem.id}`,
            Price: cartItem.basePrice,
            StockQty: 999
          }),
        });

        if (createVariantResponse.ok) {
          const newVariant = await createVariantResponse.json();
          variantId = newVariant.id;
        }
      }
    }

    if (variantId) {
      await fetch('https://localhost:7062/api/OrderItems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          OrderId: createdOrder.id,
          ProductVariantId: variantId,
          Qty: cartItem.quantity,
          UnitPrice: cartItem.basePrice
        }),
      });
    }
  } catch (err) {
    console.error(`Error adding item ${cartItem.name}:`, err);
  }
}

// Clear cart and close modals
clearCart();
setToastMessage(`✅ Order #${createdOrder.id} placed successfully! Total: $${total.toFixed(2)}`);
closeCheckoutModal();


      

    } catch (err) {
      console.error("Error placing order:", err);
      setOrderError(err.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.storeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.fullName?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  // Customer Selection Modal
  if (showCustomerModal) {
    return (
      <>
        {/* Toast Notification */}
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        )}
      <div className="fixed inset-0 !bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="!bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-fadeIn relative">
          {/* Close Button */}
          <button
            onClick={handleSkipCustomerSelection}
            className="absolute top-6 right-6 z-10 !bg-gray-200 hover:!bg-gray-300 !text-gray-700 p-3 rounded-full shadow-lg transition-all transform hover:scale-110"
            title="Skip customer selection"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="!bg-gradient-to-r !from-blue-600 !to-purple-600 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 !bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 !bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
            
            <div className="relative">
              <div className="!bg-white/20 backdrop-blur-sm w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <svg className="w-14 h-14 !text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-5xl font-black !text-white mb-3">Select Customer</h2>
              <p className="text-2xl !text-white/90 font-medium">Choose who will be placing this order</p>
              <p className="text-lg !text-white/70 font-medium mt-2">or skip to browse without a customer</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-8 border-b-2 border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full !bg-gray-50 !text-gray-900 placeholder-gray-400 px-8 py-5 pl-16 rounded-2xl border-2 !border-gray-200 focus:!border-blue-500 focus:outline-none text-lg font-medium transition-all shadow-sm focus:shadow-lg"
              />
              <svg className="absolute left-6 top-1/2 transform -translate-y-1/2 w-7 h-7 !text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {filteredCustomers.length > 0 && (
              <p className="mt-4 !text-gray-600 text-sm font-medium text-center">
                {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {/* Customer List */}
          <div className="p-8 overflow-y-auto max-h-[50vh]">
            {loadingCustomers ? (
              <div className="text-center py-16">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="w-20 h-20 border-4 !border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 !border-transparent border-r-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
                </div>
                <p className="text-xl font-bold !text-gray-800">Loading customers...</p>
              </div>
            ) : filteredCustomers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className="group !bg-gradient-to-br !from-gray-50 !to-blue-50 hover:!from-blue-100 hover:!to-purple-100 rounded-2xl p-6 text-left border-2 !border-gray-200 hover:!border-blue-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl"
                  >
                    <div className="flex items-start gap-5">
                      <div className="!bg-gradient-to-br !from-blue-600 !to-purple-600 p-4 rounded-xl shadow-lg group-hover:rotate-6 transition-transform flex-shrink-0">
                        <svg className="w-7 h-7 !text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black !text-gray-900 mb-3 group-hover:!text-blue-600 transition-colors truncate">
                          {customer.fullName || 'Unnamed Customer'}
                        </h3>
                        {customer.email && (
                          <div className="!bg-white px-4 py-2 rounded-lg mb-2 flex items-center gap-2 shadow-sm">
                            <svg className="w-5 h-5 !text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="!text-gray-700 text-sm font-medium truncate">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="!bg-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                            <svg className="w-5 h-5 !text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="!text-gray-700 text-sm font-medium truncate">{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="!bg-gradient-to-br !from-gray-100 !to-blue-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-16 h-16 !text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-black !text-gray-900 mb-3">No Customers Found</h3>
                <p className="!text-gray-600 text-lg mb-8">Try adjusting your search or add new customers</p>
                <button 
                  onClick={() => setCustomerSearchQuery("")}
                  className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        {/* Toast Notification */}
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        )}
      <div className="flex items-center justify-center min-h-screen !bg-gradient-to-br !from-blue-50 !via-indigo-50 !to-purple-50">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 border-4 !border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 !border-transparent border-r-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          </div>
          <p className="mt-6 text-xl font-bold !text-gray-800 animate-pulse">Loading stores...</p>
        </div>
      </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {/* Toast Notification */}
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        )}
      <div className="flex items-center justify-center min-h-screen !bg-gradient-to-br !from-red-50 !to-orange-50">
        <div className="max-w-md w-full !bg-white shadow-2xl rounded-3xl p-8 border-l-4 !border-red-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="!bg-red-100 p-4 rounded-full">
              <svg className="w-8 h-8 !text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold !text-gray-900">Error Loading Stores</h2>
          </div>
          <p className="!text-gray-700 mb-6 text-lg">{error}</p>
          <button 
            onClick={fetchSellers} 
            className="w-full !bg-gradient-to-r !from-red-500 !to-orange-500 hover:!from-red-600 hover:!to-orange-600 !text-white py-3 px-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Retry
          </button>
        </div>
      </div>
      </>
    );
  }

  // Store Details View
  if (selectedStoreId && selectedStore) {
    return (
      <div className="min-h-screen !bg-gradient-to-br !from-slate-50 !via-blue-50 !to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
         {/* Toast Notification */}
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        )}
        
        <div className="max-w-7xl mx-auto">
          {/* Customer Info Bar */}
          {selectedCustomer && (
            <div className="mb-6 !bg-gradient-to-r !from-blue-600 !to-purple-600 rounded-2xl p-3 shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="!bg-white/20 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                  <svg className="w-5 h-5 !text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm !text-white/90 font-bold mb-1">Ordering for</p>
                  <p className="text-lg font-black !text-white">{selectedCustomer.fullName}</p>
                  {selectedCustomer.email && (
                    <p className="text-sm !text-white/80 font-medium mt-1">{selectedCustomer.email}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleChangeCustomer}
                className="!bg-white hover:!bg-gray-100 !text-blue-600 px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Change Customer
              </button>
            </div>
            
          )}

          {/* Floating Cart - Always Visible */}
<div className="fixed bottom-8 right-8 z-50">
      <button 
      onClick={() => setShowCartModal(true)}
      onMouseEnter={() => setShowCartPreview(true)}
      onMouseLeave={() => setShowCartPreview(false)}
      className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white p-5 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-lg transition-all transform hover:scale-110 relative"
    >
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    <span>Cart</span>
    {cart.length > 0 && (
      <span className="absolute -top-2 -right-2 !bg-red-500 !text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shadow-lg">
        {cart.length}
      </span>
    )}
  </button>
  
  {/* Mini Cart Preview */}
  {cart.length > 0 && showCartPreview && (
    <div className="absolute bottom-full right-0 mb-4 !bg-white rounded-2xl shadow-2xl p-4 w-80 max-h-96 overflow-y-auto">
      <h3 className="font-black !text-gray-900 mb-3 text-lg">Quick View</h3>
      <div className="space-y-2">
        {cart.map((item) => (
          <div key={item.id} className="!bg-gray-50 p-3 rounded-xl flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <p className="font-bold !text-gray-900 text-sm truncate">{item.name}</p>
              <p className="text-xs !text-gray-600">Qty: {item.quantity}</p>
            </div>
            <p className="font-black !text-blue-600 text-sm ml-2">
              ${(item.basePrice * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t-2 border-gray-200 flex justify-between items-center">
        <span className="font-bold !text-gray-900">Total:</span>
        <span className="text-xl font-black !text-blue-600">
          ${cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0).toFixed(2)}
        </span>
      </div>
      <button
        onClick={() => setShowCartModal(true)}
        className="w-full mt-3 !bg-gradient-to-r !from-blue-600 !to-purple-600 !text-white font-bold py-2 rounded-xl hover:!from-blue-700 hover:!to-purple-700 transition-all"
      >
        View Full Cart
      </button>
    </div>
  )}
</div>

          {/* Back Button */}
          <button
            onClick={handleBackToStores}
            className="group mb-8 flex items-center gap-3 !bg-white hover:!bg-blue-600 !text-blue-600 hover:!text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Stores
          </button>

          {/* Store Header Card */}
          <div className="!bg-gradient-to-br !from-white !to-blue-50 shadow-2xl rounded-3xl border-2 !border-blue-200 p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 !bg-gradient-to-br !from-blue-400 !to-purple-400 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
            
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-5xl font-black !text-gray-900 mb-4">{selectedStore.storeName}</h1>
                
                <div className="flex flex-wrap items-center gap-4">
                  {selectedStore.phone && (
                    <div className="flex items-center gap-2 !bg-white px-4 py-2 rounded-xl shadow-md">
                      <svg className="w-5 h-5 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-bold !text-gray-800">{selectedStore.phone}</span>
                    </div>
                  )}
                  <div className="!bg-gradient-to-r !from-green-500 !to-emerald-500 !text-white text-sm font-bold px-6 py-2 rounded-xl shadow-lg">
                    {selectedStore.products?.length || 0} Products
                  </div>
                </div>
              </div>
              
              <div className="!bg-gradient-to-br !from-blue-600 !to-purple-600 p-6 rounded-3xl shadow-2xl transform hover:rotate-6 transition-transform">
                <svg className="w-16 h-16 !text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>

            {/* Store Locations */}
            {selectedStore.sellerAddresses && selectedStore.sellerAddresses.length > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-xl font-black !text-gray-900">Store Locations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedStore.sellerAddresses.map((sa, idx) => (
                    <div key={idx} className="!bg-white p-5 rounded-2xl border-2 !border-blue-100 hover:!border-blue-300 hover:shadow-xl transition-all transform hover:scale-105">
                      <p className="!text-gray-900 font-bold text-lg mb-1">{sa.address?.street}</p>
                      <p className="!text-gray-600 font-medium">
                        {sa.address?.city}{sa.address?.region && `, ${sa.address.region}`}
                      </p>
                      <p className="!text-blue-600 font-bold mt-2">{sa.address?.country}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Products Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black !text-gray-900 mb-3">Our Products</h2>
            <p className="text-base !text-gray-600 font-medium">
              {selectedStore.products && selectedStore.products.length > 0 
                ? `Browse our collection of ${selectedStore.products.length} product${selectedStore.products.length !== 1 ? 's' : ''}`
                : 'No products available at the moment'
              }
            </p>
          </div>

          {/* Products Grid */}
          {selectedStore.products && selectedStore.products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {selectedStore.products.map((product) => (
                <div key={product.id} className="group !bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl border-2 !border-gray-100 hover:!border-blue-300 transition-all transform hover:scale-105">
                  <div className="relative !bg-gradient-to-br !from-blue-100 !via-purple-100 !to-pink-100 h-48 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 !bg-gradient-to-br !from-blue-500/20 !to-purple-500/20 group-hover:scale-110 transition-transform"></div>
                    <svg className="w-32 h-32 !text-white/50 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <div className="absolute top-4 right-4 !bg-gradient-to-r !from-green-500 !to-emerald-500 !text-white text-2xl font-black px-5 py-3 rounded-2xl shadow-2xl transform rotate-3 group-hover:rotate-6 transition-transform">
                      ${product.basePrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-black !text-gray-900 mb-3 line-clamp-2 group-hover:!text-blue-600 transition-colors">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="!text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    {product.subCategory && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="!bg-gradient-to-r !from-blue-100 !to-purple-100 !text-blue-800 text-xs font-bold px-4 py-2 rounded-full border-2 !border-blue-200">
                          {product.subCategory.name}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleProductClick(product)}
                        className="flex-1 !bg-gradient-to-r !from-gray-600 !to-gray-700 hover:!from-gray-700 hover:!to-gray-800 !text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="!bg-gradient-to-br !from-white !to-gray-50 rounded-3xl p-16 text-center shadow-2xl">
              <div className="!bg-gradient-to-br !from-blue-100 !to-purple-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-3xl font-black !text-gray-900 mb-3">No Products Yet</h3>
              <p className="!text-gray-600 text-lg mb-6">This store is preparing something amazing!</p>
              <button
                onClick={handleBackToStores}
                className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
              >
                Explore Other Stores
              </button>
            </div>
          )}
        </div>

        {/* Product Details Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 !bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="!bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              {/* Close Button */}
              <button
                onClick={closeProductModal}
                className="absolute top-6 right-6 !bg-red-500 hover:!bg-red-600 !text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110 z-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Content */}
              <div className="p-6">
                {/* Product Image */}
                <div className="relative !bg-gradient-to-br !from-blue-100 !via-purple-100 !to-pink-100 h-64 flex items-center justify-center rounded-3xl overflow-hidden mb-8">
                  <div className="absolute inset-0 !bg-gradient-to-br !from-blue-500/20 !to-purple-500/20"></div>
                  <svg className="w-48 h-48 !text-white/50 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <div className="absolute top-6 right-6 !bg-gradient-to-r !from-green-500 !to-emerald-500 !text-white text-3xl font-black px-8 py-4 rounded-2xl shadow-2xl">
                    ${selectedProduct.basePrice.toFixed(2)}
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black !text-gray-900 mb-4">{selectedProduct.name}</h2>
                    {selectedProduct.subCategory && (
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span className="!bg-gradient-to-r !from-blue-100 !to-purple-100 !text-blue-800 text-sm font-bold px-6 py-2 rounded-full border-2 !border-blue-200">
                          {selectedProduct.subCategory.name}
                        </span>
                        {selectedProduct.subCategory.category && (
                          <span className="!bg-gradient-to-r !from-purple-100 !to-pink-100 !text-purple-800 text-sm font-bold px-6 py-2 rounded-full border-2 !border-purple-200">
                            {selectedProduct.subCategory.category.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="!bg-gradient-to-r !from-gray-50 !to-blue-50 p-6 rounded-2xl border-2 !border-gray-100">
                      <h3 className="text-xl font-black !text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-6 h-6 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Description
                      </h3>
                      <p className="!text-gray-700 text-lg leading-relaxed">{selectedProduct.description}</p>
                    </div>
                  )}

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="!bg-gradient-to-br !from-blue-50 !to-indigo-50 p-6 rounded-2xl border-2 !border-blue-100">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-6 h-6 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="font-black !text-gray-900">Price</h4>
                      </div>
                      <p className="text-3xl font-black !text-blue-600">
                        ${(selectedVariant?.price || selectedProduct.basePrice).toFixed(2)}
                      </p>
                    </div>

                    <div className="!bg-gradient-to-br !from-purple-50 !to-pink-50 p-6 rounded-2xl border-2 !border-purple-100">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-6 h-6 !text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h4 className="font-black !text-gray-900">Store</h4>
                      </div>
                      <p className="text-xl font-bold !text-purple-600">{selectedStore.storeName}</p>
                    </div>

                    {selectedProduct.createdAt && (
                      <div className="!bg-gradient-to-br !from-green-50 !to-emerald-50 p-6 rounded-2xl border-2 !border-green-100">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-6 h-6 !text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h4 className="font-black !text-gray-900">Added On</h4>
                        </div>
                        <p className="text-lg font-bold !text-green-600">{new Date(selectedProduct.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    )}

                    {selectedProduct.isActive !== undefined && (
                      <div className="!bg-gradient-to-br !from-orange-50 !to-yellow-50 p-6 rounded-2xl border-2 !border-orange-100">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-6 h-6 !text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 className="font-black !text-gray-900">Status</h4>
                        </div>
                        <p className="text-lg font-bold !text-orange-600">{selectedProduct.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                    )}
                  </div>

                                    {/* Variants Section */}
                  {productVariants.length > 0 && (
                    <div className="!bg-blue-50 p-4 rounded-xl border-2 !border-blue-100">
                      <h3 className="text-lg font-bold !text-gray-900 mb-3">Available Options</h3>
                      <div className="flex flex-wrap gap-2">
                        {productVariants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              selectedVariant?.id === variant.id
                                ? '!bg-blue-600 !text-white shadow-lg'
                                : '!bg-white !text-gray-700 border-2 !border-gray-200 hover:!border-blue-400'
                            }`}
                          >
                            {variant.colorValue && <span>{variant.colorValue}</span>}
                            {variant.colorValue && variant.sizeValue && <span> / </span>}
                            {variant.sizeValue && <span>{variant.sizeValue}</span>}
                            {variant.price && <span className="ml-2 font-bold">${variant.price.toFixed(2)}</span>}
                          </button>
                        ))}
                      </div>
                      {selectedVariant && (
                        <div className="mt-3 text-sm !text-gray-600">
                          <span className="font-medium">Stock: </span>
                          <span className={selectedVariant.stockQty > 0 ? '!text-green-600 font-bold' : '!text-red-600 font-bold'}>
                            {selectedVariant.stockQty > 0 ? `${selectedVariant.stockQty} available` : 'Out of stock'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reviews Section */}
                  <div className="!bg-gray-50 p-4 rounded-xl border-2 !border-gray-100">
                    <h3 className="text-lg font-bold !text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 !text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Customer Reviews ({productReviews.length})
                    </h3>
                    
                    {loadingReviews ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-6 h-6 border-2 !border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="ml-3 text-gray-600">Loading reviews...</p>
                      </div>
                    ) : productReviews.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {productReviews.map((review) => (
                          <div key={review.id} className="!bg-white p-3 rounded-lg border !border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold !text-gray-900 text-sm">{review.customerName}</span>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <svg key={i} className={`w-4 h-4 ${i < review.rating ? '!text-yellow-500' : '!text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="!text-gray-600 text-sm">{review.comment}</p>
                            )}
                            <p className="!text-gray-400 text-xs mt-2">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="!text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6">
                    <button 
                      onClick={() => handleAddToCart(selectedProduct)}
                      className="flex-1 !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Add to Cart
                    </button>
                    <button 
                      onClick={closeProductModal}
                      className="!bg-gray-200 hover:!bg-gray-300 !text-gray-800 font-bold py-4 px-8 rounded-2xl transition-all transform hover:scale-105"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cart Modal */}
{showCartModal && (
  <div className="fixed inset-0 !bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
    <div className="!bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
      {/* Close Button */}
      <button
        onClick={() => setShowCartModal(false)}
        className="absolute top-6 right-6 !bg-red-500 hover:!bg-red-600 !text-white p-3 rounded-full shadow-lg z-10"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="!bg-gradient-to-r !from-blue-600 !to-purple-600 p-8 text-center">
        <h2 className="text-4xl font-black !text-white mb-2">Your Cart</h2>
        <p className="text-xl !text-white/90 font-medium">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="p-8">
        {cart.length > 0 ? (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.id} className="!bg-gray-50 p-6 rounded-2xl border-2 !border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold !text-gray-900 mb-2">{item.name}</h3>
                      <p className="!text-gray-600 mb-2">Store: {item.storeName}</p>
                      <p className="text-2xl font-black !text-blue-600">${item.basePrice.toFixed(2)} each</p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="!bg-gray-200 hover:!bg-gray-300 !text-gray-800 w-10 h-10 rounded-lg font-bold"
                      >
                        −
                      </button>
                      <span className="text-xl font-bold !text-gray-900 w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="!bg-gray-200 hover:!bg-gray-300 !text-gray-800 w-10 h-10 rounded-lg font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="!bg-red-500 hover:!bg-red-600 !text-white p-3 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Item Total */}
                  <div className="mt-4 pt-4 border-t-2 border-gray-200 flex justify-between items-center">
                    <span className="!text-gray-700 font-medium">Item Total:</span>
                    <span className="text-2xl font-black !text-gray-900">${(item.basePrice * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Total */}
            <div className="!bg-gradient-to-br !from-blue-50 !to-purple-50 p-6 rounded-2xl border-2 !border-blue-200 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black !text-gray-900">Cart Total:</span>
                <span className="text-4xl font-black !text-blue-600">
                  ${cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (!selectedCustomer) {
                    setToastMessage("⚠️ Please select a customer first!");
                    setShowCustomerModal(true);
                    return;
                  }
                  if (cart.length === 0) {
                    setToastMessage("⚠️ Your cart is empty!");
                    return;
                  }
                  setShowCartModal(false);
                  setShowCheckoutModal(true);
                }}
                className="flex-1 !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white font-bold py-4 rounded-2xl shadow-lg"
              >
                Proceed to Checkout
              </button>
              <button
                onClick={clearCart}
                className="!bg-red-500 hover:!bg-red-600 !text-white font-bold py-4 px-6 rounded-2xl"
              >
                Clear Cart
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-2xl !text-gray-600 mb-6">Your cart is empty</p>
            <button
              onClick={() => setShowCartModal(false)}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white px-8 py-4 rounded-2xl font-bold"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}

        {/* Checkout Modal */}
        {showCheckoutModal && (
          <div className="fixed inset-0 !bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="!bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              {/* Close Button */}
              <button
                onClick={closeCheckoutModal}
                className="absolute top-6 right-6 !bg-gray-200 hover:!bg-gray-300 !text-gray-700 p-3 rounded-full shadow-lg transition-all transform hover:scale-110 z-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="!bg-gradient-to-r !from-blue-600 !to-purple-600 p-8 text-center">
                <div className="!bg-white/20 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 !text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-black !text-white mb-2">Complete Your Order</h2>
                <p className="text-xl !text-white/90 font-medium">Just a few more details</p>
              </div>

              {/* Form Content */}
              <div className="p-8 space-y-6">
                {orderError && (
                  <div className="!bg-red-50 border-l-4 !border-red-500 p-4 rounded-lg">
                    <p className="!text-red-700 font-medium">{orderError}</p>
                  </div>
                )}

                {/* Cart Summary */}
                  <div className="!bg-gradient-to-br !from-gray-50 !to-blue-50 p-6 rounded-2xl border-2 !border-gray-200">
                    <h3 className="text-xl font-black !text-gray-900 mb-4">Order Items ({cart.length})</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center !bg-white p-3 rounded-lg">
                          <div>
                            <p className="font-bold !text-gray-900">{item.name}</p>
                            <p className="text-sm !text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-black !text-blue-600">${(item.basePrice * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>


                {/* Fulfillment Type */}
                <div>
                  <label className="block text-sm font-bold !text-gray-900 mb-3">
                    Fulfillment Type <span className="!text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFulfillmentType("Delivery")}
                      className={`p-4 rounded-xl border-2 font-bold transition-all transform hover:scale-105 ${
                        fulfillmentType === "Delivery"
                          ? "!bg-blue-600 !border-blue-600 !text-white shadow-lg"
                          : "!bg-white !border-gray-300 !text-gray-700 hover:!border-blue-400"
                      }`}
                    >
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Delivery
                    </button>
                    <button
                      onClick={() => setFulfillmentType("Pickup")}
                      className={`p-4 rounded-xl border-2 font-bold transition-all transform hover:scale-105 ${
                        fulfillmentType === "Pickup"
                          ? "!bg-blue-600 !border-blue-600 !text-white shadow-lg"
                          : "!bg-white !border-gray-300 !text-gray-700 hover:!border-blue-400"
                      }`}
                    >
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Pickup
                    </button>
                  </div>
                </div>

                {/* Delivery Address (only if Delivery selected) */}
                {fulfillmentType === "Delivery" && (
                  <div>
                    <label className="block text-sm font-bold !text-gray-900 mb-3">
                      Delivery Address <span className="!text-red-500">*</span>
                    </label>
                    {selectedCustomer?.customerAddresses && selectedCustomer.customerAddresses.length > 0 ? (
                      <select
                        value={selectedDeliveryAddress}
                        onChange={(e) => setSelectedDeliveryAddress(e.target.value)}
                        className="w-full !border-2 !border-gray-300 rounded-xl p-4 !text-gray-900 font-medium focus:!border-blue-500 focus:outline-none"
                        required
                      >
                        <option value="">Select delivery address</option>
                        {selectedCustomer.customerAddresses.map((ca) => (
                          <option key={ca.id} value={ca.address?.id}>
                            {ca.address?.street}, {ca.address?.city}, {ca.address?.country}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="!bg-yellow-50 border-l-4 !border-yellow-500 p-4 rounded-lg">
                        <p className="!text-yellow-700 font-medium">
                          This customer has no addresses. Please add an address first.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-bold !text-gray-900 mb-3">
                    Payment Method <span className="!text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {["Cash", "Card", "Online"].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-4 rounded-xl border-2 font-bold transition-all transform hover:scale-105 ${
                          paymentMethod === method
                            ? "!bg-purple-600 !border-purple-600 !text-white shadow-lg"
                            : "!bg-white !border-gray-300 !text-gray-700 hover:!border-purple-400"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="!bg-gradient-to-br !from-blue-50 !to-purple-50 p-6 rounded-2xl border-2 !border-blue-200">
                  <h3 className="text-xl font-black !text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="!text-gray-700 font-medium">Subtotal</span>
                      <span className="!text-gray-900 font-bold text-lg">
                        ${cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                    {fulfillmentType === "Delivery" && (
                      <div className="flex justify-between items-center">
                        <span className="!text-gray-700 font-medium">Delivery Fee</span>
                        <span className="!text-gray-900 font-bold text-lg">${FIXED_DELIVERY_FEE.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-blue-200 pt-3 flex justify-between items-center">
                      <span className="!text-gray-900 font-black text-xl">Total</span>
                      <span className="!text-blue-600 font-black text-3xl">
                        ${(cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0) + 
                          (fulfillmentType === "Delivery" ? FIXED_DELIVERY_FEE : 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || (fulfillmentType === "Delivery" && !selectedDeliveryAddress)}
                  className="w-full !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white font-black py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl flex items-center justify-center gap-3"
                >
                  {placingOrder ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Store List View
  return (
    <div className="min-h-screen !bg-gradient-to-br !from-blue-50 !via-indigo-50 !to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Customer Info Bar */}
        {selectedCustomer && (
          <div className="mb-8 !bg-gradient-to-r !from-blue-600 !to-purple-600 rounded-2xl p-5 shadow-2xl flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="!bg-white/20 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                <svg className="w-7 h-7 !text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm !text-white/90 font-bold mb-1">Ordering for</p>
                <p className="text-lg font-black !text-white">{selectedCustomer.fullName}</p>
                {selectedCustomer.email && (
                  <p className="text-sm !text-white/80 font-medium mt-1">{selectedCustomer.email}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleChangeCustomer}
              className="!bg-white hover:!bg-gray-100 !text-blue-600 px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Change
            </button>
          </div>
        )}

        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-black !text-gray-900 mb-4">
            Browse Stores
          </h1>
          <p className="text-2xl !text-gray-700 font-medium max-w-2xl mx-auto">
            Discover incredible sellers and their unique products
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for stores..."
              className="w-full !bg-white !text-gray-900 placeholder-gray-400 px-8 py-6 pl-16 rounded-3xl shadow-2xl border-2 !border-blue-200 focus:!border-blue-500 focus:outline-none text-xl font-medium transition-all"
            />
            <svg className="absolute left-6 top-1/2 transform -translate-y-1/2 w-8 h-8 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-md mx-auto mb-12">
          <div className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !text-white px-8 py-6 rounded-3xl shadow-2xl text-center transform hover:scale-105 transition-transform">
            <span className="text-5xl font-black">{filteredSellers.length}</span>
            <span className="text-2xl font-bold ml-3">Store{filteredSellers.length !== 1 ? 's' : ''} Available</span>
          </div>
        </div>

        {/* Loading Overlay */}
        {loadingDetails && (
          <div className="fixed inset-0 !bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="!bg-white p-10 rounded-3xl shadow-2xl text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="w-20 h-20 border-4 !border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-xl font-bold !text-gray-800">Loading store...</p>
            </div>
          </div>
        )}

        {/* Stores Grid */}
        {filteredSellers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSellers.map((seller) => (
              <button
                key={seller.id}
                onClick={() => handleStoreClick(seller.id)}
                className="group !bg-white rounded-3xl shadow-xl hover:shadow-2xl border-2 !border-gray-100 hover:!border-blue-300 p-4 text-left transition-all transform hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 !bg-gradient-to-br !from-blue-400 !to-purple-400 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                
                <div className="relative flex items-start justify-between mb-6">
                  <div className="!bg-gradient-to-br !from-blue-600 !to-purple-600 p-3 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform">
                    <svg className="w-8 h-8 !text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  {seller.sellerAddresses && seller.sellerAddresses.length > 0 && (
                    <span className="!bg-gradient-to-r !from-green-500 !to-emerald-500 !text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                      {seller.sellerAddresses.length} Location{seller.sellerAddresses.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black !text-gray-900 mb-4 group-hover:!text-blue-600 transition-colors">
                  {seller.storeName}
                </h3>
                
                {seller.phone && (
                  <div className="flex items-center gap-3 !text-gray-600 mb-4 !bg-gray-50 px-4 py-3 rounded-xl">
                    <svg className="w-5 h-5 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="font-bold">{seller.phone}</span>
                  </div>
                )}

                {seller.sellerAddresses && seller.sellerAddresses.length > 0 && seller.sellerAddresses[0].address && (
                  <div className="flex items-start gap-3 !text-gray-600 mb-6 !bg-blue-50 px-4 py-3 rounded-xl">
                    <svg className="w-5 h-5 !text-blue-600 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium line-clamp-2">
                      {seller.sellerAddresses[0].address.city}, {seller.sellerAddresses[0].address.country}
                    </span>
                  </div>
                )}

                <div className="pt-6 border-t-2 border-gray-100 flex items-center justify-between !text-blue-600 font-black text-lg group-hover:!text-purple-600 transition-colors">
                  <span>Explore Store</span>
                  <svg className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="!bg-gradient-to-br !from-white !to-gray-50 rounded-3xl p-20 text-center shadow-2xl">
            <div className="!bg-gradient-to-br !from-blue-100 !to-purple-100 w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-20 h-20 !text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-4xl font-black !text-gray-900 mb-4">No Stores Found</h3>
            <p className="!text-gray-600 text-xl mb-8">Try adjusting your search or check back later</p>
            <button 
              onClick={() => setSearchQuery("")}
              className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>

  );
  
}

export default StoresPage;
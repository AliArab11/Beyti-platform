import { useState, useEffect } from 'react';
import { X, MapPin, Plus, Minus, ShoppingCart, CreditCard, Wallet, Storefront, User } from '@phosphor-icons/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  createAddress, 
  updateAddress, 
  deleteAddress, 
  createCustomerAddress, 
  deleteCustomerAddress, 
  createOrder, 
  createOrderItem, 
  getProductVariants 
} from '../../../services/api';
import OrderDetails from './OrderDetails';

const Checkout = () => {
    
  // --- STATE (unchanged) ---
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);  

  const [step, setStep] = useState(1);
  const [fulfillmentType, setFulfillmentType] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [savedLocation, setSavedLocation] = useState(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLocation, setMapLocation] = useState(null);
  
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(null);


  

  const navigate = useNavigate();
    const location = useLocation();
    const {
    customerId,
    customerName,
    customerAddresses,
    selectedStore,
    storeName,
    setActiveOrder,
    storeId
    } = location.state || {};

    

    // Load cart from localStorage
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

    // Poll localStorage for cart updates
useEffect(() => {
  if (!customerId) {
    setLocalCart([]);
    return;
  }

  const updateCart = () => {
    try {
      let foundCart = [];
      // Check all localStorage keys for this customer
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
          const savedCart = localStorage.getItem(key);
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (parsedCart.length > 0) {
              foundCart = parsedCart;
              break;
            }
          }
        }
      }
      setLocalCart(foundCart);
    } catch (err) {
      console.error('Error updating cart:', err);
    }
  };

  updateCart();
  
  // Update cart every 500ms to catch changes
  const interval = setInterval(updateCart, 500);
  
  return () => clearInterval(interval);
}, [customerId, storeId]); // Added storeId to dependencies



    const handleUpdateQuantity = (productId, newQuantity) => {
  const cartKey = `beyti_cart_${storeId}_${customerId}`;
  const updatedCart = localCart.map(item => 
    item.id === productId 
      ? { ...item, quantity: newQuantity, totalPrice: item.basePrice * newQuantity }
      : item
  ).filter(item => item.quantity > 0);
  
  setLocalCart(updatedCart);
  localStorage.setItem(cartKey, JSON.stringify(updatedCart));
};

const handleRemoveItem = (productId) => {
  const cartKey = `beyti_cart_${storeId}_${customerId}`;
  const updatedCart = localCart.filter(item => item.id !== productId);
  
  setLocalCart(updatedCart);
  localStorage.setItem(cartKey, JSON.stringify(updatedCart));
};

const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

const showSnackbar = (message, type = 'success') => {
  setSnackbar({ open: true, message, type });
  setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 3000);
};


    useEffect(() => {
  // Load cart from ANY store for this customer
  if (customerId) {
    let foundCart = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`beyti_cart_`) && key.endsWith(`_${customerId}`)) {
        try {
          const savedCart = localStorage.getItem(key);
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (parsedCart.length > 0) {
              foundCart = parsedCart;
              console.log('✅ Loaded cart in Checkout:', parsedCart);
              break;
            }
          }
        } catch (err) {
          console.error('Error loading cart in Checkout:', err);
        }
      }
    }
    setLocalCart(foundCart);
  }
}, [customerId, storeId]); // Added storeId to dependencies



  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    region: '',
    country: 'Bahrain',
    postalCode: ''
  });

  const DELIVERY_FEE = 0.500;
  const safeCart = Array.isArray(localCart) ? localCart : [];

  const subtotal = localCart.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
  const totalItems = localCart.reduce((sum, item) => sum + item.quantity, 0);
  const total = subtotal + (fulfillmentType === 'Delivery' ? DELIVERY_FEE : 0);


  const MapSelector = () => {
    useMapEvents({
      click(e) {
        setMapLocation(e.latlng); // Just set the temporary marker
      }
    });
    return null;
  };

  // --- EFFECT: Load customer addresses when checkout opens (unchanged) ---
  useEffect(() => {
    console.log("🛒 Checkout received customerAddresses:", customerAddresses);
    console.log("🛒 customerAddresses length:", customerAddresses?.length);
    
    if (customerAddresses && customerAddresses.length > 0) {
      const formattedAddresses = customerAddresses.map((ca, index) => {
        console.log(`🏠 Processing address ${index + 1}:`, ca);
        const formatted = {
          id: ca.address?.id || ca.addressId || ca.id,
          street: ca.address?.street || '',
          city: ca.address?.city || '',
          region: ca.address?.region || '',
          country: ca.address?.country || 'Bahrain',
          postalCode: ca.address?.postalCode || ''
        };
        console.log(`✅ Formatted address ${index + 1}:`, formatted);
        return formatted;
      });
      console.log("📦 All formatted addresses:", formattedAddresses);
      setAddresses(formattedAddresses);
    } else {
      console.log("⚠️ No addresses available or customerAddresses is empty");
      setAddresses([]);
    }
  }, [customerAddresses]);

  // --- ADDRESS HANDLERS (unchanged) ---
  const handleSaveAddress = async () => {
    if (editingAddress && editingAddress.id) {
      await handleUpdateAddress(editingAddress.id);
      return;
    }
    
    if (editingAddress && !editingAddress.id) {
      console.warn('editingAddress has no ID, treating as new address');
      setEditingAddress(null);
    }

    if (!newAddress.street || !newAddress.city || !newAddress.country) {
      setAddressError('Please fill required fields: Street, City, and Country');
      return;
    }

    if (!customerId) {
      setAddressError('Customer ID is missing');
      return;
    }

    setAddingAddress(true);
    setAddressError(null);

    try {
      const createdAddress = await createAddress({
        Label: null,
        Street: newAddress.street,
        City: newAddress.city,
        Region: newAddress.region || null,
        PostalCode: newAddress.postalCode || null,
        Country: newAddress.country,
        Latitude: savedLocation?.lat || null,
        Longitude: savedLocation?.lng || null,
        IsDefault: false
      });

      await createCustomerAddress({
        CustomerId: customerId,
        AddressId: createdAddress.id
      });

      const newAddr = {
        id: createdAddress.id,
        street: createdAddress.street,
        city: createdAddress.city,
        region: createdAddress.region,
        country: createdAddress.country,
        postalCode: createdAddress.postalCode
      };
      
      setAddresses([...addresses, newAddr]);

      setNewAddress({ street: '', city: '', region: '', country: 'Bahrain', postalCode: '' });
      setMapLocation(null);
      setSavedLocation(null);
      setShowAddressModal(false);
      setShowMapModal(false);
      
      showSnackbar('Address added successfully! ✓', 'success');
    } catch (err) {
      console.error('Error adding address:', err);
      setAddressError(err.message || 'Failed to add address');
    } finally {
      setAddingAddress(false);
    }
  };

  const handleUpdateAddress = async (addressId) => {
    if (!newAddress.street || !newAddress.city || !newAddress.country) {
      setAddressError('Please fill required fields: Street, City, and Country');
      return;
    }

    setAddingAddress(true);
    setAddressError(null);

    try {
      const updatedAddress = await updateAddress(addressId, {
        Street: newAddress.street,
        City: newAddress.city,
        Country: newAddress.country,
        Region: newAddress.region || null,
        PostalCode: newAddress.postalCode || null,
        Latitude: savedLocation?.lat || null,
        Longitude: savedLocation?.lng || null,
      });

      setAddresses(addresses.map(addr => 
        addr.id === addressId ? {
          id: addressId,
          street: newAddress.street,
          city: newAddress.city,
          region: newAddress.region,
          country: newAddress.country,
          postalCode: newAddress.postalCode
        } : addr
      ));

      setNewAddress({ street: '', city: '', region: '', country: 'Bahrain', postalCode: '' });
      setMapLocation(null);
      setSavedLocation(null);
      setEditingAddress(null);
      setShowAddressModal(false);
      
      showSnackbar('Address updated successfully! ✓', 'success');
    } catch (err) {
      console.error('Error updating address:', err);
      setAddressError(err.message || 'Failed to update address');
    } finally {
      setAddingAddress(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setNewAddress({
      street: address.street,
      city: address.city,
      region: address.region || '',
      country: address.country,
      postalCode: address.postalCode || ''
    });
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      setDeletingAddress(addressId);
      
      const customerAddress = customerAddresses?.find(
        ca => {
          const caAddressId = ca.address?.id || ca.addressId || ca.id;
          console.log('Comparing:', caAddressId, 'with', addressId);
          return caAddressId === addressId;
        }
      );
      
      console.log('Found customerAddress:', customerAddress);
      console.log('All customerAddresses:', customerAddresses);
      
      if (!customerAddress) {
        console.warn('CustomerAddress link not found, trying direct delete');
        await deleteAddress(addressId);
      } else {
        await deleteCustomerAddress(customerAddress.id);
        await deleteAddress(addressId);
      }

      setAddresses(addresses.filter(addr => addr.id !== addressId));
      
      if (selectedAddress?.id === addressId) {
        setSelectedAddress(null);
      }
      
      showSnackbar('Address deleted successfully! 🗑️', 'success');
    } catch (err) {
      console.error('Error deleting address:', err);
      showSnackbar(err.message || 'Failed to delete address', 'error');
    } finally {
      setDeletingAddress(null);
    }
  };

  const handleMapSave = async () => {
    if (!mapLocation) {
      showSnackbar('Please pick a location on the map', 'warning');
      return;
    }

    try {
      const { lat, lng } = mapLocation;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      const addr = data.address || {};

      setNewAddress({
        street: addr.road || newAddress.street || '',
        city: addr.city || addr.town || addr.village || newAddress.city || '',
        country: addr.country || newAddress.country || 'Bahrain',
        region: addr.state || newAddress.region || '',
        postalCode: addr.postcode || newAddress.postalCode || ''
      });

      setSavedLocation({ lat, lng });
      setShowMapModal(false);
      
      showSnackbar('Location saved! Form fields have been auto-filled.', 'success');
    } catch (err) {
      console.error('Error fetching address:', err);
      showSnackbar('Failed to fetch location details, but coordinates are saved.', 'warning');
      setSavedLocation({ lat: mapLocation.lat, lng: mapLocation.lng });
      setShowMapModal(false);
    }
  };

  // --- FLOW: Continue / Place Order (logic unchanged) ---
  const handleContinue = () => {
    if (step === 1 && localCart.length === 0) {
      showSnackbar('Cart is empty', 'error');
      return;
    }
    if (step === 2 && !fulfillmentType) {
      showSnackbar('Please select fulfillment type', 'warning');
      return;
    }
    if (step === 3 && fulfillmentType === 'Delivery' && !selectedAddress) {
      showSnackbar('Please select delivery address', 'warning');
      return;
    }
    if (step === 4 && !paymentMethod) {
      showSnackbar('Please select payment method', 'warning');
      return;
    }
    
    if (step < 4) {
      if (step === 2 && fulfillmentType === 'Pickup') {
        setStep(4);
      } else {
        setStep(step + 1);
      }
    } else {
      handlePlaceOrder();
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setPlacingOrder(true);
      setOrderError(null);

      const sellerId = localCart[0]?.sellerId;
      if (!sellerId) {
        throw new Error('Missing seller information');
      }

      const pickupAddressId =
        selectedStore?.sellerAddresses?.[0]?.addressId ||
        selectedStore?.sellerAddresses?.[0]?.address?.id ||
        null;

      const pickupAddressData = 
        selectedStore?.sellerAddresses?.[0]?.address ||
        selectedStore?.address ||
        (selectedStore?.sellerAddresses?.[0] ? {         
          street: selectedStore.sellerAddresses[0].address?.street,
          city: selectedStore.sellerAddresses[0].address?.city,
          country: selectedStore.sellerAddresses[0].address?.country,
          region: selectedStore.sellerAddresses[0].address?.region,
          latitude: selectedStore.sellerAddresses[0].address?.latitude,
          longitude: selectedStore.sellerAddresses[0].address?.longitude,
        } : null);

      console.log('🏪 Selected Store:', selectedStore);
      console.log('📍 Pickup Address Data:', pickupAddressData);
      console.log('🆔 Pickup Address ID:', pickupAddressId);

      const subtotalAmount = subtotal;
      const deliveryFee = fulfillmentType === 'Delivery' ? DELIVERY_FEE : 0;
      const totalAmount = subtotalAmount + deliveryFee;

      const orderData = {
        CustomerId: customerId,
        SellerId: sellerId,
        DeliveryAddressId: fulfillmentType === 'Delivery' ? parseInt(selectedAddress.id) : null,
        PickupAddressId: pickupAddressId,
        PaymentMethod: paymentMethod,
        PaymentStatus: 'Pending',
        FulfillmentType: fulfillmentType,
        Status: 'Placed',
        SubtotalAmount: subtotalAmount,
        DeliveryFee: deliveryFee,
        TotalAmount: totalAmount,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      };

      console.log('Creating order:', orderData);

      const createdOrder = await createOrder(orderData);
      console.log('Order created:', createdOrder);

      for (const cartItem of localCart) {
        let variantId = null;
        
        try {
          const variantsResponse = await getProductVariants(cartItem.id);
          
          if (variantsResponse && variantsResponse.length > 0) {
            variantId = variantsResponse[0].id;
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

          if (variantId) {
            await createOrderItem({
              OrderId: createdOrder.id,
              ProductVariantId: variantId,
              Qty: cartItem.quantity,
              UnitPrice: cartItem.basePrice
            });
          }
        } catch (err) {
          console.error(`Error adding item ${cartItem.name}:`, err);
        }
      }

      const completeOrder = {
        id: createdOrder.id,
        customerId: createdOrder.customerId,
        sellerId: createdOrder.sellerId,
        status: createdOrder.status || 'Placed',
        fulfillmentType: createdOrder.fulfillmentType,
        paymentMethod: createdOrder.paymentMethod,
        paymentStatus: createdOrder.paymentStatus,
        subtotalAmount: createdOrder.subtotalAmount,
        deliveryFee: createdOrder.deliveryFee,
        totalAmount: createdOrder.totalAmount,
        createdAt: createdOrder.createdAt,
        updatedAt: createdOrder.updatedAt,
        storeName: selectedStore?.storeName || 'Store',
        storePhone: selectedStore?.phone || null,
        pickupAddress: fulfillmentType === "Pickup" ? (
          pickupAddressData ? {
            street: pickupAddressData.street || '',
            city: pickupAddressData.city || '',
            country: pickupAddressData.country || '',
            region: pickupAddressData.region || null,
            latitude: pickupAddressData.latitude || null,
            longitude: pickupAddressData.longitude || null,
          } : {
            street: selectedStore?.sellerAddresses?.[0]?.address?.street || '',
            city: selectedStore?.sellerAddresses?.[0]?.address?.city || '',
            country: selectedStore?.sellerAddresses?.[0]?.address?.country || '',
            region: selectedStore?.sellerAddresses?.[0]?.address?.region || null,
            latitude: selectedStore?.sellerAddresses?.[0]?.address?.latitude || null,
            longitude: selectedStore?.sellerAddresses?.[0]?.address?.longitude || null,
          }
        ) : null,
      };

      console.log('✅ Complete order prepared:', completeOrder);
      console.log('🗺️ Pickup address in order:', completeOrder.pickupAddress);

      console.log('🎯 About to call setActiveOrder with:', completeOrder);
      // Save to localStorage for the current customer
      localStorage.setItem(`beyti_activeOrder_${customerId}`, JSON.stringify(completeOrder));
      console.log('✅ setActiveOrder called successfully');
      
      setTimeout(() => {
        const stored = localStorage.getItem('beyti_activeOrder');
        console.log('🔍 Checking storage after 1 second:', stored ? 'Found!' : 'Not found');
      }, 1000);
      
    localStorage.setItem(`beyti_cart_${storeId}_${customerId}`, JSON.stringify([]));
    setLocalCart([]);

      showSnackbar(`✅ Order #${createdOrder.id} placed successfully!`, 'success');
      navigate('/customer-dashboard');

    } catch (err) {
      console.error('Error placing order:', err);
      setOrderError(err.message || 'Failed to place order');
      showSnackbar(err.message || 'Failed to place order', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  // ---------- UI RETURN: FULL PAGE LAYOUT ----------
  return (
    <>
      {/* Full-page overlay (no dark background, just page) */}
      <div className="fixed inset-0 z-50 bg-cream-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8">
          {/* Top Header */}
         <header className="bg-cream-50 py-4 px-8 border-b border-grey-stroke sticky top-0 z-10">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                <h1 className="text-[32px] font-bold text-charcoal-600" style={{ fontFamily: 'Merriweather, serif' }}>
                Beyti
                </h1>
                <h2 className="text-[32px] font-bold text-charcoal-600 absolute left-1/2 -translate-x-1/2" style={{ fontFamily: 'Merriweather, serif' }}>
                Checkout
                </h2>
                <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-grey-200 rounded-lg transition-all">
                    <svg className="w-5 h-5 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>
                
                {customerName && (
                    <div className="flex items-center gap-3 pl-4 border-l border-grey-stroke">
                    <div className="w-8 h-8 bg-sage-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">{customerName[0]}</span>
                    </div>
                    <span className="text-charcoal-600 font-medium text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {customerName}
                    </span>
                    </div>
                )}
                </div>
            </div>
            </header>

            {/* MAIN CONTENT */}
                <div className="mb-8">
                {/* Back Button + Your Cart Title */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                    onClick={() => {
                        if (storeId) {
                        navigate(`/store/${storeId}`, { state: { customerId, customerName } });
                        } else {
                        navigate('/mainStore', { state: { customerId, customerName } });
                        }
                    }}
                    className="p-2 hover:bg-grey-200 rounded-lg transition-all"
                    >
                    <svg className="w-6 h-6 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    </button>
                    <h1 className="text-[40px] font-bold text-charcoal-600" style={{ fontFamily: 'Merriweather, serif' }}>
                    Your Cart
                    </h1>
                </div>
                
                {/* Store Name with Green Underline + Stepper on Same Line */}
                <div className="flex items-center justify-between mb-6">
                    {/* Store Name */}
                    {storeName && (
                    <div>
                        <p className="text-[18px] text-charcoal-600 inline-block border-b-4 border-sage-500 pb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Items from: <span className="font-semibold">{storeName}</span>
                        </p>
                    </div>
                    )}
                    
                    {/* Stepper - Moved 50% to the right (25% more than before) with smaller gaps */}
                    <div className="flex items-center gap-2 max-w-xl ml-[25%]">
                    {['Cart', 'Fulfillment', 'Address', 'Payment'].map((label, idx) => (
                        <div key={idx} className="flex items-center flex-1">
                        <div className="flex items-center gap-2 flex-1">
                            {/* Step Circle */}
                            <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-md ${
                                step > idx + 1
                                ? 'bg-sage-600 text-white ring-4 ring-sage-200'
                                : step === idx + 1
                                ? 'bg-sage-500 text-white ring-4 ring-sage-200 scale-110'
                                : 'bg-grey-200 text-charcoal-400'
                            }`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                            {step > idx + 1 ? '✓' : idx + 1}
                            </div>
                            
                            {/* Step Label */}
                            <span
                            className={`text-sm font-semibold transition-all ${
                                step === idx + 1 ? 'text-sage-600' : step > idx + 1 ? 'text-sage-500' : 'text-charcoal-400'
                            }`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                            {label}
                            </span>
                        </div>
                        
                        {/* Connector Line */}
                        {idx < 3 && (
                            <div
                            className={`h-1 flex-1 mx-1.5 rounded-full transition-all ${
                                step > idx + 1 ? 'bg-sage-500' : 'bg-grey-300'
                            }`}
                            />
                        )}
                        </div>
                    ))}
                    </div>
                </div>
                </div>

            {/* STEP 1: CART PAGE - TWO COLUMN LAYOUT */}
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(320px,0.9fr)] gap-6">
                {/* LEFT: CART ITEMS */}
                <section className="space-y-4">

                  {localCart.length === 0 ? (
                    <div className="py-16 text-center bg-white rounded-2xl border border-grey-stroke">
                        <div className="w-16 h-16 rounded-full bg-cream-100 mx-auto flex items-center justify-center mb-4">
                        <ShoppingCart size={30} className="text-grey-stroke" />
                        </div>
                        <p className="text-body-medium text-charcoal-600 font-semibold">
                        Your cart is empty.
                        </p>
                        <p className="text-body-regular text-charcoal-400 mt-1">
                        Browse stores to start your order.
                        </p>
                        <button
                        onClick={() => navigate('/mainStore', { 
                            state: { customerId, customerName } 
                        })}
                        className="mt-4 px-5 py-2.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-button font-semibold shadow-soft-lift flex items-center justify-center gap-2 mx-auto"
                        >
                        <Storefront size={20} weight="bold" />
                        <span>Browse Stores</span>
                        </button>
                    </div>
                    ) : (
                    <>
                        {localCart.map(item => (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl border border-grey-stroke shadow-sm hover:shadow-md transition-shadow p-5 flex items-center justify-between"
                            >
                            <div className="flex items-center gap-4 flex-1">
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center flex-shrink-0">
                                <ShoppingCart size={28} className="text-sage-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[18px] font-semibold text-charcoal-600 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {item.name}
                                </h4>
                                <p className="text-[16px] text-charcoal-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {item.basePrice.toFixed(2)} BD
                                </p>
                            </div>
                            </div>

                            <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-cream-100 rounded-lg px-2 py-1.5 border border-grey-stroke">
                                <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-grey-100 transition-all"
                                >
                                <Minus size={16} weight="bold" className="text-charcoal-600" />
                                </button>
                                <span className="w-10 text-center text-[16px] font-bold text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {item.quantity}
                                </span>
                                <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-grey-100 transition-all"
                                >
                                <Plus size={16} weight="bold" className="text-charcoal-600" />
                                </button>
                            </div>

                            <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-all"
                            >
                                <svg className="w-5 h-5 text-error-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            </div>
                        </div>
                        ))}
                    </>
                    )}
                </section>

                {/* RIGHT: ORDER SUMMARY PANEL */}
                 <aside className="bg-white rounded-3xl border-2 border-grey-stroke shadow-lg p-8 h-fit lg:sticky lg:top-8">
                    <h3 className="text-[28px] font-bold text-charcoal-600 mb-8" style={{ fontFamily: 'Merriweather, serif' }}>
                        Order Summary
                    </h3>

                    <div className="space-y-5">
                        <div className="flex justify-between text-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <span className="text-charcoal-600 font-medium">Subtotal:</span>
                        <span className="font-bold text-charcoal-600">{subtotal.toFixed(3)} BD</span>
                        </div>
                        
                        {step === 4 && fulfillmentType === 'Delivery' && (
                        <div className="flex justify-between text-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <span className="text-charcoal-600 font-medium">Delivery Fee:</span>
                            <span className="font-bold text-charcoal-600">{DELIVERY_FEE.toFixed(3)} BD</span>
                        </div>
                        )}
                        
                        <div className="border-t-2 border-grey-stroke pt-5 mt-5"></div>
                        
                        <div className="flex justify-between text-[24px] font-black" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <span className="text-charcoal-600">Total:</span>
                        <span className="text-sage-600">
                            {(step === 4 && fulfillmentType === 'Delivery' 
                            ? (subtotal + DELIVERY_FEE).toFixed(3) 
                            : subtotal.toFixed(3)
                            )} BD
                        </span>
                        </div>
                    </div>
                    </aside>
              </div>
            )}

            {/* STEP 2: FULFILLMENT TYPE (full-width) */}
            {step === 2 && (
              <section className="bg-white rounded-2xl border border-grey-stroke shadow-soft-lift p-5">
                <h3 className="text-card-h2 text-charcoal-600 mb-2">
                  How would you like to receive your order?
                </h3>
                <p className="text-body-regular text-charcoal-400 mb-4">
                  Choose delivery to your address or pickup directly from the store.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setFulfillmentType('Delivery')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      fulfillmentType === 'Delivery'
                        ? 'bg-sage-500 border-sage-500 text-white shadow-soft-lift'
                        : 'bg-cream-50 border-grey-stroke text-charcoal-600 hover:border-sage-500'
                    }`}
                  >
                    <MapPin size={40} weight="fill" className="mb-3" />
                    <p className="text-body-medium font-bold mb-1">Delivery</p>
                    <p className="text-body-regular text-inherit opacity-80 text-sm">
                      We’ll bring your order to your saved address.
                    </p>
                  </button>
                  <button
                    onClick={() => setFulfillmentType('Pickup')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      fulfillmentType === 'Pickup'
                        ? 'bg-sage-500 border-sage-500 text-white shadow-soft-lift'
                        : 'bg-cream-50 border-grey-stroke text-charcoal-600 hover:border-sage-500'
                    }`}
                  >
                    <Storefront size={40} weight="fill" className="mb-3" />
                    <p className="text-body-medium font-bold mb-1">Pickup</p>
                    <p className="text-body-regular text-inherit opacity-80 text-sm">
                      Collect your order directly from the store.
                    </p>
                  </button>
                </div>
              </section>
            )}

            {/* STEP 3: ADDRESS SELECTION (full-width) */}
            {step === 3 && (
              <section className="bg-white rounded-2xl border border-grey-stroke shadow-soft-lift p-5">
                <h3 className="text-card-h2 text-charcoal-600 mb-2">Select Delivery Address</h3>
                <p className="text-body-regular text-charcoal-400 mb-4">
                  Choose one of your saved addresses or add a new one.
                </p>

                {addresses.length === 0 ? (
                  <div className="text-center py-10">
                    <MapPin size={48} className="mx-auto text-grey-stroke mb-3" />
                    <p className="text-body-regular text-charcoal-400 mb-4">
                      You don’t have any saved addresses yet.
                    </p>
                    <button
                      onClick={() => {
                        setEditingAddress(null);
                        setShowAddressModal(true);
                      }}
                      className="bg-sage-500 text-white px-5 py-2.5 rounded-xl text-button font-semibold hover:bg-sage-600 shadow-soft-lift"
                    >
                      + Add Location
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-3">
                      {addresses.map(addr => (
                        <div
                          key={addr.id}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            selectedAddress?.id === addr.id
                              ? 'bg-sage-500 border-sage-500 text-white'
                              : 'bg-cream-50 border-grey-stroke'
                          }`}
                        >
                          <button
                            onClick={() => setSelectedAddress(addr)}
                            className="w-full text-left"
                          >
                            <p className="text-body-medium font-semibold mb-1 pr-24">
                              {addr.street}
                            </p>
                            <p className="text-label-medium opacity-80">
                              {addr.city}, {addr.region}, {addr.country}
                            </p>
                          </button>

                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleEditAddress(addr);
                              }}
                              className={`p-2 rounded-lg transition-all ${
                                selectedAddress?.id === addr.id
                                  ? 'bg-white/20 hover:bg-white/30 text-white'
                                  : 'bg-grey-100 hover:bg-grey-200 text-charcoal-600'
                              }`}
                              title="Edit Address"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this address?')) {
                                  handleDeleteAddress(addr.id);
                                }
                              }}
                              disabled={deletingAddress === addr.id}
                              className={`p-2 rounded-lg transition-all ${
                                selectedAddress?.id === addr.id
                                  ? 'bg-white/20 hover:bg-red-500 text-white'
                                  : 'bg-grey-100 hover:bg-red-500 hover:text-white text-charcoal-600'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title="Delete Address"
                            >
                              {deletingAddress === addr.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setEditingAddress(null);
                        setShowAddressModal(true);
                      }}
                      className="w-full bg-white border-2 border-sage-500 text-sage-500 px-5 py-2.5 rounded-xl text-button font-semibold hover:bg-sage-50"
                    >
                      + Add New Address
                    </button>
                  </>
                )}
              </section>
            )}

            {/* STEP 4: PAYMENT METHOD (full-width) */}
            {step === 4 && (
              <section className="bg-white rounded-2xl border border-grey-stroke shadow-soft-lift p-5">
                <h3 className="text-card-h2 text-charcoal-600 mb-2">Payment Method</h3>
                <p className="text-body-regular text-charcoal-400 mb-4">
                  Choose how you would like to pay for this order.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {['Cash', 'Card', 'Online'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-5 rounded-xl border-2 transition-all text-center ${
                        paymentMethod === method
                          ? 'bg-sage-500 border-sage-500 text-white shadow-soft-lift'
                          : 'bg-cream-50 border-grey-stroke hover:border-sage-500 text-charcoal-600'
                      }`}
                    >
                      {method === 'Cash' ? (
                        <Wallet size={28} weight="fill" className="mx-auto mb-2" />
                      ) : (
                        <CreditCard size={28} weight="fill" className="mx-auto mb-2" />
                      )}
                      <p className="text-button font-bold">{method}</p>
                    </button>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-sage-100 to-sage-200 p-5 rounded-xl border-2 border-sage-300">
                  <h4 className="text-card-h2 text-charcoal-600 mb-3">Order Summary</h4>
                  <div className="space-y-1.5 text-body-regular text-charcoal-600">
                    {customerName && (
                      <div className="flex justify-between pb-2 mb-2 border-b border-sage-300">
                        <span className="font-semibold">Customer:</span>
                        <span className="font-bold">{customerName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-bold">{subtotal.toFixed(3)} BD</span>
                    </div>
                    {fulfillmentType === 'Delivery' && (
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span className="font-bold">{DELIVERY_FEE.toFixed(3)} BD</span>
                      </div>
                    )}
                    <div className="border-t-2 border-sage-300 pt-2 mt-2 flex justify-between text-lg font-black text-sage-700">
                      <span>Total:</span>
                      <span>{total.toFixed(3)} BD</span>
                    </div>
                  </div>
                </div>

                {orderError && (
                  <div className="mt-4 bg-error-bg border-l-4 border-error-btn p-3 rounded">
                    <p className="text-body-regular text-error-text font-semibold">
                      {orderError}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <footer className="sticky bottom-0 bg-cream-50 py-4">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 flex gap-3 justify-end items-center">
                {step > 1 && (
                <button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-2.5 bg-grey-200 text-charcoal-600 text-button font-semibold rounded-xl hover:bg-grey-300 border border-grey-stroke"
                >
                    ← Back
                </button>
                )}
                <button
                onClick={handleContinue}
                disabled={placingOrder}
                className="px-8 py-2.5 bg-sage-500 hover:bg-sage-600 text-white text-button font-semibold rounded-xl shadow-soft-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                {step === 4 ? (
                    <>
                    {placingOrder && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{placingOrder ? 'Placing Order...' : 'Place Order'}</span>
                    </>
                ) : (
                    <span>Continue →</span>
                )}
                </button>
            </div>
            </footer>
        </div>
      

      {/* ADDRESS MODAL (unchanged, still modal) */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-grey-stroke flex justify-between items-center">
              <h3 className="text-xl font-bold text-charcoal-600">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  setEditingAddress(null);
                  setNewAddress({
                    street: '',
                    city: '',
                    region: '',
                    country: 'Bahrain',
                    postalCode: ''
                  });
                }}
                className="p-2 hover:bg-grey-100 rounded-full"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {addressError && (
                <div className="p-3 rounded-lg bg-error-bg border-l-4 border-error-btn">
                  <p className="text-sm text-error-text font-medium">{addressError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowMapModal(true)}
                className="w-full bg-sage-500 hover:bg-sage-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <MapPin size={20} weight="fill" />
                📍 Pick Location from Map
                {savedLocation && <span className="ml-2 text-xs">✓ Location Set</span>}
              </button>

              <div>
                <label className="block text-sm font-medium text-charcoal-600 mb-1">
                  Street <span className="text-error-text">*</span>
                </label>
                <input
                  value={newAddress.street}
                  onChange={e =>
                    setNewAddress({ ...newAddress, street: e.target.value })
                  }
                  placeholder="Enter street address"
                  className="w-full border-2 border-grey-stroke rounded-lg p-2.5 text-sm focus:border-sage-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-charcoal-600 mb-1">
                    City <span className="text-error-text">*</span>
                  </label>
                  <input
                    value={newAddress.city}
                    onChange={e =>
                      setNewAddress({ ...newAddress, city: e.target.value })
                    }
                    placeholder="City"
                    className="w-full border-2 border-grey-stroke rounded-lg p-2.5 text-sm focus:border-sage-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal-600 mb-1">
                    Country <span className="text-error-text">*</span>
                  </label>
                  <input
                    value={newAddress.country}
                    onChange={e =>
                      setNewAddress({ ...newAddress, country: e.target.value })
                    }
                    placeholder="Country"
                    className="w-full border-2 border-grey-stroke rounded-lg p-2.5 text-sm focus:border-sage-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-charcoal-600 mb-1">
                    Region (Optional)
                  </label>
                  <input
                    value={newAddress.region}
                    onChange={e =>
                      setNewAddress({ ...newAddress, region: e.target.value })
                    }
                    placeholder="Region"
                    className="w-full border-2 border-grey-stroke rounded-lg p-2.5 text-sm focus:border-sage-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal-600 mb-1">
                    Postal Code (Optional)
                  </label>
                  <input
                    value={newAddress.postalCode}
                    onChange={e =>
                      setNewAddress({ ...newAddress, postalCode: e.target.value })
                    }
                    placeholder="Postal Code"
                    className="w-full border-2 border-grey-stroke rounded-lg p-2.5 text-sm focus:border-sage-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveAddress}
                disabled={addingAddress}
                className="w-full bg-sage-500 text-white font-bold py-3 rounded-xl hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addingAddress ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingAddress ? 'Updating Address...' : 'Saving Address...'}
                  </>
                ) : (
                  <>{editingAddress ? 'Update Address' : 'Save Address'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAP MODAL (unchanged) */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden">
            <div className="p-5 border-b border-grey-stroke flex justify-between items-center">
              <h3 className="text-xl font-bold text-charcoal-600">Pick Location on Map</h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="p-2 hover:bg-grey-100 rounded-full"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="h-80">
              <MapContainer
                center={[26.0667, 50.5577]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapSelector />
                {mapLocation && <Marker position={[mapLocation.lat, mapLocation.lng]} />}
              </MapContainer>
            </div>
            <div className="p-5 space-y-2">
              {mapLocation && (
                <p className="text-sm text-charcoal-600 text-center">
                  📍 Location: {mapLocation.lat.toFixed(4)}, {mapLocation.lng.toFixed(4)}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleMapSave}
                  disabled={!mapLocation}
                  className="flex-1 bg-sage-500 text-white font-bold py-2.5 rounded-xl hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Location & Auto-Fill
                </button>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="flex-1 bg-grey-300 text-charcoal-600 font-bold py-2.5 rounded-xl hover:bg-grey-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          {/* Snackbar */}
            {snackbar.open && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80]">
                <div 
                className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] ${
                    snackbar.type === 'success' ? 'bg-green-500 text-white' :
                    snackbar.type === 'error' ? 'bg-red-500 text-white' :
                    'bg-yellow-500 text-white'
                }`}
                >
                <span className="text-2xl">
                    {snackbar.type === 'success' ? '✓' : snackbar.type === 'error' ? '✕' : '⚠'}
                </span>
                <p className="font-semibold">{snackbar.message}</p>
                </div>
            </div>
            )}
        </div>
      )}
    </>
  );
};

export default Checkout;

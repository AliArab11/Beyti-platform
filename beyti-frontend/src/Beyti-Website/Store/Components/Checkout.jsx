import { useState, useEffect } from 'react';
import { X, MapPin, Plus, Minus, ShoppingCart, CreditCard, Wallet, Storefront, User } from '@phosphor-icons/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Checkout = ({ 
  cart, 
  onClose, 
  onUpdateQuantity, 
  onRemoveItem, 
  storeName,
  customerId,     
  customerName,
  customerAddresses,
  showSnackbar
}) => {

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

  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    region: '',
    country: 'Bahrain',
    postalCode: ''
  });

  const DELIVERY_FEE = 5.00;
  const subtotal = cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
  const total = subtotal + (fulfillmentType === 'Delivery' ? DELIVERY_FEE : 0);

  const MapSelector = () => {
  useMapEvents({
    click(e) {
      setMapLocation(e.latlng); // Just set the temporary marker
    }
  });
  return null; // Don't render marker here
};


// Load customer addresses when checkout opens
useEffect(() => {
  console.log("🛒 Checkout received customerAddresses:", customerAddresses);
  console.log("🛒 customerAddresses length:", customerAddresses?.length);
  
  if (customerAddresses && customerAddresses.length > 0) {
    // Map customer addresses to the format we need
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
    setAddresses([]); // No addresses available
  }
}, [customerAddresses]);

const handleSaveAddress = async () => {
  // Validation
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
    // Step 1: Create the address in the database
    const response = await fetch('https://localhost:7062/api/Addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Label: null,
        Street: newAddress.street,
        City: newAddress.city,
        Region: newAddress.region || null,
        PostalCode: newAddress.postalCode || null,
        Country: newAddress.country,
        Latitude: savedLocation?.lat || null,
        Longitude: savedLocation?.lng || null,
        IsDefault: false
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create address');
    }

    const createdAddress = await response.json();

    // Step 2: Link the address to the customer
    const linkResponse = await fetch('https://localhost:7062/api/CustomerAddresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CustomerId: customerId,
        AddressId: createdAddress.id
      }),
    });

    if (!linkResponse.ok) {
      throw new Error('Failed to link address to customer');
    }

    // Step 3: Add to local addresses list
    const newAddr = {
      id: createdAddress.id,
      street: createdAddress.street,
      city: createdAddress.city,
      region: createdAddress.region,
      country: createdAddress.country,
      postalCode: createdAddress.postalCode
    };
    
    setAddresses([...addresses, newAddr]);

    // Reset form
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

const handleMapSave = async () => {
  if (!mapLocation) {
    showSnackbar('Please pick a location on the map', 'warning');
    return;
  }

  try {
    const { lat, lng } = mapLocation;

    // Fetch address details from coordinates
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    const addr = data.address || {};

    // Auto-fill the form fields
    setNewAddress({
      street: addr.road || newAddress.street || '',
      city: addr.city || addr.town || addr.village || newAddress.city || '',
      country: addr.country || newAddress.country || 'Bahrain',
      region: addr.state || newAddress.region || '',
      postalCode: addr.postcode || newAddress.postalCode || ''
    });

    // Save the location
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

  const handleContinue = () => {
    if (step === 1 && cart.length === 0) {
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
  // Place order with customer info
  console.log('Placing order:', {
    customerId,
    customerName,
    cart,
    fulfillmentType,
    selectedAddress,
    paymentMethod,
    total
  });
  
  showSnackbar(`Order placed successfully for ${customerName}! 🎉`, 'success');
  onClose();
}
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cream-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-sage-500 to-sage-600 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>Checkout</h2>
            <p className="text-sage-100 text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all">
            <X size={20} weight="bold" className="text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-white px-5 py-3 border-b border-grey-stroke">
          <div className="flex items-center justify-between">
            {['Cart', 'Fulfillment', 'Address', 'Payment'].map((label, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step > idx + 1 ? 'bg-sage-500 text-white' : step === idx + 1 ? 'bg-sage-500 text-white' : 'bg-grey-stroke text-charcoal-400'
                }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                  {step > idx + 1 ? '✓' : idx + 1}
                </div>
                <span className={`ml-1.5 text-xs font-semibold ${step === idx + 1 ? 'text-sage-600' : 'text-charcoal-400'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </span>
                {idx < 3 && <div className={`w-8 h-0.5 mx-2 ${step > idx + 1 ? 'bg-sage-500' : 'bg-grey-stroke'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Cart Review */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-charcoal-600" style={{ fontFamily: 'Merriweather, serif' }}>Your Cart</h3>
                <div className="flex items-center gap-2 text-sm text-sage-600">
                  <Storefront size={16} weight="fill" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>{storeName}</span>
                </div>
              </div>
              
              {/* Customer Info Banner */}
              {customerName && (
                <div className="bg-sage-100 border-2 border-sage-300 rounded-xl p-3 flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-sage-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={20} weight="fill" className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-sage-700 font-semibold">Ordering for:</p>
                    <p className="text-sm font-bold text-charcoal-600">{customerName}</p>
                  </div>
                </div>
              )}
              
              {cart.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-grey-stroke flex items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-sage-100 to-sage-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={24} className="text-sage-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-charcoal-600" style={{ fontFamily: 'Inter, sans-serif' }}>{item.name}</h4>
                    <p className="text-sage-600 text-sm font-semibold">{item.basePrice.toFixed(3)} BD each</p>
                  </div>
                  <div className="flex items-center gap-2 bg-cream-100 rounded-lg p-1.5">
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded hover:bg-grey-100">
                      <Minus size={14} weight="bold" />
                    </button>
                    <span className="w-7 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded hover:bg-grey-100">
                      <Plus size={14} weight="bold" />
                    </button>
                  </div>
                  <p className="text-lg font-black text-sage-700 w-24 text-right">{(item.basePrice * item.quantity).toFixed(3)} BD</p>
                  <button onClick={() => onRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                    <X size={18} weight="bold" />
                  </button>
                </div>
              ))}
              <div className="bg-sage-100 p-4 rounded-xl border-2 border-sage-300">
                <div className="flex justify-between font-bold text-charcoal-600">
                  <span>Subtotal:</span>
                  <span>{subtotal.toFixed(3)} BD</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fulfillment Type */}
          {step === 2 && (
            <div>
              <h3 className="text-xl font-bold text-charcoal-600 mb-4" style={{ fontFamily: 'Merriweather, serif' }}>How would you like to receive your order?</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setFulfillmentType('Delivery')} className={`p-6 rounded-xl border-2 transition-all ${fulfillmentType === 'Delivery' ? 'bg-sage-500 border-sage-500 text-white' : 'bg-white border-grey-stroke text-charcoal-600 hover:border-sage-500'}`}>
                  <MapPin size={40} weight="fill" className="mx-auto mb-3" />
                  <p className="font-bold">Delivery</p>
                  <p className="text-xs mt-1 opacity-80">Get it delivered</p>
                </button>
                <button onClick={() => setFulfillmentType('Pickup')} className={`p-6 rounded-xl border-2 transition-all ${fulfillmentType === 'Pickup' ? 'bg-sage-500 border-sage-500 text-white' : 'bg-white border-grey-stroke text-charcoal-600 hover:border-sage-500'}`}>
                  <ShoppingCart size={40} weight="fill" className="mx-auto mb-3" />
                  <p className="font-bold">Pickup</p>
                  <p className="text-xs mt-1 opacity-80">Pick up from store</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Address Selection */}
          {step === 3 && (
            <div>
              <h3 className="text-xl font-bold text-charcoal-600 mb-4" style={{ fontFamily: 'Merriweather, serif' }}>Select Delivery Address</h3>
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin size={48} className="mx-auto text-grey-stroke mb-3" />
                  <p className="text-charcoal-400 mb-4 text-sm">No addresses saved</p>
                  <button onClick={() => setShowAddressModal(true)} className="bg-sage-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-sage-600">
                    Add Location
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-3">
                    {addresses.map(addr => (
                      <button key={addr.id} onClick={() => setSelectedAddress(addr)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedAddress?.id === addr.id ? 'bg-sage-500 border-sage-500 text-white' : 'bg-white border-grey-stroke hover:border-sage-500'}`}>
                        <p className="font-bold mb-1">{addr.street}</p>
                        <p className="text-sm opacity-80">{addr.city}, {addr.region}, {addr.country}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowAddressModal(true)} className="w-full bg-white border-2 border-sage-500 text-sage-500 px-5 py-2.5 rounded-xl font-bold hover:bg-sage-50">
                    + Add New Address
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 4: Payment Method */}
          {step === 4 && (
            <div>
              <h3 className="text-xl font-bold text-charcoal-600 mb-4" style={{ fontFamily: 'Merriweather, serif' }}>Payment Method</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['Cash', 'Card', 'Online'].map(method => (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`p-5 rounded-xl border-2 transition-all ${paymentMethod === method ? 'bg-sage-500 border-sage-500 text-white' : 'bg-white border-grey-stroke hover:border-sage-500'}`}>
                    {method === 'Cash' ? <Wallet size={28} weight="fill" className="mx-auto mb-2" /> : <CreditCard size={28} weight="fill" className="mx-auto mb-2" />}
                    <p className="font-bold text-sm">{method}</p>
                  </button>
                ))}
              </div>
              <div className="bg-gradient-to-br from-sage-100 to-sage-200 p-5 rounded-xl border-2 border-sage-300">
                <h4 className="font-bold text-charcoal-600 mb-3">Order Summary</h4>
                <div className="space-y-1.5 text-charcoal-600 text-sm">
                  {customerName && (
                    <div className="flex justify-between pb-2 mb-2 border-b border-sage-300">
                      <span className="font-semibold">Customer:</span>
                      <span className="font-bold">{customerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between"><span>Subtotal:</span><span className="font-bold">{subtotal.toFixed(3)} BD</span></div>
                  {fulfillmentType === 'Delivery' && <div className="flex justify-between"><span>Delivery Fee:</span><span className="font-bold">{DELIVERY_FEE.toFixed(3)} BD</span></div>}
                  <div className="border-t-2 border-sage-300 pt-2 mt-2 flex justify-between text-lg font-black text-sage-700">
                    <span>Total:</span><span>{total.toFixed(3)} BD</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t-2 border-grey-stroke p-4 flex gap-3">
          <button onClick={onClose} className="px-6 py-2.5 bg-grey-200 text-charcoal-600 font-bold rounded-xl hover:bg-grey-300 text-sm">
            Continue Shopping
          </button>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 bg-grey-300 text-charcoal-600 font-bold rounded-xl hover:bg-grey-400 text-sm">
              Back
            </button>
          )}
          <button onClick={handleContinue} className="flex-1 bg-sage-500 text-white font-bold py-2.5 rounded-xl hover:bg-sage-600 text-sm">
            {step === 4 ? 'Place Order' : 'Continue'}
          </button>
        </div>
      </div>

      {/* Add Address Modal - unchanged */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-grey-stroke flex justify-between items-center">
              <h3 className="text-xl font-bold text-charcoal-600">Add New Address</h3>
              <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-grey-100 rounded-full">
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="p-5 space-y-3">
            {addressError && (
                <div className="p-3 rounded-lg bg-red-50 border-l-4 border-red-500">
                <p className="text-sm text-red-700 font-medium">{addressError}</p>
                </div>
            )}

            {/* Pick from Map Button */}
            <button 
                type="button"
                onClick={() => setShowMapModal(true)}
                className="w-full bg-sage-500 hover:bg-sage-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
                <MapPin size={20} weight="fill" />
                📍 Pick Location from Map
                {savedLocation && <span className="ml-2 text-xs">✓ Location Set</span>}
            </button>

            {/* Street Input */}
            <div>
                <label className="block text-sm font-medium text-charcoal-600 mb-1">
                Street <span className="text-red-500">*</span>
                </label>
                <input 
                value={newAddress.street} 
                onChange={e => setNewAddress({...newAddress, street: e.target.value})} 
                placeholder="Enter street address" 
                className="w-full border-2 border-grey-stroke rounded-lg p-2.5 text-sm focus:border-sage-500 focus:outline-none" 
                required
                />
            </div>

            {/* City & Country */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                <label className="block text-sm font-medium text-charcoal-600 mb-1">
                    City <span className="text-red-500">*</span>
                </label>
                <input 
                    value={newAddress.city} 
                    onChange={e => setNewAddress({...newAddress, city: e.target.value})} 
                    placeholder="City" 
                    className="w-full border-2 border-grey-stroke rounded-lg p-2.5 text-sm focus:border-sage-500 focus:outline-none" 
                    required
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-charcoal-600 mb-1">
                    Country <span className="text-red-500">*</span>
                </label>
                <input 
                    value={newAddress.country} 
                    onChange={e => setNewAddress({...newAddress, country: e.target.value})} 
                    placeholder="Country" 
                    className="w-full border-2 border-grey-stroke rounded-lg p-2.5 text-sm focus:border-sage-500 focus:outline-none" 
                    required
                />
                </div>
            </div>

            {/* Region & Postal Code */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                <label className="block text-sm font-medium text-charcoal-600 mb-1">
                    Region (Optional)
                </label>
                <input 
                    value={newAddress.region} 
                    onChange={e => setNewAddress({...newAddress, region: e.target.value})} 
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
                    onChange={e => setNewAddress({...newAddress, postalCode: e.target.value})} 
                    placeholder="Postal Code" 
                    className="w-full border-2 border-grey-stroke rounded-lg p-2.5 text-sm focus:border-sage-500 focus:outline-none" 
                />
                </div>
            </div>

            {/* Save Button */}
            <button 
                onClick={handleSaveAddress} 
                disabled={addingAddress}
                className="w-full bg-sage-500 text-white font-bold py-3 rounded-xl hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {addingAddress ? (
                <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving Address...
                </>
                ) : (
                'Save Address'
                )}
            </button>
            </div>
          </div>
        </div>
      )}

{showMapModal && (
  <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden">
      <div className="p-5 border-b border-grey-stroke flex justify-between items-center">
        <h3 className="text-xl font-bold text-charcoal-600">Pick Location on Map</h3>
        <button onClick={() => setShowMapModal(false)} className="p-2 hover:bg-grey-100 rounded-full">
          <X size={20} weight="bold" />
        </button>
      </div>
      <div className="h-80">
        <MapContainer center={[26.0667, 50.5577]} zoom={12} style={{ height: '100%', width: '100%' }}>
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
  </div>

  

  
)}

    </div>
  );
};

export default Checkout;
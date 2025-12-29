import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Package, CheckCircle, Clock, Storefront, Phone, User } from '@phosphor-icons/react';
import StatusChip from '../../../components/StatusChip';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';


// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


// Helper function for status chip colors
const getStatusVariant = (status) => {
  const s = status?.toLowerCase();
  if (!s) return "neutral";
  if (s === "placed" || s === "pending") return "danger";
  if (["accepted", "preparing", "ready for pickup", "picked up"].includes(s)) return "brand";
  if (s === "completed" || s === "delivered") return "success";
  if (s === "cancelled") return "error";
  return "neutral";
};


const OrderDetails = ({ order, onClose }) => {

  const mapRef = useRef(null);
  const [tracking, setTracking] = useState(null);
  const trackingIntervalRef = useRef(null);

  // ADD THIS:
  console.log('🎯 OrderDetails received order:', {
    id: order?.id,
    status: order?.status,
    fulfillmentType: order?.fulfillmentType,
    fullOrder: JSON.stringify(order, null, 2)
  });

  // Fetch tracking data
  const fetchTracking = async () => {
    if (!order?.id) return;
    
    try {
      const response = await fetch(`https://localhost:7062/api/Orders/${order.id}/tracking`);
      const data = await response.json();
      setTracking(data);
      
      // Stop polling if order is delivered or cancelled
      if (data.status === 'Delivered' || data.status === 'Cancelled') {
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
          trackingIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error('Error fetching tracking:', error);
    }
  };

  useEffect(() => {
    if (order) {
      console.log('📦 OrderDetails useEffect - order:', order);
      console.log('🔄 OrderDetails received updated order status:', order.status);

      // Start tracking if delivery order
      if (order.fulfillmentType === 'Delivery') {
        fetchTracking(); // Initial fetch

        // Poll every 10 seconds
        trackingIntervalRef.current = setInterval(fetchTracking, 10000);
      }
    }

    // Cleanup on unmount
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [order]);

  if (!order) {
    console.log('⚠️ No order provided to OrderDetails');
    return null;
  }

  // Map backend status to customer-facing status
    // For DELIVERY orders: hide "Ready for Pickup" and show "Preparing" instead
    // For PICKUP orders: show "Ready for Pickup" normally
    const displayStatus = (order.status === "Ready for Pickup" && order.fulfillmentType === "Delivery") 
      ? "Preparing" 
      : order.status;


        // Order status progression
        const statuses = [
          { key: "Placed", label: "Order Placed", icon: Package },
          { key: "Accepted", label: "Store Accepted", icon: CheckCircle },
          { key: "Preparing", label: "Preparing", icon: Clock },
        ];

        if (order.fulfillmentType === "Pickup") {
          statuses.push(
            { key: "Ready for Pickup", label: "Ready for Pickup", icon: CheckCircle },
            { key: "Completed", label: "Completed", icon: CheckCircle }
          );
        } else if (order.fulfillmentType === "Delivery") {
          statuses.push(
            { key: "Picked Up", label: "Out for Delivery", icon: Package },
            { key: "Delivered", label: "Completed", icon: CheckCircle }
          );
        }

  const currentStatusIndex = statuses.findIndex(s => s.key === displayStatus);
  const isPickup = order.fulfillmentType === 'Pickup';

  useEffect(() => {
  if (order) {
    console.log('📦 FULL ORDER DATA:', JSON.stringify(order, null, 2));
    console.log('🏪 isPickup?', isPickup);
    console.log('📍 pickupAddress exists?', !!order.pickupAddress);
    console.log('📍 pickupAddress data:', order.pickupAddress);
    console.log('🏠 deliveryAddress exists?', !!order.deliveryAddress);
  }
}, [order]);


return (
  <>
    {/* Full Details Modal - Opens directly */}
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-cream-50 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-sage-500">
        {/* Header */}
        <div className="p-6 flex items-center justify-between" style={{ backgroundColor: '#556B5C' }}>
          <div>
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>
              Order #{order.id}
            </h2>
            <p className="text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif', color: '#E8F0EA' }}>
              Placed on {new Date(order.createdAt).toLocaleString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
              // No timeZone = uses user's local timezone
            })}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          >
            <X size={24} weight="bold" style={{ color: 'white' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Timeline - Line Based */}
          <div className="bg-white rounded-2xl p-6 border-2 border-grey-stroke">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-charcoal-700" style={{ fontFamily: 'Merriweather, serif' }}>
                Order Status
              </h3>
              <StatusChip variant={getStatusVariant(displayStatus)}>
                {displayStatus || "Unknown"}
              </StatusChip>
            </div>
            {/* Progress Line */}
            <div className="relative">
              {/* Background Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-grey-300 rounded-full"></div>
              
              {/* Progress Line */}
              <div 
                className="absolute top-5 left-0 h-1 bg-sage-500 rounded-full transition-all duration-500"
                style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}
              ></div>

              {/* Status Points */}
              <div className="relative flex justify-between">
                {statuses.map((status, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const StatusIcon = status.icon;

                  return (
                    <div key={status.key} className="flex flex-col items-center" style={{ flex: 1 }}>
                      {/* Circle with Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
                        isCompleted 
                          ? 'bg-sage-500 text-white shadow-lg' 
                          : 'bg-white border-2 border-grey-300 text-charcoal-400'
                      } ${isCurrent ? 'ring-4 ring-sage-200 scale-125' : ''}`}>
                        {isCompleted ? (
                          <CheckCircle size={20} weight="fill" />
                        ) : (
                          <StatusIcon size={20} weight="regular" />
                        )}
                      </div>

                      {/* Label */}
                      <p className={`mt-3 text-xs font-semibold text-center px-1 ${
                        isCompleted ? 'text-sage-700' : 'text-charcoal-400'
                      }`}>
                        {status.label}
                      </p>
                      
                      {/* Current Indicator */}
                      {isCurrent && (
                        <div className="mt-1">
                          <span className="inline-block w-2 h-2 bg-sage-500 rounded-full animate-pulse"></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
                            
         
           {/* Dynamic Status Message */}
              <div className="mt-6 p-4 bg-sage-50 rounded-xl">
                <p className="text-lg font-bold text-sage-700">
                  {currentStatusIndex === 0 && "Order placed successfully! Your order has been received and the seller has been notified."}
                  {currentStatusIndex === 1 && "Order accepted! The seller has confirmed your order and is getting it ready."}
                  {currentStatusIndex === 2 && order.fulfillmentType === 'Pickup' && "Your order is being prepared by the seller."}
                  {currentStatusIndex === 2 && order.fulfillmentType === 'Delivery' && "Your order is being prepared by the seller."}
                  {currentStatusIndex === 3 && order.fulfillmentType === 'Pickup' && "Your order is ready for pickup! You can now head to the store to collect it."}
                  {currentStatusIndex === 3 && order.fulfillmentType === 'Delivery' && "Your order is ready and waiting for pickup by the driver."}
                  {currentStatusIndex === 4 && order.fulfillmentType === 'Pickup' && "Order completed! Thank you for your order."}
                  {currentStatusIndex === 4 && order.fulfillmentType === 'Delivery' && "On the way! Your order is out for delivery and will arrive soon."}
                  {currentStatusIndex === 5 && order.fulfillmentType === 'Delivery' && "Delivered! Your order has been completed."}
                  {order.status === 'Cancelled' && "This order has been cancelled. If you have questions, please contact support."}
                </p>
              </div>
            </div>
          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fulfillment Type */}
            <div className="bg-white rounded-2xl p-4 border-2 border-grey-stroke">
              <div className="flex items-center gap-2 mb-2">
                {order.fulfillmentType === 'Delivery' ? (
                  <MapPin size={20} weight="fill" className="text-sage-600" />
                ) : (
                  <Storefront size={20} weight="fill" className="text-sage-600" />
                )}
                <p className="text-sm font-semibold text-charcoal-500">Fulfillment Type</p>
              </div>
              <p className="text-lg font-bold text-charcoal-700">{order.fulfillmentType}</p>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-4 border-2 border-grey-stroke">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="text-sm font-semibold text-charcoal-500">Payment Method</p>
              </div>
              <p className="text-lg font-bold text-charcoal-700">{order.paymentMethod}</p>
            </div>

            {/* Subtotal */}
            <div className="bg-white rounded-2xl p-4 border-2 border-grey-stroke">
              <p className="text-sm font-semibold text-charcoal-500 mb-2">Subtotal</p>
              <p className="text-lg font-bold text-charcoal-700">BHD {order.subtotalAmount?.toFixed(3)}</p>
            </div>

            {/* Delivery Fee */}
            {order.fulfillmentType === 'Delivery' && (
              <div className="bg-white rounded-2xl p-4 border-2 border-grey-stroke">
                <p className="text-sm font-semibold text-charcoal-500 mb-2">Delivery Fee</p>
                <p className="text-lg font-bold text-charcoal-700">BHD {order.deliveryFee?.toFixed(3)}</p>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-sage-100 to-sage-200 rounded-2xl p-6 border-2 border-sage-300">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-charcoal-700">Total Amount:</span>
              <span className="text-3xl font-black text-sage-700">BHD {order.totalAmount?.toFixed(3)}</span>
            </div>
          </div>

          {/* Order Comments */}
            {order.orderNote && (
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800 mb-1">Your Order Comments</p>
                    <p className="text-sm text-charcoal-700 bg-white/60 rounded px-3 py-2">
                      {order.orderNote}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Pickup Location - ONLY for pickup orders */}
          {isPickup && order.pickupAddress && (
            <div className="bg-white rounded-2xl p-6 border-2 border-grey-stroke">
              {/* HEADER + VIEW MAP BUTTON */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-charcoal-700 flex items-center gap-2" style={{ fontFamily: 'Merriweather, serif' }}>
                  <Storefront size={24} weight="fill" className="text-sage-600" />
                  Pickup Location
                </h3>
              </div>

              {/* INFO BLOCK */}
              <div className="mb-4 bg-sage-50 border-2 border-sage-300 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sage-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Storefront size={24} weight="fill" className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-charcoal-700 text-xl mb-2">
                      {order.storeName || order.sellerName || "Store"}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} weight="fill" className="text-sage-600 mt-0.5 flex-shrink-0" />
                        <p className="text-charcoal-700 font-medium">
                          {order.pickupAddress.street}, {order.pickupAddress.city}
                        </p>
                      </div>

                      {order.storePhone && (
                        <div className="flex items-center gap-2 text-sage-700 font-semibold select-none">
                          <Phone size={16} weight="fill" />
                          {order.storePhone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* READY MESSAGE - Only show when backend status is actually "Ready for Pickup" or "Completed" */}
              {(order.status === "Ready for Pickup" || order.status === "Completed") && (
                <div className="mt-3 p-3 bg-sage-600 rounded-lg">
                  <p className="text-sm font-bold text-white">
                    ✓ Your order is ready! Head to the Store to collect it.
                  </p>
                </div>
              )}

              {/* MAP SCROLL TARGET */}
              <div ref={mapRef} id="pickup-map" className="h-64 rounded-xl overflow-hidden border-2 border-grey-stroke shadow-md mt-4">
                {(() => {
                  // ✅ SAFETY CHECK - Prevent crash if address is empty
                  if (!order.pickupAddress) {
                    return (
                      <div className="flex items-center justify-center h-full bg-amber-50 text-amber-700 font-semibold p-4 text-center">
                        <div>
                          <MapPin size={48} className="mx-auto mb-2 text-amber-500" />
                          <p>⚠️ Store location not available</p>
                        </div>
                      </div>
                    );
                  }

                  const lat = parseFloat(order.pickupAddress.latitude);
                  const lng = parseFloat(order.pickupAddress.longitude);

                  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

                  if (!hasValidCoords) {
                    return (
                      <div className="flex items-center justify-center h-full bg-amber-50 text-amber-700 font-semibold p-4 text-center">
                        <div>
                          <MapPin size={48} className="mx-auto mb-2 text-amber-500" />
                          <p>⚠️ Store location coordinates not available</p>
                          <p className="text-xs mt-2 text-charcoal-500">
                            Address: {order.pickupAddress?.street}, {order.pickupAddress?.city}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  // ✅ Valid coordinates - render map
                  return (
                    <MapContainer
                      center={[lat, lng]}
                      zoom={15}
                      scrollWheelZoom={true}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer 
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />

                      <Marker 
                        position={[lat, lng]}
                        icon={L.divIcon({
                          className: 'custom-store-marker',
                          html: `
                            <div style="
                              width: 36px; 
                              height: 36px; 
                              background: #556B5C; 
                              border: 3px solid white; 
                              border-radius: 50%; 
                              display: flex; 
                              align-items: center; 
                              justify-content: center;
                              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            ">
                              <svg width="20" height="20" viewBox="0 0 256 256" fill="white">
                                <path d="M232,96a7.89,7.89,0,0,0-.3-2.2L217.35,43.6A16.07,16.07,0,0,0,202,32H54A16.07,16.07,0,0,0,38.65,43.6L24.31,93.8A7.89,7.89,0,0,0,24,96v16a40,40,0,0,0,16,32v64a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V144a40,40,0,0,0,16-32ZM54,48H202l11.42,40H42.61Zm50,56h48v8a24,24,0,0,1-48,0Zm-16,0v8a24,24,0,0,1-48,0v-8ZM200,208H56V151.2a40.57,40.57,0,0,0,8,.8,40,40,0,0,0,32-16,40,40,0,0,0,64,0,40,40,0,0,0,32,16,40.57,40.57,0,0,0,8-.8Zm-8-72a24,24,0,0,1-24-24v-8h48v8A24,24,0,0,1,192,136Z"/>
                              </svg>
                            </div>
                          `,
                          iconSize: [36, 36],
                          iconAnchor: [18, 18],
                          popupAnchor: [0, -18]
                        })}
                      >
                        <Popup>
                          <div className="p-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Storefront size={20} className="text-sage-600" />
                              <strong className="text-sage-700">{order.storeName || "Pickup Location"}</strong>
                            </div>
                            {order.pickupAddress.street && (
                              <p className="text-sm mb-1">
                                <strong>Street:</strong> {order.pickupAddress.street}
                              </p>
                            )}
                            {order.pickupAddress.city && (
                              <p className="text-sm">
                                <strong>City:</strong> {order.pickupAddress.city}
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  );
                })()}
              </div>
            </div>
          )}

         {/* Delivery Route Map - ONLY for delivery orders */}
          {!isPickup && order.pickupAddress && order.deliveryAddress && (
            <div className="bg-white rounded-2xl p-6 border-2 border-grey-stroke">
              {/* HEADER */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-charcoal-700 flex items-center gap-2" style={{ fontFamily: 'Merriweather, serif' }}>
                  <MapPin size={24} weight="fill" className="text-sage-600" />
                  {tracking?.showMap ? 'Live Delivery Tracking' : 'Delivery Route'}
                </h3>
                {tracking?.showMap && (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-semibold text-green-600">Live</span>
                  </div>
                )}
              </div>

              {/* Show tracking info if available */}
              {tracking?.showMap && tracking.estimatedArrival > 0 && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Package size={20} weight="fill" className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-green-800">Driver is on the way!</p>
                        <p className="text-sm text-green-700">
                          Estimated arrival: {Math.ceil(tracking.estimatedArrival)} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INFO BLOCKS - Store and Customer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Store/Pickup Location */}
                <div className="bg-sage-50 border-2 border-sage-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-sage-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Storefront size={20} weight="fill" className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-sage-700 uppercase tracking-wide mb-1 font-semibold">
                        📦 PICKUP LOCATION
                      </p>
                      <p className="font-bold text-charcoal-700 text-base mb-1">
                        {order.sellerName || "Store"}
                      </p>
                      <div className="flex items-start gap-1 text-sm text-charcoal-600">
                        <MapPin size={14} weight="fill" className="text-sage-600 mt-0.5 flex-shrink-0" />
                        <p>{order.pickupAddress.street}, {order.pickupAddress.city}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer/Delivery Location */}
                <div className="bg-danger-bg border-2 border-danger-btn/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-danger-btn rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={20} weight="fill" className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-danger-text uppercase tracking-wide mb-1 font-semibold">
                        📍 DELIVERY LOCATION
                      </p>
                      <p className="font-bold text-charcoal-700 text-base mb-1">
                        {order.customerName || "Customer"}
                      </p>
                      <div className="flex items-start gap-1 text-sm text-charcoal-600">
                        <MapPin size={14} weight="fill" className="text-danger-btn mt-0.5 flex-shrink-0" />
                        <p>{order.deliveryAddress.street}, {order.deliveryAddress.city}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MAP */}
              <div className="h-96 rounded-xl overflow-hidden border-2 border-grey-stroke shadow-md">
                {(() => {
                  // ✅ SAFETY CHECK
                  if (!order.pickupAddress || !order.deliveryAddress) {
                    return (
                      <div className="flex items-center justify-center h-full bg-amber-50 text-amber-700 font-semibold p-4 text-center">
                        <div>
                          <MapPin size={48} className="mx-auto mb-2 text-amber-500" />
                          <p>⚠️ Route locations not available</p>
                        </div>
                      </div>
                    );
                  }

                  const pickupLat = parseFloat(order.pickupAddress.latitude);
                  const pickupLng = parseFloat(order.pickupAddress.longitude);
                  const deliveryLat = parseFloat(order.deliveryAddress.latitude);
                  const deliveryLng = parseFloat(order.deliveryAddress.longitude);

                  const hasValidCoords = 
                    !isNaN(pickupLat) && !isNaN(pickupLng) && pickupLat !== 0 && pickupLng !== 0 &&
                    !isNaN(deliveryLat) && !isNaN(deliveryLng) && deliveryLat !== 0 && deliveryLng !== 0;

                 if (!hasValidCoords) {
                    // Check which coordinates are missing
                    const missingPickup = isNaN(pickupLat) || isNaN(pickupLng) || pickupLat === 0 || pickupLng === 0;
                    const missingDelivery = isNaN(deliveryLat) || isNaN(deliveryLng) || deliveryLat === 0 || deliveryLng === 0;
                    
                    return (
                      <div className="flex items-center justify-center h-full bg-blue-50 p-6 text-center">
                        <div className="max-w-md">
                          <Package size={64} className="mx-auto mb-4 text-blue-500" />
                          <h4 className="text-xl font-bold text-charcoal-700 mb-2">
                            Tracking In Progress
                          </h4>
                          <p className="text-base text-charcoal-600 mb-4">
                            {missingDelivery 
                              ? "Your delivery address needs location coordinates for live tracking. The driver will still deliver to your address."
                              : "Route information is being prepared."}
                          </p>
                          <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                            <p className="text-sm text-charcoal-600 mb-2">
                              <strong>Delivery Address:</strong>
                            </p>
                            <p className="text-sm text-charcoal-700">
                              {order.deliveryAddress?.street}<br/>
                              {order.deliveryAddress?.city}, {order.deliveryAddress?.region}
                            </p>
                          </div>
                          <p className="text-xs text-charcoal-400 mt-4">
                            📍 Tip: Add location coordinates when setting delivery addresses for live tracking
                          </p>
                        </div>
                      </div>
                    );
                  }

                  // Calculate center point
                  const centerLat = (pickupLat + deliveryLat) / 2;
                  const centerLng = (pickupLng + deliveryLng) / 2;

                  // ✅ Valid coordinates - render map with markers
                  return (
                    <MapContainer
  center={[centerLat, centerLng]}
  zoom={13}
  scrollWheelZoom={true}
  style={{ height: "100%", width: "100%" }}
  key={tracking?.showMap ? 'tracking' : 'static'}
>
  <TileLayer 
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  />

  {/* DRAW ROUTE POLYLINE */}
  {tracking?.routePolyline && tracking.routePolyline.length > 0 && (
    <Polyline
      positions={tracking.routePolyline}
      pathOptions={{
        color: '#556B5C',
        weight: 4,
        opacity: 0.7
      }}
    />
  )}

  {/* Pickup Marker */}
  <Marker 
    position={[pickupLat, pickupLng]}
    icon={L.divIcon({
      className: 'custom-store-marker',
      html: `
        <div style="
          width: 40px; 
          height: 40px; 
          background: #556B5C; 
          border: 4px solid white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          <svg width="20" height="20" viewBox="0 0 256 256" fill="white">
            <path d="M232,96a7.89,7.89,0,0,0-.3-2.2L217.35,43.6A16.07,16.07,0,0,0,202,32H54A16.07,16.07,0,0,0,38.65,43.6L24.31,93.8A7.89,7.89,0,0,0,24,96v16a40,40,0,0,0,16,32v64a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V144a40,40,0,0,0,16-32V96ZM54,48H202l11.42,40H42.61Zm50,56h48v8a24,24,0,0,1-48,0Zm-16,0v8a24,24,0,0,1-48,0v-8ZM200,208H56V151.2a40.57,40.57,0,0,0,8,.8,40,40,0,0,0,32-16,40,40,0,0,0,64,0,40,40,0,0,0,32,16,40.57,40.57,0,0,0,8-.8Zm-8-72a24,24,0,0,1-24-24v-8h48v8A24,24,0,0,1,192,136Z"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -18]
    })}
  >
    <Popup>
      <div className="p-2">
        <div className="flex items-center gap-2 mb-2">
          <Storefront size={20} className="text-sage-600" />
          <strong className="text-sage-700">Pickup Location</strong>
        </div>
        <p className="text-sm mb-1">
          <strong>{order.sellerName || "Store"}</strong>
        </p>
        {order.pickupAddress.street && (
          <p className="text-sm mb-1">
            {order.pickupAddress.street}
          </p>
        )}
        {order.pickupAddress.city && (
          <p className="text-sm">
            {order.pickupAddress.city}
          </p>
        )}
      </div>
    </Popup>
  </Marker>

  {/* Driver Marker - ONLY show when tracking is active */}
    {tracking?.showMap && tracking.driverLocation && (
    <Marker 
      position={[
        tracking.driverLocation.latitude, 
        tracking.driverLocation.longitude
      ]}
      icon={L.divIcon({
        className: 'custom-driver-marker',
        html: `
          <div style="
            width: 50px; 
            height: 50px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
          ">
            <svg width="40" height="40" viewBox="0 0 512 512" fill="#000000ff">
              <polygon points="168.548,269.165 196.66,275.239 213.052,199.29 184.94,193.216" />
              <path d="M449.358,358.86c2.01,3.679,3.164,7.933,3.164,12.485c0,14.492-11.735,26.224-26.236,26.224c-14.496,0-26.232-11.732-26.232-26.224c0-4.552,1.153-8.806,3.165-12.485h-32.157c-3.284,0-6.444,0.515-9.433,1.44c-0.578,3.567-0.922,7.247-0.922,11.046c0,36.239,29.336,65.583,65.579,65.583c36.247,0,65.583-29.344,65.583-65.583c0-4.262-0.402-8.464-1.205-12.485H449.358z" />
              <path d="M103.55,358.86h-2.818c2.015,3.679,3.161,7.933,3.161,12.485c0,14.492-11.735,26.224-26.228,26.224c-14.497,0-26.232-11.732-26.232-26.224c0-4.552,1.146-8.806,3.164-12.485h-41.31c-0.806,4.022-1.209,8.223-1.209,12.485c0,36.239,29.344,65.583,65.587,65.583c31.694,0,58.161-22.434,64.258-52.359v-4.597C141.924,360.412,112.524,358.86,103.55,358.86z" />
              <path d="M512,347.374s0.008-101.643-67.113-101.643H304.564c1.877,4.418,4.53,8.47,8.008,11.515c15.336,13.426,26.847,61.359-5.754,70.949H176.416l-24.926-24.926l36.434-168.757h57.333c5.403,0,9.784-4.38,9.784-9.783v-9.963c0-5.404-4.381-9.784-9.784-9.784h-51.583c0,0-15.336-29.911-84.371-29.911v63.285h32.221l-1.541,9.582L97.8,236.149S0,259.157,0,347.374c0,0,80.539,0,103.55,0c23.012,0,49.863,7.672,49.863,32.598h174.991l1.134-3.224c6.213-17.597,22.855-29.374,41.524-29.374H512z" />
              <path d="M444.887,232.313v-11.687c0-12.604-10.22-22.821-22.832-22.821H314.486c-13.343,0-16.325,19.463-9.922,34.508H444.887z" />
            </svg>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -20]
      })}
    >
      <Popup>
        <div className="p-2">
          <div className="flex items-center gap-2 mb-2">
            <Package size={20} className="text-green-600" />
            <strong className="text-green-700">Driver Location</strong>
          </div>
          <p className="text-sm text-green-700 font-semibold">
            On the way to you!
          </p>
          {tracking.estimatedArrival > 0 && (
            <p className="text-xs text-charcoal-600 mt-1">
              ETA: {Math.ceil(tracking.estimatedArrival)} min
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  )}

  {/* Delivery Marker */}
  <Marker 
    position={[deliveryLat, deliveryLng]}
    icon={L.divIcon({
      className: 'custom-house-marker',
      html: `
        <div style="
          width: 40px; 
          height: 40px; 
          background: #556B5C; 
          border: 4px solid white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="white">
            <path d="M1 6V15H6V11C6 9.89543 6.89543 9 8 9C9.10457 9 10 9.89543 10 11V15H15V6L8 0L1 6Z"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -18]
    })}
  >
    <Popup>
      <div className="p-2">
        <div className="flex items-center gap-2 mb-2">
          <User size={20} className="text-danger-btn" />
          <strong className="text-danger-text">Delivery Location</strong>
        </div>
        <p className="text-sm mb-1">
          <strong>{order.customerName || "Customer"}</strong>
        </p>
        {order.deliveryAddress.street && (
          <p className="text-sm mb-1">
            {order.deliveryAddress.street}
          </p>
        )}
        {order.deliveryAddress.city && (
          <p className="text-sm">
            {order.deliveryAddress.city}
          </p>
        )}
      </div>
    </Popup>
  </Marker>
</MapContainer>
                  );
                })()}
              </div>

              {/* LEGEND */}
              <div className="mt-4 flex items-center justify-center gap-8 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <Storefront size={20} className="text-sage-600" />
                  <span className="text-charcoal-600 font-medium">Store Location</span>
                </div>
                {tracking?.showMap && (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                    <span className="text-charcoal-600 font-medium">Driver (Live)</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User size={20} className="text-danger-btn" />
                  <span className="text-charcoal-600 font-medium">Your Location</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-white border-t-2 border-grey-stroke p-4">
          <button
            onClick={onClose}
            className="w-full bg-grey-300 hover:bg-grey-400 text-charcoal-600 font-bold py-3 rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </>
);

};

export default OrderDetails;
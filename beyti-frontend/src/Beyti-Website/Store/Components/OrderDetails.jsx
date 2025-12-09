import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Package, CheckCircle, Clock, Storefront, Phone, User } from '@phosphor-icons/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';


// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const OrderDetails = ({ order, onClose }) => {

  const mapRef = useRef(null);


useEffect(() => {
  if (order) {
    console.log('📦 OrderDetails received order:', order);
    
    // No auto-dismiss - user closes manually
  }
}, [order]);

  if (!order) {
    console.log('⚠️ No order provided to OrderDetails');
    return null;
  }

  // Order status progression
        const statuses = [
        { key: 'Placed', label: 'Order Placed', icon: Package },
        { key: 'Accepted', label: 'Restaurant Accepted', icon: CheckCircle },
        { key: 'Preparing', label: 'Preparing', icon: Clock },
        { key: 'Ready for Pickup', label: order.fulfillmentType === 'Delivery' ? 'Ready for Pickup' : 'Ready for Pickup', icon: CheckCircle },
        ];

        if (order.fulfillmentType === 'Delivery') {
        statuses.push(
            { key: 'Picked Up', label: 'Out for Delivery', icon: Package },
            { key: 'Delivered', label: 'Delivered', icon: CheckCircle }
        );
        } else {
        statuses.push(
            { key: 'Completed', label: 'Completed', icon: CheckCircle }
        );
        }

  const currentStatusIndex = statuses.findIndex(s => s.key === order.status);
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
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
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
            <h3 className="text-xl font-bold text-charcoal-700 mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
              Order Status
            </h3>
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
            <div className="mb-6 p-4 bg-sage-50 rounded-xl">
              <p className="text-lg font-bold text-sage-700 mb-1">
                {currentStatusIndex === 0 && "Order Placed Successfully! 🎉"}
                {currentStatusIndex === 1 && "Restaurant is preparing your order 👨‍🍳"}
                {currentStatusIndex === 2 && "Your order is being prepared 🔥"}
                {currentStatusIndex === 3 && (order.fulfillmentType === 'Delivery' ? "Order is ready for pickup by driver 📦" : "Your order is ready for pickup! 🎊")}
                {currentStatusIndex === 4 && order.fulfillmentType === 'Delivery' && "Driver is on the way to you 🚗"}
                {currentStatusIndex === 5 && "Order delivered! Enjoy your meal 🎉"}
                {order.status === 'Completed' && order.fulfillmentType === 'Pickup' && "Order completed! Thank you 🎉"}
              </p>
              <p className="text-sm text-charcoal-600">
                {currentStatusIndex === 0 && "We've received your order and notified the restaurant."}
                {currentStatusIndex === 1 && "The restaurant has accepted your order and started preparation."}
                {currentStatusIndex === 2 && "Your delicious food is being cooked with care."}
                {currentStatusIndex === 3 && (order.fulfillmentType === 'Delivery' ? "Your order is packed and waiting for a driver." : "Head to the restaurant to collect your order!")}
                {currentStatusIndex === 4 && order.fulfillmentType === 'Delivery' && "Your order is out for delivery and will arrive soon."}
                {currentStatusIndex === 5 && "Your order has been delivered. Bon appétit!"}
                {order.status === 'Completed' && order.fulfillmentType === 'Pickup' && "We hope you enjoyed your meal!"}
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

          {/* Pickup Location - ONLY for pickup orders */}
          {isPickup && order.pickupAddress && (
            <div className="bg-white rounded-2xl p-6 border-2 border-grey-stroke">
              {/* HEADER + VIEW MAP BUTTON */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-charcoal-700 flex items-center gap-2" style={{ fontFamily: 'Merriweather, serif' }}>
                  <Storefront size={24} weight="fill" className="text-sage-600" />
                  Pickup Location
                </h3>

                <button
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                  className="bg-sage-600 hover:bg-sage-700 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow transition-all"
                >
                  View Map
                </button>
              </div>

              {/* INFO BLOCK */}
              <div className="mb-4 bg-sage-50 border-2 border-sage-300 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sage-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Storefront size={24} weight="fill" className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-charcoal-700 text-xl mb-2">
                      {order.storeName || order.sellerName || "Restaurant"}
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

              {/* READY MESSAGE */}
              {(order.status === "Ready" ||
                order.status === "Ready for Pickup" ||
                order.status === "Completed") && (
                <div className="mt-3 p-3 bg-sage-600 rounded-lg">
                  <p className="text-sm font-bold text-white">
                    ✓ Your order is ready! Head to the restaurant to collect it.
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

                      <Marker position={[lat, lng]}>
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

          {/* Delivery Address (only for delivery orders) */}
          {!isPickup && order.deliveryAddress && (
            <div className="bg-white rounded-2xl p-6 border-2 border-grey-stroke">
              <h3 className="text-xl font-bold text-charcoal-700 mb-4 flex items-center gap-2" style={{ fontFamily: 'Merriweather, serif' }}>
                <MapPin size={24} weight="fill" className="text-sage-600" />
                Delivery Address
              </h3>
              <div className="bg-sage-50 rounded-lg p-4">
                <p className="text-charcoal-700 font-semibold">{order.deliveryAddress.street}</p>
                <p className="text-charcoal-600">{order.deliveryAddress.city}, {order.deliveryAddress.country}</p>
                {order.deliveryAddress.building && (
                  <p className="text-charcoal-500 text-sm mt-1">Building: {order.deliveryAddress.building}</p>
                )}
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
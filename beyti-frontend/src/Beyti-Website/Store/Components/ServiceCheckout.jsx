import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Clock, CalendarCheck } from '@phosphor-icons/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import BookingConfirmationModal from '../../../components/BookingConfirmationModal';
import { cancelServiceBooking } from '../../../services/api';

const ServiceCheckout = ({ bookingData, onClose }) => {
  const [step, setStep] = useState(1); // 1: Date & Time, 2: Address, 3: Notes
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [dateAvailability, setDateAvailability] = useState({});
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLocation, setMapLocation] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [notes, setNotes] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [showAreYouSureDialog, setShowAreYouSureDialog] = useState(false);

  // New address form
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    region: '',
    country: 'Bahrain',
    postalCode: ''
  });

  // Generate next 7 days for date selection
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const availableDates = generateDates();

  // Fetch customer addresses on mount
  useEffect(() => {
    fetchCustomerAddresses();
  }, []);

  // Check availability for all dates on mount
  useEffect(() => {
    if (bookingData?.serviceProviderId) {
      checkDateAvailability();
    }
  }, [bookingData]);

  // Fetch available time slots when date is selected
  useEffect(() => {
    if (selectedDate && bookingData?.serviceProviderId) {
      fetchAvailableTimeSlots();
    }
  }, [selectedDate, bookingData]);

  const checkDateAvailability = async () => {
    try {
      const availability = {};

      // Fetch all time slots for this provider
      const slotsResponse = await fetch(
        `https://localhost:7062/api/TimeSlots?serviceProviderId=${bookingData.serviceProviderId}`
      );

      if (!slotsResponse.ok) return;

      const allSlots = await slotsResponse.json();
      const activeSlots = allSlots.filter(slot => slot.isActive);

      // Check each date
      for (const date of availableDates) {
        const dayOfWeek = date.getDay();
        const daySlots = activeSlots.filter(slot => slot.dayOfWeek === dayOfWeek);

        if (daySlots.length === 0) {
          availability[date.toDateString()] = false;
          continue;
        }

        // Check if any slot is available on this date
        // A TimeSlot is UNAVAILABLE if it has a booking with ANY active status
        // Active statuses: Pending, PendingQuote, DepositPending, Confirmed, InProgress
        // Final statuses (don't block): Completed, Canceled, Rejected
        const availabilityChecks = await Promise.all(
          daySlots.map(async (slot) => {
            const bookingsResponse = await fetch(
              `https://localhost:7062/api/ServiceBookings?serviceProviderId=${bookingData.serviceProviderId}&date=${date.toISOString()}&timeSlotId=${slot.id}`
            );

            if (bookingsResponse.ok) {
              const bookings = await bookingsResponse.json();
              console.log(`[Date Check] Slot ${slot.id} on ${date.toDateString()} has ${bookings.length} bookings:`, bookings);

              // Check if there's any active booking that blocks this time slot
              const activeStatuses = ['Pending', 'PendingQuote', 'DepositPending', 'Confirmed', 'InProgress'];
              const hasActiveBooking = bookings.some(
                booking => {
                  const isActive = activeStatuses.includes(booking.status);
                  console.log(`[Date Check] Booking ${booking.id} - Status: "${booking.status}", Blocks: ${isActive}`);
                  return isActive;
                }
              );
              console.log(`[Date Check] Slot ${slot.id} available: ${!hasActiveBooking}`);
              return !hasActiveBooking; // Return true if available (no active bookings)
            }
            return true;
          })
        );

        // Date has availability if at least one slot is available
        availability[date.toDateString()] = availabilityChecks.some(isAvailable => isAvailable);
      }

      setDateAvailability(availability);
    } catch (err) {
      console.error('Error checking date availability:', err);
    }
  };

  const fetchCustomerAddresses = async () => {
    try {
      setLoadingAddresses(true);
      // Hardcoded values for now - will be replaced with context/API in future
      const customerId = 2; // TODO: Get from API based on userProfileId

      if (customerId) {
        const response = await fetch(`https://localhost:7062/api/CustomerAddresses?customerId=${customerId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Customer addresses data:', data);

          // Extract address objects from CustomerAddress records (now includes Address via navigation property)
          // Handle both possible response formats: lowercase 'address' and uppercase 'Address'
          let customerAddresses = data
            .map(ca => ca.address || ca.Address) // Try both property names (camelCase or PascalCase)
            .filter(addr => addr !== null && addr !== undefined);

          console.log('Extracted addresses (before active filter):', customerAddresses);

          // Filter for active addresses only
          customerAddresses = customerAddresses.filter(addr => addr.isActive !== false); // Keep if isActive is true or undefined

          console.log('Extracted addresses (after active filter):', customerAddresses);

          // If no addresses found with navigation property, fall back to fetching individually
          if (customerAddresses.length === 0 && data.length > 0) {
            console.log('No addresses found in navigation property, fetching individually...');
            const addressDetails = await Promise.all(
              data.map(async (ca) => {
                try {
                  const addressId = ca.addressId || ca.AddressId;
                  console.log('Fetching address ID:', addressId);
                  const addrResponse = await fetch(`https://localhost:7062/api/Addresses/${addressId}`);
                  if (addrResponse.ok) {
                    return await addrResponse.json();
                  }
                } catch (err) {
                  console.error('Error fetching individual address:', err);
                }
                return null;
              })
            );
            customerAddresses = addressDetails.filter(addr => addr !== null && addr.isActive !== false);
            console.log('Fetched addresses individually:', customerAddresses);
          }

          setAddresses(customerAddresses);

          // Auto-select the default address or the first address
          if (customerAddresses.length > 0 && !selectedAddress) {
            const defaultAddr = customerAddresses.find(addr => addr.isDefault) || customerAddresses[0];
            console.log('Auto-selected address:', defaultAddr);
            setSelectedAddress(defaultAddr);
          }
        } else {
          console.error('Failed to fetch customer addresses:', response.status);
        }
      } else {
        console.error('No customerId found in userProfile');
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchAvailableTimeSlots = async () => {
    try {
      setLoadingTimeSlots(true);
      const dayOfWeek = selectedDate.getDay();

      // Fetch time slots for this provider and day
      const response = await fetch(
        `https://localhost:7062/api/TimeSlots?serviceProviderId=${bookingData.serviceProviderId}`
      );

      if (response.ok) {
        const allSlots = await response.json();
        // Filter by day of week and active status
        const daySlots = allSlots.filter(
          slot => slot.dayOfWeek === dayOfWeek && slot.isActive
        );

        // Check which slots are already booked
        // TimeSlots with ANY active booking status must NOT be shown as available
        const availabilityPromises = daySlots.map(async (slot) => {
          const bookingsResponse = await fetch(
            `https://localhost:7062/api/ServiceBookings?serviceProviderId=${bookingData.serviceProviderId}&date=${selectedDate.toISOString()}&timeSlotId=${slot.id}`
          );

          if (bookingsResponse.ok) {
            const bookings = await bookingsResponse.json();
            console.log(`[Time Selection] Slot ${slot.id} (${slot.startTime}-${slot.endTime}) has ${bookings.length} bookings:`, bookings);

            // Check if there's any active booking that blocks this time slot
            // Active statuses (block availability): Pending, PendingQuote, DepositPending, Confirmed, InProgress
            // Final statuses (don't block): Completed, Canceled, Rejected
            const activeStatuses = ['Pending', 'PendingQuote', 'DepositPending', 'Confirmed', 'InProgress'];
            const hasActiveBooking = bookings.some(
              booking => {
                const isActive = activeStatuses.includes(booking.status);
                console.log(`[Time Selection] Booking ${booking.id} - Status: ${booking.status}, Blocks: ${isActive}`);
                return isActive;
              }
            );
            console.log(`[Time Selection] Slot ${slot.id} final availability: ${!hasActiveBooking}`);
            return { ...slot, isAvailable: !hasActiveBooking };
          }
          return { ...slot, isAvailable: true };
        });

        const slotsWithAvailability = await Promise.all(availabilityPromises);
        setAvailableTimeSlots(slotsWithAvailability);
      }
    } catch (err) {
      console.error('Error loading time slots:', err);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const MapSelector = () => {
    useMapEvents({
      click(e) {
        setMapLocation(e.latlng);
        setNewAddress(prev => ({
          ...prev,
          street: `Location: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
        }));
      }
    });
    return mapLocation ? <Marker position={[mapLocation.lat, mapLocation.lng]} /> : null;
  };

  useEffect(() => {
    if (mapLocation) {
      if (!newAddress.city) {
        setNewAddress(prev => ({
          ...prev,
          city: 'Manama',
          region: 'Capital',
        }));
      }
    }
  }, [mapLocation]);

  const handleSaveAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.region) {
      alert('Please fill required fields');
      return;
    }

    try {
      // Create address in backend
      const addressPayload = {
        street: newAddress.street,
        city: newAddress.city,
        region: newAddress.region,
        country: newAddress.country,
        postalCode: newAddress.postalCode,
        latitude: mapLocation?.lat,
        longitude: mapLocation?.lng,
        isDefault: addresses.length === 0,
        isActive: true
      };

      const response = await fetch('https://localhost:7062/api/Addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressPayload)
      });

      if (response.ok) {
        const savedAddress = await response.json();

        // Link address to customer
        // Hardcoded customerId - will be replaced with context/API in future
        const customerId = 2; // TODO: Get from API based on userProfileId

        if (customerId) {
          await fetch('https://localhost:7062/api/CustomerAddresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: customerId,
              addressId: savedAddress.id
            })
          });
        }

        // Reset form fields
        setNewAddress({ street: '', city: '', region: '', country: 'Bahrain', postalCode: '' });
        setMapLocation(null);
        setShowAddressModal(false);

        // Refresh addresses from backend to get the complete data
        await fetchCustomerAddresses();

        // Auto-select the newly added address
        setSelectedAddress(savedAddress);
      }
    } catch (err) {
      console.error('Error saving address:', err);
      alert('Failed to save address');
    }
  };

  const handleContinue = () => {
    if (step === 1 && (!selectedDate || !selectedTimeSlot)) {
      alert('Please select date and time slot');
      return;
    }
    if (step === 2 && !selectedAddress) {
      alert('Please select service address');
      return;
    }
    // Step 3 is notes - optional, so no validation needed

    if (step < 3) {
      setStep(step + 1);
    } else {
      // Show "Are you sure?" dialog before placing booking
      setShowAreYouSureDialog(true);
    }
  };

  const handlePlaceBooking = async () => {
    try {
      // Hardcoded customerId - will be replaced with context/API in future
      const customerId = 2; // TODO: Get from API based on userProfileId

      if (!customerId) {
        alert('Please log in to book a service');
        return;
      }

      // Combine selected date with time slot's start time
      // IMPORTANT: Create datetime in local timezone (Bahrain) without conversion to UTC
      const [hours, minutes] = selectedTimeSlot.startTime.split(':');
      const bookingDateTime = new Date(selectedDate);
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Format as ISO string but remove the 'Z' to treat it as local time
      // This ensures the backend receives the exact time the user selected
      const year = bookingDateTime.getFullYear();
      const month = String(bookingDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(bookingDateTime.getDate()).padStart(2, '0');
      const hour = String(bookingDateTime.getHours()).padStart(2, '0');
      const minute = String(bookingDateTime.getMinutes()).padStart(2, '0');
      const second = String(bookingDateTime.getSeconds()).padStart(2, '0');
      const localDateTimeString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

      const bookingPayload = {
        customerId: customerId,
        serviceProviderId: bookingData.serviceProviderId,
        serviceCatalogId: bookingData.serviceCatalogId,
        serviceId: bookingData.serviceId,
        serviceAddressId: selectedAddress.id,
        timeSlotId: selectedTimeSlot.id,
        bookingDateTime: localDateTimeString,
        status: 'Pending',
        serviceType: 'Scheduled',
        quotedPrice: bookingData.minPrice,
        notes: notes
      };

      console.log('Booking payload:', bookingPayload);

      const response = await fetch('https://localhost:7062/api/ServiceBookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      if (response.ok) {
        const booking = await response.json();
        // Enrich booking with service and provider details for display
        const enrichedBooking = {
          ...booking,
          serviceName: bookingData.serviceName,
          category: bookingData.category,
          serviceType: bookingData.serviceType || 'Scheduled',
          businessName: bookingData.serviceProviderName || bookingData.businessName,
          providerName: bookingData.serviceProviderName || bookingData.providerName,
          quotedPrice: bookingData.minPrice,
          address: selectedAddress
        };
        setCreatedBooking(enrichedBooking);
        setShowConfirmationModal(true);
      } else {
        const errorText = await response.text();
        console.error('Booking error response:', errorText);
        alert('Failed to place booking. Please try again.');
      }
    } catch (err) {
      console.error('Error placing booking:', err);
      alert('Failed to place booking. Please try again.');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTimeSlot = (slot) => {
    return `${slot.startTime} - ${slot.endTime}`;
  };

  const handleCancelBooking = async (bookingId, currentBooking, canceledBy, cancellationReason) => {
    try {
      await cancelServiceBooking(bookingId, currentBooking, canceledBy, cancellationReason);
      alert('Booking cancelled successfully.');
      setShowConfirmationModal(false);
      onClose();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  };

  const estimatedPrice = bookingData?.minPrice || 0;

  return (
    <>
      {/* Booking Confirmation Modal */}
      {createdBooking && (
        <BookingConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => {
            setShowConfirmationModal(false);
            onClose();
          }}
          booking={createdBooking}
          onCancel={handleCancelBooking}
        />
      )}

      {/* Are You Sure Dialog */}
      {showAreYouSureDialog && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-charcoal-600 mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
              Confirm Your Booking
            </h3>
            <p className="text-sm text-charcoal-500 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Are you sure you want to proceed with this booking?
            </p>

            {/* Booking Summary */}
            <div className="bg-cream-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Service:</span>
                <span className="font-semibold text-charcoal-600">{bookingData?.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Date:</span>
                <span className="font-semibold text-charcoal-600">{selectedDate && formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Time:</span>
                <span className="font-semibold text-charcoal-600">{selectedTimeSlot && formatTimeSlot(selectedTimeSlot)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Price:</span>
                <span className="font-semibold text-sage-600">BD {estimatedPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAreYouSureDialog(false)}
                className="flex-1 px-4 py-2.5 bg-grey-200 text-charcoal-600 font-bold rounded-xl hover:bg-grey-300 transition-all text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAreYouSureDialog(false);
                  handlePlaceBooking();
                }}
                className="flex-1 px-4 py-2.5 bg-sage-500 text-white font-bold rounded-xl hover:bg-sage-600 transition-all text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Only show checkout modal if confirmation modal is not open */}
      {!showConfirmationModal && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cream-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-sage-500 to-sage-600 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>Book Service</h2>
            <p className="text-sage-100 text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              {bookingData?.serviceName}
            </p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all">
            <X size={20} weight="bold" className="text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-white px-5 py-3 border-b border-grey-stroke">
          <div className="flex items-center justify-between">
            {['Date & Time', 'Address', 'Notes'].map((label, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step > idx + 1 ? 'bg-sage-500 text-white' : step === idx + 1 ? 'bg-sage-500 text-white' : 'bg-grey-stroke text-charcoal-400'
                }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                  {step > idx + 1 ? '✓' : idx + 1}
                </div>
                <span className={`ml-1.5 text-xs font-semibold ${step === idx + 1 ? 'text-sage-600' : 'text-charcoal-400'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </span>
                {idx < 2 && <div className={`w-8 h-0.5 mx-2 ${step > idx + 1 ? 'bg-sage-500' : 'bg-grey-stroke'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Date & Time Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-charcoal-600 mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
                Select Date & Time
              </h3>

              {/* Date Selection */}
              <div>
                <p className="text-sm font-semibold text-charcoal-600 mb-2">Choose a Date</p>
                <div className="grid grid-cols-7 gap-2">
                  {availableDates.map((date, idx) => {
                    const hasAvailability = dateAvailability[date.toDateString()] !== false;
                    const isSelected = selectedDate?.toDateString() === date.toDateString();

                    return (
                      <button
                        key={idx}
                        onClick={() => hasAvailability && setSelectedDate(date)}
                        disabled={!hasAvailability}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? 'bg-sage-500 border-sage-500 text-white'
                            : hasAvailability
                            ? 'bg-white border-grey-stroke text-charcoal-600 hover:border-sage-500'
                            : 'bg-grey-100 border-grey-stroke text-charcoal-300 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="text-xs font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-lg font-black">{date.getDate()}</div>
                        {!hasAvailability && <div className="text-xs mt-1">Full</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Selection */}
              {selectedDate && (
                <div>
                  <p className="text-sm font-semibold text-charcoal-600 mb-2">Available Time Slots</p>
                  {loadingTimeSlots ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin" />
                    </div>
                  ) : availableTimeSlots.filter(slot => slot.isAvailable).length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimeSlots
                        .filter(slot => slot.isAvailable)
                        .map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              selectedTimeSlot?.id === slot.id
                                ? 'bg-sage-500 border-sage-500 text-white'
                                : 'bg-white border-grey-stroke text-charcoal-600 hover:border-sage-500'
                            }`}
                          >
                            <Clock size={16} weight="bold" className="mx-auto mb-1" />
                            <div className="text-xs font-bold">{formatTimeSlot(slot)}</div>
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-cream-100 rounded-xl">
                      <Clock size={32} className="mx-auto text-charcoal-400 mb-2" />
                      <p className="text-charcoal-500 text-sm">No available time slots for this date</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Address Selection */}
          {step === 2 && (
            <div>
              <h3 className="text-xl font-bold text-charcoal-600 mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                Service Address
              </h3>
              {loadingAddresses ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8 bg-cream-100 rounded-xl border-2 border-grey-stroke">
                  <MapPin size={48} className="mx-auto text-grey-stroke mb-3" weight="duotone" />
                  <p className="text-charcoal-600 font-bold mb-1 text-base">No Address Found</p>
                  <p className="text-charcoal-400 mb-5 text-sm">Please add your service location to continue</p>
                  <button onClick={() => setShowAddressModal(true)} className="bg-sage-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-sage-600 shadow-md transition-all">
                    + Add Your Address
                  </button>
                </div>
              ) : (
                <>
                  {/* Selected Address Highlight - Main Display */}
                  {selectedAddress && (
                    <div className="bg-gradient-to-r from-sage-100 to-sage-50 border-2 border-sage-400 rounded-xl p-5 mb-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0 shadow-md">
                          <MapPin size={24} weight="fill" className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-xs font-bold text-sage-700 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                              Your Service Address
                            </p>
                            {selectedAddress.isDefault && (
                              <span className="bg-sage-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                                Main Address
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-charcoal-600 text-base mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {selectedAddress.street}
                          </p>
                          <p className="text-sm text-charcoal-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {selectedAddress.city}, {selectedAddress.region}, {selectedAddress.country}
                            {selectedAddress.postalCode && ` - ${selectedAddress.postalCode}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info message */}
                  <p className="text-xs text-charcoal-400 mb-3 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                    You can continue with the address above or select a different one below
                  </p>

                  {/* All Addresses List */}
                  {addresses.length > 1 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Change Address (Optional)
                      </p>
                    <div className="space-y-2">
                      {addresses.map(addr => (
                        <button
                          key={addr.id}
                          onClick={() => setSelectedAddress(addr)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedAddress?.id === addr.id
                              ? 'bg-sage-500 border-sage-500 text-white'
                              : 'bg-white border-grey-stroke hover:border-sage-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-bold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {addr.street}
                              </p>
                              <p className="text-sm opacity-80" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {addr.city}, {addr.region}, {addr.country}
                              </p>
                            </div>
                            {addr.isDefault && selectedAddress?.id !== addr.id && (
                              <span className="bg-charcoal-200 text-charcoal-600 text-xs px-2 py-0.5 rounded-full font-semibold ml-2">
                                Default
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    </div>
                  )}

                  {/* Add New Address Button */}
                  <button onClick={() => setShowAddressModal(true)} className="w-full bg-white border-2 border-sage-500 text-sage-500 px-5 py-2.5 rounded-xl font-bold hover:bg-sage-50 transition-all">
                    + Add New Address
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 3: Notes/Comments */}
          {step === 3 && (
            <div>
              <h3 className="text-xl font-bold text-charcoal-600 mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
                Additional Notes
              </h3>
              <p className="text-sm text-charcoal-500 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                Add any special instructions or comments for the service provider (optional)
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., Please bring specific tools, access instructions, preferred contact method, etc."
                className="w-full h-40 border-2 border-grey-stroke rounded-xl p-4 text-sm resize-none focus:border-sage-500 focus:outline-none transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {notes.length}/500 characters
                </p>
                {notes.length > 0 && (
                  <button
                    onClick={() => setNotes('')}
                    className="text-xs text-sage-600 hover:text-sage-700 font-semibold"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-white border-t-2 border-grey-stroke p-4 flex gap-3">
          <button onClick={onClose} className="px-6 py-2.5 bg-grey-200 text-charcoal-600 font-bold rounded-xl hover:bg-grey-300 text-sm">
            Cancel
          </button>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 bg-grey-300 text-charcoal-600 font-bold rounded-xl hover:bg-grey-400 text-sm">
              Back
            </button>
          )}
          <button onClick={handleContinue} className="flex-1 bg-sage-500 text-white font-bold py-2.5 rounded-xl hover:bg-sage-600 text-sm">
            {step === 3 ? 'Confirm Booking' : 'Continue'}
          </button>
        </div>
      </div>

      {/* Add Address Modal */}
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
              <div className="relative h-48 rounded-xl overflow-hidden border-2 border-grey-stroke">
                {mapLocation ? (
                  <MapContainer center={[mapLocation.lat, mapLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[mapLocation.lat, mapLocation.lng]} />
                  </MapContainer>
                ) : (
                  <div className="h-full bg-grey-200 flex items-center justify-center">
                    <MapPin size={40} className="text-grey-stroke" />
                  </div>
                )}
                <button onClick={() => setShowMapModal(true)} className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all">
                  <div className="bg-white px-5 py-2.5 rounded-lg font-bold text-sage-600 shadow-lg text-sm">
                    {mapLocation ? 'Change Location' : 'Pick Location'}
                  </div>
                </button>
              </div>
              <input
                value={newAddress.street}
                onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                placeholder="Street *"
                className="w-full border-2 border-grey-stroke rounded-lg p-2.5 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={newAddress.city}
                  onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                  placeholder="City *"
                  className="border-2 border-grey-stroke rounded-lg p-2.5 text-sm"
                />
                <input
                  value={newAddress.region}
                  onChange={e => setNewAddress({...newAddress, region: e.target.value})}
                  placeholder="Region *"
                  className="border-2 border-grey-stroke rounded-lg p-2.5 text-sm"
                />
              </div>
              <input
                value={newAddress.postalCode}
                onChange={e => setNewAddress({...newAddress, postalCode: e.target.value})}
                placeholder="Postal Code"
                className="w-full border-2 border-grey-stroke rounded-lg p-2.5 text-sm"
              />
              <button onClick={handleSaveAddress} className="w-full bg-sage-500 text-white font-bold py-2.5 rounded-xl hover:bg-sage-600">
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden">
            <div className="p-5 border-b border-grey-stroke flex justify-between items-center">
              <h3 className="text-xl font-bold text-charcoal-600">Pick Location</h3>
              <button onClick={() => setShowMapModal(false)} className="p-2 hover:bg-grey-100 rounded-full">
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="h-80">
              <MapContainer center={[26.0667, 50.5577]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapSelector />
              </MapContainer>
            </div>
            <div className="p-5">
              <button
                onClick={() => setShowMapModal(false)}
                disabled={!mapLocation}
                className="w-full bg-sage-500 text-white font-bold py-2.5 rounded-xl hover:bg-sage-600 disabled:opacity-50"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </>
  );
};

export default ServiceCheckout;

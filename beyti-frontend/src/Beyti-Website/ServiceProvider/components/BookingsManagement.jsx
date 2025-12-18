import { useEffect, useState } from 'react';
import { getProviderBookings, updateBookingStatus, getProviderTimeSlots } from '../../../services/api';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import { logProviderActivity } from '../../../utils/providerActivityLogger';
import { Calendar } from '@phosphor-icons/react';

export default function BookingsManagement({ serviceProviderId, initialFilter = null }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(initialFilter || '');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' or 'all'
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [timeSlots, setTimeSlots] = useState([]);

  // Helper function to get the start of the week (Monday)
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // Helper function to get the end of the week (Sunday)
  function getWeekEnd(weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  // Fetch provider's time slots to show only their working hours
  const fetchTimeSlots = async () => {
    try {
      const data = await getProviderTimeSlots(serviceProviderId);
      setTimeSlots(data.filter(slot => slot.isActive)); // Only show active slots
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setTimeSlots([]);
    }
  };

  // Generate time slots for a specific day based on provider's schedule
  const getTimeSlotsForDay = (dayOfWeek) => {
    const daySlots = timeSlots.filter(slot => slot.dayOfWeek === dayOfWeek);

    if (daySlots.length === 0) return [];

    const allSlots = [];
    daySlots.forEach(slot => {
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);

      for (let hour = startHour; hour < endHour; hour++) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      }
      // Add the last hour if it's not on the hour
      if (endMinute > 0) {
        allSlots.push(`${endHour.toString().padStart(2, '0')}:00`);
      }
    });

    // Remove duplicates and sort
    return [...new Set(allSlots)].sort();
  };

  // Get all unique time slots across the week
  const getAllTimeSlots = () => {
    const allSlots = new Set();

    // Add all time slots from provider's schedule
    for (let day = 0; day <= 6; day++) {
      const daySlots = getTimeSlotsForDay(day);
      daySlots.forEach(slot => allSlots.add(slot));
    }

    // IMPORTANT: Also add time slots for any confirmed/in-progress/completed bookings
    // This ensures bookings show up even if they're outside normal working hours
    const weekEnd = getWeekEnd(currentWeekStart);
    bookings.forEach(booking => {
      const status = booking.status || booking.Status;
      if (['Confirmed', 'InProgress', 'Completed'].includes(status)) {
        const bookingDate = new Date(booking.bookingDateTime || booking.BookingDateTime);

        // Only add if booking is in current week
        if (bookingDate >= currentWeekStart && bookingDate <= weekEnd) {
          const hours = bookingDate.getHours().toString().padStart(2, '0');
          allSlots.add(`${hours}:00`);
        }
      }
    });

    return Array.from(allSlots).sort();
  };

  // Get days of the week starting from currentWeekStart
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getProviderBookings(serviceProviderId, filterStatus || null);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchTimeSlots();
  }, [serviceProviderId, filterStatus]);

  useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
      setViewMode('all');
    }
  }, [initialFilter]);

  const handleSendQuote = async () => {
    if (!quotePrice || parseFloat(quotePrice) <= 0) {
      alert('Please enter a valid quote price');
      return;
    }

    try {
      await updateBookingStatus(selectedBooking.id, {
        status: 'DepositPending',
        quotedPrice: parseFloat(quotePrice)
      });

      // Log activity
      logProviderActivity(
        serviceProviderId,
        'booking',
        'Sent Quote',
        `Customer: ${selectedBooking.customerName || 'N/A'} - ${parseFloat(quotePrice).toFixed(2)} BHD`
      );

      alert('Quote sent successfully!');
      setShowQuoteModal(false);
      setSelectedBooking(null);
      setQuotePrice('');
      fetchBookings();
    } catch (err) {
      console.error('Error sending quote:', err);
      alert('Error sending quote');
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      await updateBookingStatus(bookingId, { status: newStatus });

      // Log activity
      const actionMap = {
        'Confirmed': 'Confirmed Booking',
        'InProgress': 'Started Service',
        'Completed': 'Completed Service',
        'Canceled': 'Canceled Booking',
        'Rejected': 'Rejected Booking'
      };
      logProviderActivity(
        serviceProviderId,
        'booking',
        actionMap[newStatus] || 'Updated Booking',
        `Customer: ${booking?.customerName || 'N/A'}`
      );

      // Refresh bookings to show updated status immediately on calendar
      await fetchBookings();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating booking status');
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Confirmed':
        return 'success';
      case 'PendingQuote':
      case 'DepositPending':
        return 'danger';
      case 'InProgress':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Canceled':
      case 'Rejected':
        return 'error';
      default:
        return 'danger';
    }
  };

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  // Separate requested (pending) bookings from confirmed bookings
  const requestedBookings = bookings.filter(b =>
    ['Pending', 'PendingQuote', 'DepositPending'].includes(b.status)
  ).sort((a, b) => new Date(a.bookingDateTime || a.BookingDateTime) - new Date(b.bookingDateTime || b.BookingDateTime));

  const upcomingBookings = bookings.filter(b =>
    ['Pending', 'PendingQuote', 'DepositPending', 'Confirmed', 'InProgress'].includes(b.status)
  );

  // Weekly bookings for the schedule view - Show Confirmed, InProgress, and Completed
  const getWeeklyBookings = () => {
    const weekEnd = getWeekEnd(currentWeekStart);

    return bookings.filter(booking => {
      const bookingDate = new Date(booking.bookingDateTime || booking.BookingDateTime);
      const status = booking.status || booking.Status;

      // Check if booking is within the current week
      const isInWeek = bookingDate >= currentWeekStart && bookingDate <= weekEnd;

      if (!isInWeek) {
        return false;
      }

      // Show Confirmed, InProgress, and Completed bookings in the weekly calendar
      // As soon as a booking is accepted (Confirmed), it should appear on the calendar
      // Completed bookings will show even if they were completed before the scheduled time
      // (e.g., service scheduled for 8 AM but completed at 3 AM still shows on the calendar)
      return status === 'Confirmed' || status === 'InProgress' || status === 'Completed';
    }).sort((a, b) => {
      const dateA = new Date(a.bookingDateTime || a.BookingDateTime);
      const dateB = new Date(b.bookingDateTime || b.BookingDateTime);
      return dateA - dateB;
    });
  };

  const weeklyBookings = getWeeklyBookings();

  const displayedBookings = viewMode === 'upcoming'
    ? upcomingBookings
    : filterStatus
      ? bookings.filter(b => b.status === filterStatus)
      : bookings;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const weekEnd = getWeekEnd(currentWeekStart);
  const weekRange = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const allTimeSlots = getAllTimeSlots();
  const weekDays = getWeekDays();

  // Helper function to get bookings for a specific day and time slot
  const getBookingsForSlot = (day, timeSlot) => {
    return weeklyBookings.filter(booking => {
      const bookingDate = new Date(booking.bookingDateTime || booking.BookingDateTime);

      // Format booking time to HH:00 to match the hourly time slots
      const hours = bookingDate.getHours().toString().padStart(2, '0');
      const bookingTimeHour = `${hours}:00`;

      // Check if the booking is on the same day and falls within this time slot hour
      const isSameDay = bookingDate.toDateString() === day.toDateString();
      const isSameTimeSlot = bookingTimeHour === timeSlot;

      return isSameDay && isSameTimeSlot;
    });
  };

  // Helper function to check if a day is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if a specific time slot is available for a day
  const isTimeSlotAvailable = (day, timeSlot) => {
    const dayOfWeek = day.getDay();
    const dayTimeSlots = getTimeSlotsForDay(dayOfWeek);
    return dayTimeSlots.includes(timeSlot);
  };

  return (
    <div className="space-y-6">
      {/* Requested Bookings Section - Always at the top */}
      {requestedBookings.length > 0 && (
        <div className="bg-warning-bg dark:bg-yellow-900/20 rounded-lg shadow-soft-lift dark:shadow-none overflow-hidden transition-colors border-2 border-warning-border">
          <div className="p-6 border-b border-warning-border">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔔</span>
              <div>
                <h2 className="text-card-h2 text-charcoal-600 dark:text-white">
                  Pending Booking Requests
                </h2>
                <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
                  {requestedBookings.length} booking{requestedBookings.length !== 1 ? 's' : ''} awaiting your action
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {requestedBookings.map((booking) => {
                const { date, time } = formatDateTime(booking.bookingDateTime || booking.BookingDateTime);
                return (
                  <div
                    key={booking.id}
                    className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg p-4 border-2 border-warning-border hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Booking Info */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-label-small text-charcoal-400 dark:text-gray-400">Service</p>
                          <p className="text-body-regular text-charcoal-600 dark:text-white font-semibold">
                            {booking.serviceName}
                          </p>
                        </div>
                        <div>
                          <p className="text-label-small text-charcoal-400 dark:text-gray-400">Customer</p>
                          <p className="text-body-regular text-charcoal-600 dark:text-white font-semibold">
                            {booking.customerName}
                          </p>
                          <p className="text-label-small text-charcoal-400 dark:text-gray-400">
                            {booking.customerPhone}
                          </p>
                        </div>
                        <div>
                          <p className="text-label-small text-charcoal-400 dark:text-gray-400">Date & Time</p>
                          <p className="text-body-regular text-charcoal-600 dark:text-white font-semibold">
                            {date}
                          </p>
                          <p className="text-label-small text-charcoal-400 dark:text-gray-400">
                            {time}
                          </p>
                        </div>
                        <div>
                          <p className="text-label-small text-charcoal-400 dark:text-gray-400">Status</p>
                          <StatusChip variant={getStatusVariant(booking.status)}>
                            {booking.status}
                          </StatusChip>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {booking.status === 'Pending' && (
                          <>
                            <CRUDButton
                              variant="success"
                              onClick={() => {
                                if (confirm('Confirm this booking?')) {
                                  handleStatusChange(booking.id, 'Confirmed');
                                }
                              }}
                            >
                              Accept
                            </CRUDButton>
                            <CRUDButton
                              variant="error"
                              onClick={() => {
                                if (confirm('Reject this booking?')) {
                                  handleStatusChange(booking.id, 'Rejected');
                                }
                              }}
                            >
                              Reject
                            </CRUDButton>
                          </>
                        )}
                        {booking.status === 'PendingQuote' && (
                          <>
                            <CRUDButton
                              variant="success"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowQuoteModal(true);
                              }}
                            >
                              Send Quote
                            </CRUDButton>
                            <CRUDButton
                              variant="error"
                              onClick={() => {
                                if (confirm('Reject this booking?')) {
                                  handleStatusChange(booking.id, 'Rejected');
                                }
                              }}
                            >
                              Reject
                            </CRUDButton>
                          </>
                        )}
                        {booking.status === 'DepositPending' && (
                          <div className="text-warning-text text-label-medium px-4 py-2 bg-warning-bg rounded-lg border border-warning-border">
                            Awaiting Payment
                          </div>
                        )}
                        <CRUDButton
                          variant="secondary"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          View Details
                        </CRUDButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bookings Management Section - Combined Weekly Schedule and All Bookings */}
      <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none overflow-hidden transition-colors border border-transparent dark:border-charcoal-500">
        {/* Header with View Toggle and Filters */}
        <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h2 className="text-card-h2 text-charcoal-600 dark:text-white">
                {viewMode === 'upcoming' ? 'Weekly Schedule' : 'Service Bookings'}
              </h2>
              <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
                {viewMode === 'upcoming'
                  ? `${weeklyBookings.length} bookings this week`
                  : `${displayedBookings.length} bookings`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-cream-100 dark:bg-charcoal-600 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode('upcoming');
                    setFilterStatus('');
                  }}
                  className={`px-4 py-2 rounded-md text-label-medium font-medium transition-colors ${
                    viewMode === 'upcoming'
                      ? 'bg-grey-200 dark:bg-[#2A2A2A] text-sage-600 dark:text-sage-400 shadow-sm'
                      : 'text-charcoal-400 dark:text-gray-400 hover:text-charcoal-600 dark:hover:text-white'
                  }`}
                >
                  Weekly Schedule
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 rounded-md text-label-medium font-medium transition-colors ${
                    viewMode === 'all'
                      ? 'bg-grey-200 dark:bg-[#2A2A2A] text-sage-600 dark:text-sage-400 shadow-sm'
                      : 'text-charcoal-400 dark:text-gray-400 hover:text-charcoal-600 dark:hover:text-white'
                  }`}
                >
                  All Bookings
                </button>
              </div>

              {/* Status Filter */}
              {viewMode === 'all' && (
                <div className="flex items-center gap-2">
                  <label className="text-body-medium text-charcoal-600 dark:text-white">Filter:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-grey-stroke dark:border-charcoal-500 dark:bg-charcoal-600 rounded-lg px-4 py-2 text-body-regular text-charcoal-600 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="PendingQuote">Pending Quote</option>
                    <option value="DepositPending">Deposit Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Content Area */}
        {viewMode === 'upcoming' ? (
          // Weekly Calendar View
          <div className="p-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-grey-stroke dark:border-charcoal-500">
              <CRUDButton
                variant="secondary"
                onClick={handlePreviousWeek}
              >
                Previous Week
              </CRUDButton>

              <div className="flex items-center gap-3">
                <Calendar size={24} className="text-sage-600 dark:text-sage-400" weight="fill" />
                <div className="text-center">
                  <p className="text-body-regular font-medium text-charcoal-600 dark:text-white">
                    {weekRange}
                  </p>
                  <button
                    onClick={handleCurrentWeek}
                    className="text-label-medium text-sage-600 dark:text-sage-400 hover:underline mt-1"
                  >
                    Jump to Current Week
                  </button>
                </div>
              </div>

              <CRUDButton
                variant="secondary"
                onClick={handleNextWeek}
              >
                Next Week
              </CRUDButton>
            </div>

            {/* Calendar Grid */}
            {allTimeSlots.length > 0 ? (
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {weekDays.map((day, index) => (
                  <div
                    key={index}
                    className={`text-center p-3 rounded-t-lg ${
                      isToday(day)
                        ? 'bg-sage-100 dark:bg-sage-900/30'
                        : 'bg-cream-100 dark:bg-charcoal-600'
                    }`}
                  >
                    <p className={`text-label-medium font-semibold ${
                      isToday(day)
                        ? 'text-sage-600 dark:text-sage-400'
                        : 'text-charcoal-600 dark:text-gray-200'
                    }`}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={`text-body-regular ${
                      isToday(day)
                        ? 'text-sage-700 dark:text-sage-300'
                        : 'text-charcoal-400 dark:text-gray-400'
                    }`}>
                      {day.getDate()}
                    </p>
                  </div>
                ))}

                {/* Time Slots Grid */}
                {allTimeSlots.map((timeSlot, timeIndex) => (
                  weekDays.map((day, dayIndex) => {
                    const isAvailable = isTimeSlotAvailable(day, timeSlot);
                    const bookingsInSlot = getBookingsForSlot(day, timeSlot);
                    const hasBooking = bookingsInSlot.length > 0;

                    // Check if this day is in the past
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPastDay = day < today;

                    // Priority 1: Show bookings (green) regardless of past/future/availability
                    if (hasBooking) {
                      // Check if any booking in this slot is completed
                      const hasCompletedBooking = bookingsInSlot.some(b => b.status === 'Completed');

                      return (
                        <div
                          key={`${dayIndex}-${timeIndex}`}
                          className={`min-h-[80px] p-2 border rounded-lg transition-all ${
                            hasCompletedBooking
                              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
                              : 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
                          }`}
                        >
                          {/* Time Label - Only show on first column */}
                          {dayIndex === 0 && (
                            <p className={`text-label-small mb-1 font-semibold ${
                              hasCompletedBooking
                                ? 'text-blue-700 dark:text-blue-400'
                                : 'text-green-700 dark:text-green-400'
                            }`}>
                              {timeSlot}
                            </p>
                          )}

                          {/* Booking Cards */}
                          <div className="space-y-1">
                            {bookingsInSlot.map((booking) => {
                              const isCompleted = booking.status === 'Completed';
                              return (
                                <button
                                  key={booking.id}
                                  onClick={() => setSelectedBooking(booking)}
                                  className={`w-full text-left p-2 rounded-md shadow-md hover:shadow-lg transition-all cursor-pointer border-2 hover:scale-[1.02] ${
                                    isCompleted
                                      ? 'bg-white dark:bg-blue-800/40 border-blue-500 dark:border-blue-500'
                                      : 'bg-white dark:bg-green-800/40 border-green-500 dark:border-green-500'
                                  }`}
                                >
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="text-xs">👤</span>
                                    <p className={`text-label-small font-bold truncate ${
                                      isCompleted
                                        ? 'text-blue-800 dark:text-blue-100'
                                        : 'text-green-800 dark:text-green-100'
                                    }`}>
                                      {booking.customerName || 'N/A'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">🛠️</span>
                                    <p className={`text-label-small truncate ${
                                      isCompleted
                                        ? 'text-blue-700 dark:text-blue-200'
                                        : 'text-green-700 dark:text-green-200'
                                    }`}>
                                      {booking.serviceName}
                                    </p>
                                  </div>
                                  <div className="mt-1">
                                    <StatusChip variant={
                                      booking.status === 'Confirmed' ? 'success' :
                                      booking.status === 'InProgress' ? 'warning' :
                                      booking.status === 'Completed' ? 'info' : 'default'
                                    }>
                                      {booking.status}
                                    </StatusChip>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // Priority 2: For past days without bookings, show "Time Over"
                    if (isPastDay) {
                      return (
                        <div
                          key={`${dayIndex}-${timeIndex}`}
                          className="min-h-[80px] p-2 border rounded-lg bg-gray-50 dark:bg-charcoal-700/20 border-gray-200 dark:border-charcoal-600 opacity-60"
                        >
                          {/* Time Label - Only show on first column */}
                          {dayIndex === 0 && (
                            <p className="text-label-small text-charcoal-300 dark:text-gray-600 mb-1">
                              {timeSlot}
                            </p>
                          )}
                          <p className="text-label-small text-charcoal-300 dark:text-gray-600 text-center italic">
                            Time Over
                          </p>
                        </div>
                      );
                    }

                    // Priority 3: For current/future days without bookings - check availability
                    if (!isAvailable) {
                      return (
                        <div
                          key={`${dayIndex}-${timeIndex}`}
                          className="min-h-[80px] p-2 border rounded-lg bg-gray-100 dark:bg-charcoal-700/30 border-gray-200 dark:border-charcoal-600"
                        >
                          {/* Time Label - Only show on first column */}
                          {dayIndex === 0 && (
                            <p className="text-label-small text-charcoal-300 dark:text-gray-600 mb-1">
                              {timeSlot}
                            </p>
                          )}
                          <p className="text-label-small text-charcoal-300 dark:text-gray-600 text-center italic">
                            Unavailable
                          </p>
                        </div>
                      );
                    }

                    // Priority 4: Available slots (current/future days with availability and no booking)
                    return (
                      <div
                        key={`${dayIndex}-${timeIndex}`}
                        className={`min-h-[80px] p-2 border rounded-lg transition-all ${
                          isToday(day)
                            ? 'border-sage-300 dark:border-sage-700 bg-sage-50/50 dark:bg-sage-900/10'
                            : 'border-grey-stroke dark:border-charcoal-500 bg-grey-200 dark:bg-[#2A2A2A]'
                        }`}
                      >
                        {/* Time Label - Only show on first column */}
                        {dayIndex === 0 && (
                          <p className="text-label-small mb-1 text-charcoal-400 dark:text-gray-500">
                            {timeSlot}
                          </p>
                        )}

                        <p className="text-label-small text-charcoal-300 dark:text-gray-600 text-center">
                          Available
                        </p>
                      </div>
                    );
                  })
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-charcoal-300 dark:text-gray-600 mb-4" />
                <p className="text-body-regular text-charcoal-400 dark:text-gray-400 font-medium">
                  No working hours set
                </p>
                <p className="text-label-medium text-charcoal-300 dark:text-gray-500 mt-2">
                  Please configure your schedule in Schedule Management to see the calendar view
                </p>
              </div>
            )}
          </div>
        ) : (
          // All Bookings Table View
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-100 dark:bg-charcoal-500 border-b border-grey-stroke dark:border-charcoal-500">
                <tr>
                  <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Service</th>
                  <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Customer</th>
                  <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Phone</th>
                  <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Date & Time</th>
                  <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Address</th>
                  <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Pricing</th>
                  <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Status</th>
                  <th className="px-6 py-3 text-left text-light-h3 text-charcoal-600 dark:text-gray-200 font-light">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedBookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="text-6xl mb-4">📋</div>
                      <p className="text-body-regular text-charcoal-400 dark:text-gray-400 font-medium">
                        {filterStatus
                          ? `No ${filterStatus} bookings found`
                          : 'No bookings found'}
                      </p>
                      <p className="text-label-medium text-charcoal-300 dark:text-gray-500 mt-2">
                        {filterStatus
                          ? 'Try changing the filter'
                          : 'All your bookings will appear here'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedBookings.map((booking) => (
                    <tr key={booking.id} className="bg-grey-200 dark:bg-[#2A2A2A] border-b border-grey-stroke dark:border-charcoal-500 hover:bg-cream-50 dark:hover:bg-charcoal-500 transition-colors">
                      {/* Service Info */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-body-regular text-charcoal-600 dark:text-gray-200 font-medium">{booking.serviceName}</p>
                          <p className="text-label-medium text-charcoal-400 dark:text-gray-400">{booking.category}</p>
                          <p className="text-label-medium text-charcoal-400 dark:text-gray-400">{booking.serviceType}</p>
                        </div>
                      </td>

                      {/* Customer Name */}
                      <td className="px-6 py-4">
                        <p className="text-body-regular text-charcoal-600 dark:text-gray-200 font-medium">{booking.customerName}</p>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4">
                        <p className="text-body-regular text-charcoal-600 dark:text-gray-200">{booking.customerPhone}</p>
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-4">
                        <p className="text-body-regular text-charcoal-600 dark:text-gray-200">
                          {new Date(booking.bookingDateTime).toLocaleDateString()}
                        </p>
                        <p className="text-label-medium text-charcoal-400 dark:text-gray-400">
                          {new Date(booking.bookingDateTime).toLocaleTimeString()}
                        </p>
                      </td>

                      {/* Address */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-body-regular text-charcoal-600 dark:text-gray-200 line-clamp-2">
                            {booking.address.street}, {booking.address.city}
                          </p>
                          {booking.address.latitude && booking.address.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${booking.address.latitude},${booking.address.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-label-medium text-sage-600 hover:underline"
                            >
                              View Map
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="px-6 py-4">
                        {booking.quotedPrice ? (
                          <div>
                            <p className="text-body-regular text-charcoal-600 dark:text-gray-200 font-medium">
                              {booking.quotedPrice} BHD
                            </p>
                            <p className="text-label-medium text-charcoal-400 dark:text-gray-400">
                              Deposit: {booking.depositAmount} BHD
                            </p>
                            <p className="text-label-medium text-charcoal-400 dark:text-gray-400">
                              Final: {booking.finalAmount} BHD
                            </p>
                          </div>
                        ) : (
                          <span className="text-charcoal-400 dark:text-charcoal-300">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusChip variant={getStatusVariant(booking.status)}>
                          {booking.status}
                        </StatusChip>
                        {booking.notes && (
                          <p className="text-label-small text-warning-text mt-1" title={booking.notes}>
                            ⚠️ Has notes
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 min-w-[140px]">
                          {/* Pending Status */}
                          {booking.status === 'Pending' && (
                            <>
                              <CRUDButton
                                variant="success"
                                onClick={() => {
                                  if (confirm('Confirm this booking?')) {
                                    handleStatusChange(booking.id, 'Confirmed');
                                  }
                                }}
                                className="w-full text-center"
                              >
                                Confirm
                              </CRUDButton>
                              <CRUDButton
                                variant="error"
                                onClick={() => {
                                  if (confirm('Are you sure you want to reject this booking?')) {
                                    handleStatusChange(booking.id, 'Rejected');
                                  }
                                }}
                                className="w-full text-center"
                              >
                                Reject
                              </CRUDButton>
                            </>
                          )}

                          {/* PendingQuote Status */}
                          {booking.status === 'PendingQuote' && (
                            <>
                              <CRUDButton
                                variant="success"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowQuoteModal(true);
                                }}
                                className="w-full text-center"
                              >
                                Send Quote
                              </CRUDButton>
                              <CRUDButton
                                variant="error"
                                onClick={() => {
                                  if (confirm('Are you sure you want to reject this booking?')) {
                                    handleStatusChange(booking.id, 'Rejected');
                                  }
                                }}
                                className="w-full text-center"
                              >
                                Reject
                              </CRUDButton>
                            </>
                          )}

                          {/* DepositPending Status */}
                          {booking.status === 'DepositPending' && (
                            <span className="text-warning-text text-label-medium text-center">
                              Awaiting Payment
                            </span>
                          )}

                          {/* Confirmed Status */}
                          {booking.status === 'Confirmed' && (
                            <CRUDButton
                              variant="warning"
                              onClick={() => handleStatusChange(booking.id, 'InProgress')}
                              className="w-full text-center"
                            >
                              Start Service
                            </CRUDButton>
                          )}

                          {/* InProgress Status */}
                          {booking.status === 'InProgress' && (
                            <CRUDButton
                              variant="success"
                              onClick={() => handleStatusChange(booking.id, 'Completed')}
                              className="w-full text-center"
                            >
                              Complete
                            </CRUDButton>
                          )}

                          {/* Completed Status */}
                          {booking.status === 'Completed' && (
                            <span className="text-success-text text-label-medium text-center">
                              ✓ Completed
                            </span>
                          )}

                          {/* Rejected Status */}
                          {booking.status === 'Rejected' && (
                            <span className="text-error-text text-label-medium text-center">
                              ✗ Rejected
                            </span>
                          )}

                          {/* Canceled Status */}
                          {booking.status === 'Canceled' && (
                            <span className="text-charcoal-400 text-label-medium text-center">
                              Canceled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal - Shown when clicking booking in calendar */}
      {selectedBooking && !showQuoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-xl max-w-2xl w-full transition-colors max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-card-h2 text-charcoal-600 dark:text-white">Booking Details</h3>
                  <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
                    {selectedBooking.serviceName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-charcoal-400 hover:text-charcoal-600 dark:hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="text-label-medium text-charcoal-400 dark:text-gray-400">Status</label>
                <div className="mt-1">
                  <StatusChip variant={getStatusVariant(selectedBooking.status)}>
                    {selectedBooking.status}
                  </StatusChip>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-medium text-charcoal-400 dark:text-gray-400">Customer Name</label>
                  <p className="text-body-regular text-charcoal-600 dark:text-white font-medium mt-1">
                    {selectedBooking.customerName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-label-medium text-charcoal-400 dark:text-gray-400">Phone Number</label>
                  <p className="text-body-regular text-charcoal-600 dark:text-white font-medium mt-1">
                    {selectedBooking.customerPhone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <label className="text-label-medium text-charcoal-400 dark:text-gray-400">Service Details</label>
                <div className="mt-1 p-4 bg-cream-50 dark:bg-charcoal-600 rounded-lg">
                  <p className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                    {selectedBooking.serviceName}
                  </p>
                  {selectedBooking.category && (
                    <p className="text-label-medium text-charcoal-400 dark:text-gray-400 mt-1">
                      Category: {selectedBooking.category}
                    </p>
                  )}
                  {selectedBooking.serviceType && (
                    <p className="text-label-medium text-charcoal-400 dark:text-gray-400">
                      Type: {selectedBooking.serviceType}
                    </p>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <label className="text-label-medium text-charcoal-400 dark:text-gray-400">Date & Time</label>
                <p className="text-body-regular text-charcoal-600 dark:text-white font-medium mt-1">
                  {new Date(selectedBooking.bookingDateTime || selectedBooking.BookingDateTime).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Address */}
              {selectedBooking.address && (
                <div>
                  <label className="text-label-medium text-charcoal-400 dark:text-gray-400">Service Address</label>
                  <div className="mt-1 p-4 bg-cream-50 dark:bg-charcoal-600 rounded-lg">
                    <p className="text-body-regular text-charcoal-600 dark:text-white">
                      {selectedBooking.address.street}
                    </p>
                    <p className="text-body-regular text-charcoal-600 dark:text-white">
                      {selectedBooking.address.city}
                    </p>
                    {selectedBooking.address.latitude && selectedBooking.address.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedBooking.address.latitude},${selectedBooking.address.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-label-medium text-sage-600 dark:text-sage-400 hover:underline mt-2 inline-block"
                      >
                        View on Google Maps →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              {selectedBooking.quotedPrice && (
                <div>
                  <label className="text-label-medium text-charcoal-400 dark:text-gray-400">Pricing</label>
                  <div className="mt-1 p-4 bg-sage-50 dark:bg-sage-900/20 rounded-lg border border-sage-200 dark:border-sage-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-body-regular text-charcoal-600 dark:text-white">Quoted Price:</span>
                      <span className="text-body-regular text-charcoal-600 dark:text-white font-bold">
                        {selectedBooking.quotedPrice} BHD
                      </span>
                    </div>
                    {selectedBooking.depositAmount && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-label-medium text-charcoal-400 dark:text-gray-400">Deposit:</span>
                        <span className="text-label-medium text-charcoal-600 dark:text-white">
                          {selectedBooking.depositAmount} BHD
                        </span>
                      </div>
                    )}
                    {selectedBooking.finalAmount && (
                      <div className="flex justify-between items-center">
                        <span className="text-label-medium text-charcoal-400 dark:text-gray-400">Final Payment:</span>
                        <span className="text-label-medium text-charcoal-600 dark:text-white">
                          {selectedBooking.finalAmount} BHD
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <label className="text-label-medium text-charcoal-400 dark:text-gray-400">Notes</label>
                  <div className="mt-1 p-4 bg-warning-bg dark:bg-yellow-900/20 rounded-lg border border-warning-border">
                    <p className="text-body-regular text-charcoal-600 dark:text-white">
                      {selectedBooking.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-grey-stroke dark:border-charcoal-500">
                {selectedBooking.status === 'Pending' && (
                  <>
                    <CRUDButton
                      variant="success"
                      onClick={() => {
                        if (confirm('Confirm this booking?')) {
                          handleStatusChange(selectedBooking.id, 'Confirmed');
                          setSelectedBooking(null);
                        }
                      }}
                      className="flex-1"
                    >
                      Confirm Booking
                    </CRUDButton>
                    <CRUDButton
                      variant="error"
                      onClick={() => {
                        if (confirm('Are you sure you want to reject this booking?')) {
                          handleStatusChange(selectedBooking.id, 'Rejected');
                          setSelectedBooking(null);
                        }
                      }}
                      className="flex-1"
                    >
                      Reject
                    </CRUDButton>
                  </>
                )}

                {selectedBooking.status === 'PendingQuote' && (
                  <>
                    <CRUDButton
                      variant="success"
                      onClick={() => {
                        setShowQuoteModal(true);
                      }}
                      className="flex-1"
                    >
                      Send Quote
                    </CRUDButton>
                    <CRUDButton
                      variant="error"
                      onClick={() => {
                        if (confirm('Are you sure you want to reject this booking?')) {
                          handleStatusChange(selectedBooking.id, 'Rejected');
                          setSelectedBooking(null);
                        }
                      }}
                      className="flex-1"
                    >
                      Reject
                    </CRUDButton>
                  </>
                )}

                {selectedBooking.status === 'Confirmed' && (
                  <CRUDButton
                    variant="warning"
                    onClick={() => {
                      handleStatusChange(selectedBooking.id, 'InProgress');
                      setSelectedBooking(null);
                    }}
                    className="flex-1"
                  >
                    Start Service
                  </CRUDButton>
                )}

                {selectedBooking.status === 'InProgress' && (
                  <CRUDButton
                    variant="success"
                    onClick={() => {
                      handleStatusChange(selectedBooking.id, 'Completed');
                      setSelectedBooking(null);
                    }}
                    className="flex-1"
                  >
                    Complete Service
                  </CRUDButton>
                )}

                <CRUDButton
                  variant="secondary"
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1"
                >
                  Close
                </CRUDButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {showQuoteModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-xl max-w-md w-full transition-colors">
            <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
              <h3 className="text-card-h2 text-charcoal-600 dark:text-white">Send Quote</h3>
              <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
                for {selectedBooking.serviceName}
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-cream-50 rounded-lg">
                <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mb-2">
                  <span className="font-semibold text-charcoal-600 dark:text-white">Customer:</span> {selectedBooking.customerName}
                </p>
                <p className="text-body-regular text-charcoal-400 dark:text-gray-400">
                  <span className="font-semibold text-charcoal-600 dark:text-white">Service:</span> {selectedBooking.serviceName}
                </p>
                <p className="text-body-regular text-charcoal-400 dark:text-gray-400">
                  <span className="font-semibold text-charcoal-600 dark:text-white">Date:</span>{' '}
                  {new Date(selectedBooking.bookingDateTime).toLocaleString()}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">
                  Quote Price (BHD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  className="w-full border border-grey-stroke rounded-lg px-4 py-3 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                  placeholder="Enter price (e.g., 25.00)"
                  autoFocus
                />
                {quotePrice && parseFloat(quotePrice) > 0 && (
                  <div className="mt-3 p-4 bg-sage-100 rounded-lg border border-sage-300">
                    <p className="text-body-regular text-charcoal-600 dark:text-white mb-1">
                      <span className="font-semibold">Deposit (50%):</span>{' '}
                      <span className="text-sage-600 font-bold">
                        {(parseFloat(quotePrice) * 0.5).toFixed(2)} BHD
                      </span>
                    </p>
                    <p className="text-body-regular text-charcoal-600 dark:text-white">
                      <span className="font-semibold">Final Payment (50%):</span>{' '}
                      <span className="text-success-btn font-bold">
                        {(parseFloat(quotePrice) * 0.5).toFixed(2)} BHD
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <CRUDButton
                  variant="success"
                  onClick={handleSendQuote}
                  disabled={!quotePrice || parseFloat(quotePrice) <= 0}
                  className="flex-1"
                >
                  Send Quote
                </CRUDButton>
                <CRUDButton
                  variant="error"
                  onClick={() => {
                    setShowQuoteModal(false);
                    setSelectedBooking(null);
                    setQuotePrice('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </CRUDButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
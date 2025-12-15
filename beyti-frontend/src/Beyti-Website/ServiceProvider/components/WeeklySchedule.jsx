import { useEffect, useState } from 'react';
import { getProviderBookings } from '../../../services/api';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import StatusChip from '../../../components/StatusChip';
import CRUDButton from '../../../components/CRUDButton';
import { Calendar } from '@phosphor-icons/react';

export default function WeeklySchedule({ serviceProviderId, onNavigateToBookings }) {
  const [weeklyBookings, setWeeklyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));

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

  useEffect(() => {
    if (serviceProviderId) {
      fetchWeeklyBookings();
    }
  }, [serviceProviderId, currentWeekStart]);

  const fetchWeeklyBookings = async () => {
    try {
      setLoading(true);
      const allBookings = await getProviderBookings(serviceProviderId);

      const weekEnd = getWeekEnd(currentWeekStart);

      // Filter bookings for the current week, excluding Completed and Rejected
      const filteredBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.bookingDateTime || booking.BookingDateTime);
        const status = booking.status || booking.Status;

        // Exclude Completed and Rejected bookings
        if (status === 'Completed' || status === 'Rejected') {
          return false;
        }

        // Check if booking is within the current week
        return bookingDate >= currentWeekStart && bookingDate <= weekEnd;
      });

      // Sort by booking date/time
      const sortedBookings = filteredBookings.sort((a, b) => {
        const dateA = new Date(a.bookingDateTime || a.BookingDateTime);
        const dateB = new Date(b.bookingDateTime || b.BookingDateTime);
        return dateA - dateB;
      });

      setWeeklyBookings(sortedBookings);
    } catch (err) {
      console.error('Error fetching weekly bookings:', err);
    } finally {
      setLoading(false);
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const weekEnd = getWeekEnd(currentWeekStart);
  const weekRange = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-4 border border-transparent dark:border-charcoal-500 transition-colors">
        <CRUDButton
          variant="secondary"
          onClick={handlePreviousWeek}
        >
          Previous Week
        </CRUDButton>

        <div className="flex items-center gap-3">
          <Calendar size={24} className="text-sage-600 dark:text-sage-400" weight="fill" />
          <div className="text-center">
            <h2 className="text-card-h2 text-charcoal-600 dark:text-white">
              Week of {weekRange}
            </h2>
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

      {/* Weekly Schedule Table */}
      <Table
        title={`Weekly Schedule (${weeklyBookings.length} bookings)`}
        actionButton={
          <CRUDButton
            variant="success"
            onClick={() => onNavigateToBookings && onNavigateToBookings(null)}
          >
            View All Bookings
          </CRUDButton>
        }
      >
        <TableHeader
          columns={[
            'Day & Date',
            'Time',
            'Service',
            'Customer',
            'Status',
            'Price',
            'Action'
          ]}
        />
        <TableBody>
          {loading ? (
            <TableRow
              data={['Loading...', '', '', '', '', '', '']}
            />
          ) : weeklyBookings.length === 0 ? (
            <TableRow
              data={[
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-charcoal-300 dark:text-gray-600" />
                  <span>No bookings scheduled for this week</span>
                </div>,
                '', '', '', '', '', ''
              ]}
            />
          ) : (
            weeklyBookings.map((booking) => {
              const dateTime = formatDateTime(booking.bookingDateTime || booking.BookingDateTime);
              return (
                <TableRow
                  key={booking.id}
                  data={[
                    dateTime.date,
                    dateTime.time,
                    booking.serviceName || 'N/A',
                    booking.customerName || 'N/A',
                    <StatusChip variant={getStatusVariant(booking.status)}>
                      {booking.status}
                    </StatusChip>,
                    booking.quotedPrice ? `${booking.quotedPrice.toFixed(3)} BD` : 'Pending'
                  ]}
                  actions={
                    <>
                      <CRUDButton
                        variant="success"
                        onClick={() => onNavigateToBookings && onNavigateToBookings(null)}
                      >
                        View Details
                      </CRUDButton>
                    </>
                  }
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

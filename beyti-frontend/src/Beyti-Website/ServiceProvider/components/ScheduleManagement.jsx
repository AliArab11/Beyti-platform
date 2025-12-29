import { useEffect, useState } from 'react';
import { getProviderTimeSlots, addTimeSlot, toggleTimeSlot, deleteTimeSlot } from '../../../services/api';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import { logProviderActivity } from '../../../utils/providerActivityLogger';
import Snackbar from '../../../components/Snackbar';
import ConfirmModal from '../../../components/ConfirmModal';

export default function ScheduleManagement({ serviceProviderId }) {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: ''
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success'
  });

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'danger'
  });

  // Helper functions for snackbar
  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, open: false }));
    }, 3000);
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Helper functions for confirm modal
  const showConfirmModal = (title, message, onConfirm, variant = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      variant
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      variant: 'danger'
    });
  };

  const daysOfWeek = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
  ];

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const data = await getProviderTimeSlots(serviceProviderId);
      setTimeSlots(data);
    } catch (err) {
      console.error('Error fetching time slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, [serviceProviderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dayName = daysOfWeek.find(d => d.id === parseInt(formData.dayOfWeek))?.name || 'N/A';
      await addTimeSlot({
        serviceProviderId,
        dayOfWeek: parseInt(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime
      });

      // Log activity
      logProviderActivity(
        serviceProviderId,
        'schedule',
        'Added Availability',
        `${dayName}: ${formData.startTime} - ${formData.endTime}`
      );

      showSnackbar('Time slot added successfully!', 'success');
      setFormData({ dayOfWeek: '', startTime: '', endTime: '' });
      setShowForm(false);
      fetchTimeSlots();
    } catch (err) {
      console.error('Error adding time slot:', err);
      showSnackbar(err.message || 'Error adding time slot', 'error');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleToggle = (timeSlotId) => {
    const slot = timeSlots.find(s => s.id === timeSlotId);
    const dayName = daysOfWeek.find(d => d.id === slot?.dayOfWeek)?.name || 'N/A';
    const action = slot?.isActive ? 'deactivate' : 'activate';
    const actionTitle = slot?.isActive ? 'Deactivate Time Slot' : 'Activate Time Slot';

    showConfirmModal(
      actionTitle,
      `Are you sure you want to ${action} the time slot "${dayName}: ${slot?.startTime} - ${slot?.endTime}"?`,
      () => {
        closeConfirmModal();
        performToggle(timeSlotId, slot, dayName);
      },
      slot?.isActive ? 'warning' : 'success'
    );
  };

  const performToggle = async (timeSlotId, slot, dayName) => {
    try {
      await toggleTimeSlot(timeSlotId);

      // Log activity
      logProviderActivity(
        serviceProviderId,
        'schedule',
        slot?.isActive ? 'Deactivated Availability' : 'Activated Availability',
        `${dayName}: ${slot?.startTime || ''} - ${slot?.endTime || ''}`
      );

      fetchTimeSlots();

      // Show success message
      const successMessage = slot?.isActive
        ? `Time slot "${dayName}: ${slot?.startTime} - ${slot?.endTime}" has been deactivated successfully!`
        : `Time slot "${dayName}: ${slot?.startTime} - ${slot?.endTime}" has been activated successfully!`;
      showSnackbar(successMessage, 'success');
    } catch (err) {
      console.error('Error toggling time slot:', err);
      showSnackbar(err.message || 'Error toggling time slot', 'error');
    }
  };

  const handleDelete = (timeSlotId) => {
    const slot = timeSlots.find(s => s.id === timeSlotId);
    const dayName = daysOfWeek.find(d => d.id === slot?.dayOfWeek)?.name || 'N/A';

    showConfirmModal(
      'Delete Time Slot',
      `Are you sure you want to delete the time slot "${dayName}: ${slot?.startTime} - ${slot?.endTime}"? This action cannot be undone.`,
      () => {
        closeConfirmModal();
        performDelete(timeSlotId, slot, dayName);
      },
      'danger'
    );
  };

  const performDelete = async (timeSlotId, slot, dayName) => {
    try {
      await deleteTimeSlot(timeSlotId);

      // Log activity
      logProviderActivity(
        serviceProviderId,
        'schedule',
        'Removed Availability',
        `${dayName}: ${slot?.startTime || ''} - ${slot?.endTime || ''}`
      );

      fetchTimeSlots();

      // Show success message
      showSnackbar(`Time slot "${dayName}: ${slot?.startTime} - ${slot?.endTime}" has been deleted successfully!`, 'success');
    } catch (err) {
      console.error('Error deleting time slot:', err);
      showSnackbar(err.message || 'Error deleting time slot', 'error');
    }
  };

  // Group time slots by day
  const slotsByDay = daysOfWeek.map((day) => ({
    ...day,
    slots: timeSlots.filter((slot) => slot.dayOfWeek === day.id)
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-card-h2 text-charcoal-600 dark:text-white">Weekly Schedule</h2>
            <p className="text-body-regular text-charcoal-400 dark:text-gray-400 mt-1">
              Set your availability for customers to book appointments
            </p>
          </div>
          <CRUDButton
            variant={showForm ? 'error' : 'success'}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Close' : 'Add Time Slot'}
          </CRUDButton>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-cream-50 dark:bg-[#2A2A2A] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-grey-stroke">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-grey-stroke flex items-center justify-between">
              <h3 className="text-xl font-semibold text-charcoal-700 dark:text-white">
                Add Time Slot
              </h3>
              <button
                type="button"
                onClick={handleCloseForm}
                className="text-charcoal-400 hover:text-charcoal-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-4" id="timeslot-form">
            <div>
              <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Day of Week *</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white"
                required
              >
                <option value="">Select a day</option>
                {daysOfWeek.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Start Time *</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">End Time *</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500 bg-white dark:bg-[#1F1F1F] dark:text-white"
                  required
                />
              </div>
            </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-grey-stroke bg-grey-100 dark:bg-[#1F1F1F]">
              <div className="flex flex-col md:flex-row gap-3">
                <button
                  type="submit"
                  form="timeslot-form"
                  className="flex-1 bg-sage-500 hover:bg-sage-600 text-cream-50 py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Add Time Slot
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 dark:text-charcoal-600 py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Schedule Display */}
      {timeSlots.length === 0 ? (
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-12 text-center transition-colors">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-body-regular text-charcoal-400 dark:text-gray-400">No schedule set yet</p>
          <p className="text-label-medium text-charcoal-300 dark:text-gray-500 mt-2">Add time slots to let customers book appointments</p>
        </div>
      ) : (
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none overflow-hidden transition-colors">
          <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
            <h3 className="text-card-h2 text-charcoal-600 dark:text-white">Your Availability</h3>
          </div>

          <div className="divide-y divide-grey-stroke">
            {slotsByDay.map((day) => (
              <div key={day.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-card-h3 text-charcoal-600 dark:text-white mb-3">{day.name}</h4>

                    {day.slots.length === 0 ? (
                      <p className="text-body-regular text-charcoal-300 dark:text-gray-500 italic">No availability set</p>
                    ) : (
                      <div className="space-y-2">
                        {day.slots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between bg-cream-50 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-3">
                              <StatusChip variant={slot.isActive ? 'success' : 'error'}>
                                {slot.isActive ? 'Active' : 'Inactive'}
                              </StatusChip>
                              <span className="text-body-regular text-charcoal-600 dark:text-white font-medium">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CRUDButton
                                variant={slot.isActive ? 'warning' : 'success'}
                                onClick={() => handleToggle(slot.id)}
                              >
                                {slot.isActive ? 'Deactivate' : 'Activate'}
                              </CRUDButton>
                              <CRUDButton
                                variant="error"
                                onClick={() => handleDelete(slot.id)}
                              >
                                Delete
                              </CRUDButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={closeSnackbar}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
}

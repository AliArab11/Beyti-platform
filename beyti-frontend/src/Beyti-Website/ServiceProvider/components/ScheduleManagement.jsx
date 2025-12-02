import { useEffect, useState } from 'react';
import { getProviderTimeSlots, addTimeSlot, deleteTimeSlot } from '../../../services/api';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';

export default function ScheduleManagement({ serviceProviderId }) {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: ''
  });

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
      await addTimeSlot({
        serviceProviderId,
        dayOfWeek: parseInt(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      alert('Time slot added successfully!');
      setFormData({ dayOfWeek: '', startTime: '', endTime: '' });
      setShowForm(false);
      fetchTimeSlots();
    } catch (err) {
      console.error('Error adding time slot:', err);
      alert(err.message || 'Error adding time slot');
    }
  };

  const handleDelete = async (timeSlotId) => {
    if (confirm('Are you sure you want to delete this time slot?')) {
      try {
        await deleteTimeSlot(timeSlotId);
        fetchTimeSlots();
      } catch (err) {
        console.error('Error deleting time slot:', err);
        alert('Error deleting time slot');
      }
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

      {/* Form */}
      {showForm && (
        <div className="bg-grey-200 dark:bg-[#2A2A2A] rounded-lg shadow-soft-lift dark:shadow-none p-6 transition-colors">
          <h3 className="text-card-h2 text-charcoal-600 dark:text-white mb-6">Add Time Slot</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">Day of Week *</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
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
                  className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                  required
                />
              </div>

              <div>
                <label className="block text-body-medium text-charcoal-600 dark:text-white mb-2">End Time *</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full border border-grey-stroke rounded-lg px-4 py-2 text-body-regular focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <CRUDButton type="submit" variant="success">
                Add Time Slot
              </CRUDButton>
              <CRUDButton type="button" variant="error" onClick={() => setShowForm(false)}>
                Cancel
              </CRUDButton>
            </div>
          </form>
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
                            <CRUDButton
                              variant="error"
                              onClick={() => handleDelete(slot.id)}
                            >
                              Delete
                            </CRUDButton>
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
    </div>
  );
}

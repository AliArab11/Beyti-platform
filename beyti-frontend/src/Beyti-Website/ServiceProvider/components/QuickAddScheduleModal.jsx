import { useState } from 'react';
import { addTimeSlot } from '../../../services/api';
import { logProviderActivity } from '../../../utils/providerActivityLogger';

export default function QuickAddScheduleModal({ serviceProviderId, isOpen, onClose, onSuccess }) {
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

      logProviderActivity(
        serviceProviderId,
        'schedule',
        'Added Availability',
        `${dayName}: ${formData.startTime} - ${formData.endTime}`
      );

      alert('Time slot added successfully!');
      setFormData({ dayOfWeek: '', startTime: '', endTime: '' });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error adding time slot:', err);
      alert(err.message || 'Error adding time slot');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-cream-50 dark:bg-[#2A2A2A] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-grey-stroke">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-grey-stroke flex items-center justify-between">
          <h3 className="text-xl font-semibold text-charcoal-700 dark:text-white">
            Add Time Slot
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-charcoal-400 hover:text-charcoal-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4" id="quick-timeslot-form">
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
              form="quick-timeslot-form"
              className="flex-1 bg-sage-500 hover:bg-sage-600 text-cream-50 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Add Time Slot
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-grey-300 hover:bg-grey-400 text-charcoal-700 dark:text-charcoal-600 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

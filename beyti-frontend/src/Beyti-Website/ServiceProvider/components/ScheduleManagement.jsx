import { useEffect, useState } from 'react';
import { getProviderTimeSlots, addTimeSlot, deleteTimeSlot } from '../../../services/api';

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Weekly Schedule</h2>
            <p className="text-gray-600 text-sm mt-1">
              Set your availability for customers to book appointments
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            {showForm ? '✕ Close' : '+ Add Time Slot'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Add Time Slot</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week *</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Add Time Slot
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Weekly Schedule Display */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Your Availability</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {slotsByDay.map((day) => (
            <div key={day.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">{day.name}</h4>
                  
                  {day.slots.length === 0 ? (
                    <p className="text-gray-400 text-sm italic">No availability set</p>
                  ) : (
                    <div className="space-y-2">
                      {day.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              slot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {slot.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-gray-700 font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
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

      {timeSlots.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center mt-6">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-500 text-lg">No schedule set yet</p>
          <p className="text-gray-400 text-sm mt-2">Add time slots to let customers book appointments</p>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../../services/api';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form fields for Add
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Active");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDrivers();
      setDrivers(data);
    } catch (err) {
      setError(err.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      await createDriver({ FullName: fullName, Phone: phone, Status: status });
      await fetchDrivers();
      setFullName("");
      setPhone("");
      setStatus("Active");
    } catch (err) {
      setAddError(err.message || "Failed to add driver");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (driver) => {
    setEditingId(driver.id);
    setEditFullName(driver.fullName);
    setEditPhone(driver.phone);
    setEditStatus(driver.status);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFullName("");
    setEditPhone("");
    setEditStatus("");
    setEditError(null);
  };

  const handleEditDriver = async (e) => {
    e.preventDefault();
    try {
      await updateDriver(editingId, { FullName: editFullName, Phone: editPhone, Status: editStatus });
      await fetchDrivers();
      cancelEdit();
    } catch (err) {
      setEditError(err.message || "Failed to edit driver");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    try {
      await deleteDriver(id);
      setDrivers(drivers.filter(d => d.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete driver");
    }
  };

  const inputClasses = "w-full border-2 border-gray-400 rounded-lg p-2 text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  if (loading) return <p className="text-center mt-8 text-black">Loading drivers...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-4 text-black">Drivers</h1>

        {/* Add Driver Form */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Add Driver</h2>
          {addError && <p className="mb-2 text-red-600">{addError}</p>}
          <form onSubmit={handleAddDriver} className="space-y-4 sm:flex sm:gap-4 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className={inputClasses} placeholder="Full Name" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className={inputClasses} placeholder="Phone" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputClasses}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button type="submit" disabled={adding} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              {adding ? "Adding..." : "Add Driver"}
            </button>
          </form>
        </div>

        {/* Drivers Table */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map(driver => (
                <tr key={driver.id}>
                  {editingId === driver.id ? (
                    <>
                      <td className="px-6 py-3">
                        <input type="text" required value={editFullName} onChange={e => setEditFullName(e.target.value)} className={inputClasses} />
                      </td>
                      <td className="px-6 py-3">
                        <input type="text" required value={editPhone} onChange={e => setEditPhone(e.target.value)} className={inputClasses} />
                      </td>
                      <td className="px-6 py-3">
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className={inputClasses}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-right flex gap-2 justify-end">
                        <button onClick={handleEditDriver} className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Save</button>
                        <button onClick={cancelEdit} className="bg-gray-400 text-white px-3 py-1 rounded-lg hover:bg-gray-500">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-3 font-bold text-black">{driver.fullName}</td>
                      <td className="px-6 py-3 text-black">{driver.phone}</td>
                      <td className="px-6 py-3 text-black">{driver.status}</td>
                      <td className="px-6 py-3 text-right flex gap-2 justify-end">
                        <button onClick={() => startEdit(driver)} className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Edit</button>
                        <button onClick={() => handleDelete(driver.id)} className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700">Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Drivers;

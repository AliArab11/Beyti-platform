import { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../services/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      await createCustomer({ FullName: fullName, Phone: phone });
      await fetchCustomers();
      setFullName("");
      setPhone("");
    } catch (err) {
      setAddError(err.message || "Failed to add customer");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (customer) => {
    setEditingId(customer.id);
    setEditFullName(customer.fullName);
    setEditPhone(customer.phone || "");
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFullName("");
    setEditPhone("");
    setEditError(null);
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    try {
      await updateCustomer(editingId, { FullName: editFullName, Phone: editPhone });
      await fetchCustomers();
      cancelEdit();
    } catch (err) {
      setEditError(err.message || "Failed to edit customer");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await deleteCustomer(id);
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete customer");
    }
  };

  const inputClasses = "w-full border-2 border-gray-400 rounded-lg p-2 text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  if (loading) return <p className="text-center mt-8 text-black">Loading customers...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-4 text-black">Customers</h1>

        {/* Add Customer Form */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Add Customer</h2>
          {addError && <p className="mb-2 text-red-600">{addError}</p>}
          <form onSubmit={handleAddCustomer} className="space-y-4 sm:flex sm:gap-4 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className={inputClasses}
                placeholder="Full Name"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={inputClasses}
                placeholder="Phone"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {adding ? "Adding..." : "Add Customer"}
            </button>
          </form>
        </div>

        {/* Customers Table */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  {editingId === customer.id ? (
                    <>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          required
                          value={editFullName}
                          onChange={e => setEditFullName(e.target.value)}
                          className={inputClasses}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                          className={inputClasses}
                        />
                      </td>
                      <td className="px-6 py-3 text-right flex gap-2 justify-end">
                        <button
                          onClick={handleEditCustomer}
                          className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-400 text-white px-3 py-1 rounded-lg hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-3 font-bold text-black">{customer.fullName}</td>
                      <td className="px-6 py-3 text-black">{customer.phone || "N/A"}</td>
                      <td className="px-6 py-3 text-right flex gap-2 justify-end">
                        <button
                          onClick={() => startEdit(customer)}
                          className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
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

export default Customers;

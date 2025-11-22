import { useState, useEffect, Fragment } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createAddress,
  createCustomerAddress
} from "../../services/api";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toggle between adding customer or address
  const [addingMode, setAddingMode] = useState("customer"); // "customer" or "address"

  // Customer form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  // Address form fields
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [addressRegion, setAddressRegion] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addAddressError, setAddAddressError] = useState(null);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editError, setEditError] = useState(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

  // Expanded row state
  const [expandedRows, setExpandedRows] = useState(new Set());

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

  // --- Customer APIs ---
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

  // --- Address APIs ---
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddAddressError(null);

    try {
      if (!selectedCustomerId) throw new Error("Select a customer");

      // 1️⃣ Create the address with all fields
      const newAddress = await createAddress({
        Label: null,
        Street: addressStreet,
        City: addressCity,
        Region: addressRegion || null,
        PostalCode: addressPostalCode || null,
        Country: addressCountry,
        Latitude: null,
        Longitude: null,
        IsDefault: false
      });
      
      console.log("Address created:", newAddress);

      // 2️⃣ Link the address to the customer
      await createCustomerAddress({
        CustomerId: parseInt(selectedCustomerId),
        AddressId: newAddress.id
      });

      // Clear form
      setSelectedCustomerId("");
      setAddressStreet("");
      setAddressCity("");
      setAddressCountry("");
      setAddressRegion("");
      setAddressPostalCode("");
      
      await fetchCustomers();
      
      // Show success message
      setAddAddressError(null);
    } catch (err) {
      console.error("Full error:", err);
      setAddAddressError(err.message || "Failed to add address");
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

  const confirmDelete = (id, name) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, id: null, name: '' });
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer(deleteConfirm.id);
      setCustomers(customers.filter((c) => c.id !== deleteConfirm.id));
      cancelDelete();
    } catch (err) {
      alert(err.message || "Failed to delete customer");
    }
  };

  const toggleRow = (customerId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedRows(newExpanded);
  };

  const inputClasses = "w-full !border-2 !border-gray-400 rounded-lg p-3 !text-black !bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:!border-blue-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen !bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg !text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen !bg-gray-50">
        <div className="max-w-md w-full !bg-white shadow-lg rounded-lg p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-semibold !text-gray-800 mb-2">Error Loading Customers</h2>
          <p className="!text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCustomers}
            className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-2 px-4 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen !bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold !text-gray-900">Customer Management</h1>
          <p className="mt-2 text-lg !text-gray-600">Manage customers and their addresses</p>
        </div>

        {/* Toggle Button */}
        <div className="mb-6">
          <button
            onClick={() => setAddingMode(addingMode === "customer" ? "address" : "customer")}
            className="!bg-gradient-to-r !from-gray-600 !to-gray-700 hover:!from-gray-700 hover:!to-gray-800 !text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all"
          >
            {addingMode === "customer" ? "➕ Add Address Mode" : "👤 Add Customer Mode"}
          </button>
        </div>

        {/* Add Customer Form */}
        {addingMode === "customer" ? (
          <div className="!bg-white shadow-lg rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-semibold !text-gray-900 mb-4">Add Customer</h2>
            {addError && (
              <div className="mb-4 p-4 rounded-lg !bg-red-50 border-l-4 border-red-500">
                <p className="text-sm !text-red-700 font-medium">{addError}</p>
              </div>
            )}
            <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">
                  Full Name <span className="!text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClasses}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium !text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClasses}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50"
                >
                  {adding ? "Adding..." : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          // Add Address Form
          <div className="!bg-white shadow-lg rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-semibold !text-gray-900 mb-4">Add Address</h2>
            {addAddressError && (
              <div className="mb-4 p-4 rounded-lg !bg-red-50 border-l-4 border-red-500">
                <p className="text-sm !text-red-700 font-medium">{addAddressError}</p>
              </div>
            )}
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">
                    Customer <span className="!text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">
                    Street <span className="!text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    required
                    className={inputClasses}
                    placeholder="Enter street address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">
                    City <span className="!text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    required
                    className={inputClasses}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">
                    Country <span className="!text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressCountry}
                    onChange={(e) => setAddressCountry(e.target.value)}
                    required
                    className={inputClasses}
                    placeholder="Enter country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Region</label>
                  <input
                    type="text"
                    value={addressRegion}
                    onChange={(e) => setAddressRegion(e.target.value)}
                    className={inputClasses}
                    placeholder="Enter region (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium !text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={addressPostalCode}
                    onChange={(e) => setAddressPostalCode(e.target.value)}
                    className={inputClasses}
                    placeholder="Enter postal code (optional)"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50"
              >
                {adding ? "Adding Address..." : "Add Address"}
              </button>
            </form>
          </div>
        )}

        {/* Customers Table */}
        <div className="!bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 !bg-gradient-to-r !from-blue-50 !to-indigo-50">
            <h2 className="text-2xl font-semibold !text-gray-900">All Customers</h2>
            <p className="mt-1 text-sm !text-gray-600">Manage your customer database</p>
          </div>

          {customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="!bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider w-12">
                      
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold !text-gray-600 uppercase tracking-wider">
                      Addresses
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold !text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="!bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <Fragment key={customer.id}>
                      <tr className="hover:!bg-gray-50 transition-colors">
                        {editingId === customer.id ? (
                          <>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                required
                                value={editFullName}
                                onChange={(e) => setEditFullName(e.target.value)}
                                className={inputClasses}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className={inputClasses}
                              />
                            </td>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={handleEditCustomer}
                                  className="!bg-green-600 hover:!bg-green-700 !text-white px-4 py-2 rounded-lg font-semibold"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="!bg-gray-500 hover:!bg-gray-600 !text-white px-4 py-2 rounded-lg font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              {customer.customerAddresses && customer.customerAddresses.length > 0 && (
                                <button
                                  onClick={() => toggleRow(customer.id)}
                                  className="!text-gray-600 hover:!text-blue-600"
                                >
                                  <svg
                                    className={`w-5 h-5 transition-transform ${expandedRows.has(customer.id) ? 'rotate-90' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium !text-gray-900">{customer.fullName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm !text-gray-900">{customer.phone || "N/A"}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full !bg-blue-100 !text-blue-800">
                                {customer.customerAddresses?.length || 0} address{customer.customerAddresses?.length !== 1 ? 'es' : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => startEdit(customer)}
                                  className="!bg-yellow-500 hover:!bg-yellow-600 !text-white p-2 rounded-lg"
                                  title="Edit Customer"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => confirmDelete(customer.id, customer.fullName)}
                                  className="!bg-red-600 hover:!bg-red-700 !text-white p-2 rounded-lg"
                                  title="Delete Customer"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                      
                      {/* Expanded Address Details */}
                      {expandedRows.has(customer.id) && customer.customerAddresses && customer.customerAddresses.length > 0 && (
                        <tr className="!bg-gray-50">
                          <td colSpan="5" className="px-6 py-4">
                            <div className="ml-8 space-y-3">
                              <h4 className="font-semibold !text-gray-900 mb-3">Addresses:</h4>
                              {customer.customerAddresses.map((ca, idx) => (
                                <div key={idx} className="!bg-white p-4 rounded-lg border border-gray-200">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                      <span className="font-medium !text-gray-600">Street:</span>
                                      <p className="!text-gray-900">{ca.address?.street || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium !text-gray-600">City:</span>
                                      <p className="!text-gray-900">{ca.address?.city || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium !text-gray-600">Region:</span>
                                      <p className="!text-gray-900">{ca.address?.region || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium !text-gray-600">Country:</span>
                                      <p className="!text-gray-900">{ca.address?.country || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <svg className="mx-auto h-12 w-12 !text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium !text-gray-900">No customers yet</h3>
              <p className="mt-2 text-sm !text-gray-500">Get started by adding your first customer above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 !bg-black !bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="!bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="!bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 !text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="ml-3 text-xl font-bold !text-gray-900">Confirm Delete</h3>
            </div>
            <p className="!text-gray-600 mb-6">
              Are you sure you want to delete <strong className="!text-gray-900">"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 !bg-red-600 hover:!bg-red-700 !text-white py-3 px-4 rounded-lg font-semibold"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 !bg-gray-500 hover:!bg-gray-600 !text-white py-3 px-4 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
import { useEffect, useState } from "react";
import {
  getServiceProviders,
  createServiceProvider,
  updateServiceProvider
} from "../../services/api";

export default function ServiceProviderPage() {
  const [providers, setProviders] = useState([]);
  const [formData, setFormData] = useState({
    displayName: "",
    businessName: "",
    phone: "",
    minServicePrice: "",
    maxServicePrice: "",
    status: "Available",
  });
  const [editingId, setEditingId] = useState(null);

  const fetchProviders = async () => {
    try {
      const data = await getServiceProviders();
      setProviders(data);
    } catch (err) {
      console.error("Failed to fetch service providers:", err);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (editingId) {
      await updateServiceProvider(editingId, {
        businessName: formData.businessName,
        phone: formData.phone,
        minServicePrice: Number(formData.minServicePrice),
        maxServicePrice: Number(formData.maxServicePrice),
        status: formData.status,
      });
      setEditingId(null);
    } else {
      await createServiceProvider({
        displayName: formData.displayName,
        businessName: formData.businessName,
        phone: formData.phone,
        minServicePrice: Number(formData.minServicePrice),
        maxServicePrice: Number(formData.maxServicePrice),
        status: formData.status,
      });
    }

    setFormData({
      displayName: "",
      businessName: "",
      phone: "",
      minServicePrice: "",
      maxServicePrice: "",
      status: "Available",
    });

    fetchProviders();
  } catch (error) {
    console.error("Error submitting:", error);
    alert("Submission failed.");
  }
};

  const handleEdit = (provider) => {
    setEditingId(provider.id);
    setFormData({
      displayName: provider.displayName || "",
      businessName: provider.businessName || "",
      phone: provider.phone || "",
      minServicePrice: provider.minServicePrice || "",
      maxServicePrice: provider.maxServicePrice || "",
      status: provider.status || "Available",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      displayName: "",
      businessName: "",
      phone: "",
      minServicePrice: "",
      maxServicePrice: "",
      status: "Available",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Busy":
        return "bg-yellow-100 text-yellow-800";
      case "Unavailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Service Providers</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2 max-w-md">
        {!editingId && (
          <input
            type="text"
            placeholder="Display Name"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="border px-2 py-1 w-full rounded"
            required
          />
        )}

        <input
          type="text"
          placeholder="Business Name"
          value={formData.businessName}
          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          className="border px-2 py-1 w-full rounded"
          required
        />

        <input
          type="text"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="border px-2 py-1 w-full rounded"
          required
        />

        <div className="flex space-x-2">
          <input
            type="number"
            placeholder="Min Service Price"
            value={formData.minServicePrice}
            onChange={(e) => setFormData({ ...formData, minServicePrice: e.target.value })}
            className="border px-2 py-1 w-full rounded"
            required
          />
          <input
            type="number"
            placeholder="Max Service Price"
            value={formData.maxServicePrice}
            onChange={(e) => setFormData({ ...formData, maxServicePrice: e.target.value })}
            className="border px-2 py-1 w-full rounded"
            required
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="border px-2 py-1 w-full rounded"
          required
        >
          <option value="Available">Available</option>
          <option value="Busy">Busy</option>
          <option value="Unavailable">Unavailable</option>
        </select>

        <div className="flex space-x-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editingId ? "Update Provider" : "Add Provider"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Display Name</th>
            <th className="border px-2 py-1">Business Name</th>
            <th className="border px-2 py-1">Phone</th>
            <th className="border px-2 py-1">Price Range</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => (
            <tr key={p.id}>
              <td className="border px-2 py-1">{p.id}</td>
              <td className="border px-2 py-1">{p.displayName}</td>
              <td className="border px-2 py-1">{p.businessName}</td>
              <td className="border px-2 py-1">{p.phone}</td>
              <td className="border px-2 py-1">
                {p.minServicePrice} - {p.maxServicePrice}
              </td>
              <td className="border px-2 py-1">
                <span className={`px-2 py-1 rounded text-sm ${getStatusBadgeClass(p.status)}`}>
                  {p.status}
                </span>
              </td>
              <td className="border px-2 py-1">
                <button
                  onClick={() => handleEdit(p)}
                  className="bg-yellow-400 px-2 py-1 text-white rounded"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
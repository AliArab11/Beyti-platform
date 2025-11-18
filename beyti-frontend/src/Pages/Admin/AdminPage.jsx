import { useEffect, useState } from 'react';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../services/api';

export default function AdminPage() {
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    permissions: []
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch admins from API
  const fetchAdmins = async () => {
    const data = await getAdmins();
    setAdmins(data);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handle permission checkbox changes
  const handlePermissionChange = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
  title: formData.title,
  permissions: formData.permissions.join(','), // convert array to string
  userProfileId: 1
};


    if (editingId) {
      await updateAdmin(editingId, payload);
      setEditingId(null);
    } else {
      await createAdmin(payload);
    }

    setFormData({ title: '', permissions: [] });
    fetchAdmins();
  };

  // Edit admin
  const handleEdit = (admin) => {
    setEditingId(admin.id);
    setFormData({
      title: admin.title,
      permissions: admin.permissions || []
    });
  };

  // Delete admin
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this admin?')) {
      await deleteAdmin(id);
      fetchAdmins();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Management</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="border px-2 py-1 rounded w-full"
          required
        />

        {/* Permissions checkboxes */}
        <div className="flex gap-4">
          {['READ', 'WRITE', 'DELETE'].map((perm) => (
            <label key={perm} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={formData.permissions.includes(perm)}
                onChange={() => handlePermissionChange(perm)}
              />
              {perm}
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editingId ? 'Update Admin' : 'Add Admin'}
        </button>
      </form>

      {/* Admins Table */}
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">UserProfileId</th>
            <th className="border px-2 py-1">Title</th>
            <th className="border px-2 py-1">Permissions</th>
            <th className="border px-2 py-1">CreatedAt</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id}>
              <td className="border px-2 py-1">{admin.id}</td>
              <td className="border px-2 py-1">{admin.userProfileId}</td>
              <td className="border px-2 py-1">{admin.title}</td>
              <td className="border px-2 py-1">{admin.permissions?.join(', ')}</td>
              <td className="border px-2 py-1">{admin.createdAt}</td>
              <td className="border px-2 py-1 space-x-2">
                <button
                  onClick={() => handleEdit(admin)}
                  className="bg-yellow-400 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(admin.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

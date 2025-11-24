import { useEffect, useState } from 'react';
import { getAdmins, createAdmin, updateAdmin } from '../../services/api';

export default function AdminPage() {
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({ title: '', permissions: '' });
  const [editingId, setEditingId] = useState(null);

  // Fetch all admins
  const fetchAdmins = async () => {
    try {
      const data = await getAdmins();
      setAdmins(data);
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handle form submit (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAdmin(editingId, formData);
        setEditingId(null);
      } else {
        await createAdmin(formData);
      }
      setFormData({ title: '', permissions: '' });
      fetchAdmins();
    } catch (err) {
      console.error('Error saving admin:', err);
      alert('Error saving admin. Check console.');
    }
  };

  // In handleEdit, store the full admin
const handleEdit = (admin) => {
  setEditingId(admin.id);
  setFormData({
    id: admin.id,
    userProfileId: admin.userProfileId,
    title: admin.title,
    permissions: admin.permissions || '',
    createdAt: admin.createdAt
  });
};

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Management</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="border px-2 py-1 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder="Permissions (comma separated)"
          value={formData.permissions}
          onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
          className="border px-2 py-1 rounded w-full"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
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
            <th className="border px-2 py-1">Created At</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id}>
              <td className="border px-2 py-1">{admin.id}</td>
              <td className="border px-2 py-1">{admin.userProfileId}</td>
              <td className="border px-2 py-1">{admin.title}</td>
              <td className="border px-2 py-1">{admin.permissions}</td>
              <td className="border px-2 py-1">{new Date(admin.createdAt).toLocaleString()}</td>
              <td className="border px-2 py-1">
                <button
                  onClick={() => handleEdit(admin)}
                  className="bg-yellow-400 text-white px-2 py-1 rounded"
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

import { useEffect, useState } from 'react';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../services/api';

export default function AdminPage() {
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    permissions: ''
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch admins from API
  const fetchAdmins = async () => {
    try {
      const data = await getAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title: formData.title,
      permissions: formData.permissions, // send as string
      userProfileId: 2 // make sure this ID exists in your backend
    };

    console.log('Submitting payload:', payload);

    try {
      if (editingId) {
        await updateAdmin(editingId, payload);
        setEditingId(null);
      } else {
        await createAdmin(payload);
      }

      setFormData({ title: '', permissions: '' });
      fetchAdmins();
    } catch (error) {
      console.error('Failed to submit admin:', error);
      alert('Failed to submit admin. Check console for details.');
    }
  };

  // Edit admin
  const handleEdit = (admin) => {
    setEditingId(admin.id);
    setFormData({
      title: admin.title,
      permissions: admin.permissions || ''
    });
  };

  // Delete admin
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this admin?')) {
      try {
        await deleteAdmin(id);
        fetchAdmins();
      } catch (error) {
        console.error('Failed to delete admin:', error);
        alert('Failed to delete admin. Check console for details.');
      }
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

        <input
          type="text"
          name="permissions"
          placeholder="Permissions (comma separated)"
          value={formData.permissions}
          onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
          className="border px-2 py-1 rounded w-full"
          required
        />

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
              <td className="border px-2 py-1">{admin.permissions}</td>
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

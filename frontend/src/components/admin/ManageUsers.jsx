import { useState, useEffect } from 'react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'requester',
    city: '',
    password: '',
  });

  useEffect(() => {
    loadUsers();
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/users?role=requester');
      const data = await response.json();
      setUsers(data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (editingUser) {
      try {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          city: formData.city,
        };

        if (formData.password) {
          payload.password = formData.password;
        }

        const response = await fetch(`http://localhost:3000/admin/users/${editingUser._id || editingUser.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update user');
        }

        setEditingUser(null);
        await loadUsers();
      } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user. Please try again.');
        return;
      }
    } else {
      // Add new user
      const newUser = {
        ...formData,
        id: Date.now(),
      };
      const updatedUsers = [...users, newUser];
      localStorage.setItem('service_app_users', JSON.stringify(updatedUsers));
    }
    setFormData({ name: '', email: '', phone: '', role: 'requester', city: '', password: '' });
    setShowForm(false);
    if (!editingUser) {
      loadUsers();
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData(user);
    setShowForm(true);
  };

  const handleDelete = (email) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(u => u.email !== email);
      localStorage.setItem('service_app_users', JSON.stringify(updatedUsers));
      loadUsers();
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      requester: 'bg-blue-100 text-blue-800',
      volunteer: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const requesterUsers = users.filter(
    (u) => (u.role || '').toLowerCase() === 'requester'
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Last updated: {lastRefresh.toLocaleTimeString()}</span>
          <button
            onClick={loadUsers}
            className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition text-xs font-medium"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', email: '', phone: '', role: 'requester', city: '', password: '' });
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? '✕ Cancel' : '+ Add User'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!editingUser}
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="requester">Requester</option>
              <option value="volunteer">Volunteer</option>
              <option value="admin">Admin</option>
            </select>
            <input
              type="text"
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={!editingUser}
            />
            <button
              type="submit"
              className="col-span-1 md:col-span-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              {editingUser ? 'Update User' : 'Add User'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">City</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requesterUsers.map((user) => (
                <tr key={user._id || user.id || user.email} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-3 text-sm text-gray-900">{user.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{user.phone || '-'}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{user.city || '-'}</td>
                  <td className="px-6 py-3 text-sm space-x-2 flex">
                    <button
                      onClick={() => handleEdit(user)}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition font-medium"
                    >
                      Edit
                    </button>
                    {/* <button
                      onClick={() => handleDelete(user.email)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition font-medium"
                    >
                      Delete
                    </button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {requesterUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No users found</div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;

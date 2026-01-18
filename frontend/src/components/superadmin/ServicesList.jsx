import { useState, useEffect } from 'react';
import axios from 'axios';

const ServicesList = () => {
  const [admins, setAdmins] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const adminsResponse = await axios.get('http://localhost:3000/superadmin/admins');
      setAdmins(adminsResponse.data);
      const complaintsResponse = await axios.get('http://localhost:3000/superadmin/complaints/all');
      setComplaints(complaintsResponse.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
      console.error('Error loading data:', err);
    }
  };

  const filteredComplaints =
    selectedAdmin === 'all'
      ? complaints.filter(c => c.assignedTo && c.assignedTo.adminEmail)
      : complaints.filter((c) => c.assignedTo && c.assignedTo.adminEmail === selectedAdmin);

  const getServiceStats = (adminEmail) => {
    const adminComplaints = complaints.filter((c) => c.assignedTo && c.assignedTo.adminEmail === adminEmail);
    return {
      total: adminComplaints.length,
      open: adminComplaints.filter((c) => c.status === 'open' || c.status === 'taken').length,
      inProgress: adminComplaints.filter((c) => c.status === 'assigned' || c.status === 'in-progress').length,
      resolved: adminComplaints.filter((c) => c.status === 'resolved').length,
      closed: adminComplaints.filter((c) => c.status === 'closed').length,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Services by Admin</h2>
        <p className="text-sm text-gray-600 mt-1">View complaints handled by each admin</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Admin
        </label>
        <select
          value={selectedAdmin}
          onChange={(e) => setSelectedAdmin(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Admins</option>
          {admins.map((admin) => (
            <option key={admin._id} value={admin.email}>
              {admin.name} ({admin.city || 'N/A'})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {admins.map((admin) => {
          const stats = getServiceStats(admin.email);
          return (
            <div key={admin._id} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500 rounded-full">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{admin.name}</h3>
                  <p className="text-sm text-gray-600">{admin.city || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="font-bold text-lg text-blue-600">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">Open:</span>
                  <span className="font-semibold text-yellow-600">{stats.open}</span>
                </div>
                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">In Progress:</span>
                  <span className="font-semibold text-indigo-600">{stats.inProgress}</span>
                </div>
                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">Resolved:</span>
                  <span className="font-semibold text-green-600">{stats.resolved}</span>
                </div>
                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">Closed:</span>
                  <span className="font-semibold text-gray-600">{stats.closed}</span>
                </div>
              </div>
            </div>
          );
        })}
        {admins.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No admins found</h3>
          </div>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Complaint Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComplaints.map((complaint) => (
                <tr key={complaint._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {complaint.assignedTo?.adminName || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {complaint.assignedTo?.adminEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{complaint.customerName}</div>
                    <div className="text-xs text-gray-500">{complaint.customerCity}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {complaint.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {complaint.technicianAssigned?.technicianName || (
                      <span className="text-gray-400 italic">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        complaint.status === 'closed'
                          ? 'bg-gray-100 text-gray-800'
                          : complaint.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : complaint.status === 'in-progress'
                          ? 'bg-indigo-100 text-indigo-800'
                          : complaint.status === 'assigned'
                          ? 'bg-purple-100 text-purple-800'
                          : complaint.status === 'taken'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No complaints found for selected admin</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ServicesList;

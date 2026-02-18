import { useState, useEffect } from 'react';

const MonitoringDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadData = () => {
    (async () => {
      try {
        const res = await fetch('http://localhost:3000/admin/help-requests/all');
        const data = await res.json();

        const normalized = (data || []).map(r => {
          const rawStatus = (r.status || '').toLowerCase();
          let normStatus = rawStatus;
          if (rawStatus === 'open') normStatus = 'pending';
          if (rawStatus === 'accepted' || rawStatus === 'in-progress') normStatus = 'active';
          if (rawStatus === 'assigned') normStatus = 'assigned';
          if (rawStatus === 'completed') normStatus = 'completed';

          const assigned = r.assignedVolunteer || r.assignedTo || r.assigned || null;
          const assignedName = assigned?.volunteerName || assigned?.volunteerName || assigned?.volunteer?.name || assigned?.volunteerName || assigned?.volunteerName || (assigned && assigned.volunteerName) || (assigned && assigned.volunteerName) || (assigned && assigned.volunteerEmail) || null;

          return {
            ...r,
            id: (r._id && (r._id.$oid || r._id)) || r.id || (r._id && r._id.toString && r._id.toString()),
            normStatus,
            assignedName
          };
        });

        const usersRes = await fetch('http://localhost:3000/admin/users');
        const users = await usersRes.json();

        setRequests(normalized);
        setVolunteers((users || []).filter(u => u.role === 'volunteer'));
        setLastRefresh(new Date());
      } catch (err) {
        console.error('Error loading monitoring data, falling back to localStorage:', err);
        const helpRequests = JSON.parse(localStorage.getItem('service_app_help_requests') || '[]');
        const users = JSON.parse(localStorage.getItem('service_app_users') || '[]');
        setRequests(helpRequests);
        setVolunteers(users.filter(u => u.role === 'volunteer'));
        setLastRefresh(new Date());
      }
    })();
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      active: '🔄',
      assigned: '👤',
      completed: '✅',
      cancelled: '❌',
    };
    return icons[status] || '•';
  };

  const filteredRequests = (() => {
    if (filter === 'all') return requests;
    if (filter === 'date') {
      if (!dateFrom && !dateTo) return requests;
      const from = dateFrom ? new Date(dateFrom) : new Date('1970-01-01');
      const to = dateTo ? new Date(dateTo) : new Date();
      // include end date full day
      to.setHours(23, 59, 59, 999);
      return requests.filter(r => {
        const created = r.createdAt ? new Date(r.createdAt) : null;
        if (!created) return false;
        return created >= from && created <= to;
      });
    }
    return requests.filter(r => r.normStatus === filter);
  })();

  const stats = {
    pending: requests.filter(r => r.normStatus === 'pending').length,
    active: requests.filter(r => r.normStatus === 'active').length,
    assigned: requests.filter(r => r.normStatus === 'assigned').length,
    completed: requests.filter(r => r.normStatus === 'completed').length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
        <div className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
          <button
            onClick={loadData}
            className="ml-4 px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition text-xs font-medium"
          >
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm font-medium">Pending Requests</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Active Requests</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Assigned</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.assigned}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Completed</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'active', 'assigned', 'completed', 'date'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          {filter === 'date' && (
            <div className="ml-4 flex items-center gap-2">
              <label className="text-sm text-gray-600">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1 border rounded text-sm" />
              <label className="text-sm text-gray-600">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1 border rounded text-sm" />
              <button onClick={() => setLastRefresh(new Date())} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Apply</button>
            </div>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Request</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Requester</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Assigned To</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id || (req._id && (req._id.$oid || req._id))} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {req.title || req.category || 'Untitled'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {req.requesterName || 'Unknown'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      📍 {typeof req.location === 'string' ? req.location : (req.location?.address || (req.location?.latitude ? `${req.location.latitude.toFixed(6)}, ${req.location.longitude.toFixed(6)}` : 'N/A'))}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getStatusColor(req.normStatus)}`}>
                        <span>{getStatusIcon(req.normStatus)}</span>
                        {req.normStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {req.assignedName || req.assignedVolunteer?.name || req.assignedVolunteer?.volunteerName || req.assignedTo?.volunteerName || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volunteer Activity removed */}
    </div>
  );
};

export default MonitoringDashboard;

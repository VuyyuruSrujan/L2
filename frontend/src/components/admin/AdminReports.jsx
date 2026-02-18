import { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminReports = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reqRes, usersRes] = await Promise.all([
        fetch('http://localhost:3000/admin/help-requests/all'),
        fetch('http://localhost:3000/admin/users'),
      ]);
      const reqData = await reqRes.json();
      const userData = await usersRes.json();
      setRequests(reqData || []);
      setUsers(userData || []);
    } catch (err) {
      console.error('Error loading analytics data, falling back to localStorage:', err);
      setRequests(JSON.parse(localStorage.getItem('service_app_help_requests') || '[]'));
      setUsers(JSON.parse(localStorage.getItem('service_app_users') || '[]'));
    }
    setLastRefresh(new Date());
  };

  // Derived metrics
  const statusCounts = useMemo(() => {
    const counts = {};
    requests.forEach(r => {
      const s = (r.status || 'open').toLowerCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [requests]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    requests.forEach(r => {
      const c = (r.category || 'other').toLowerCase();
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [requests]);

  const requestsOverTime = useMemo(() => {
    // Group by day (last 30 days)
    const map = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }
    requests.forEach(r => {
      const created = r.createdAt ? new Date(r.createdAt) : null;
      if (!created) return;
      const key = created.toISOString().slice(0, 10);
      if (key in map) map[key] += 1;
    });
    return map;
  }, [requests]);

  const topVolunteers = useMemo(() => {
    const counts = {};
    requests.forEach(r => {
      const a = r.assignedVolunteer || r.assignedTo || r.assigned || null;
      const name = a?.volunteerName || a?.volunteerName || a?.volunteerEmail || a?.volunteer?.name || null;
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [requests]);

  // Chart data
  const statusPieData = useMemo(() => ({
    labels: Object.keys(statusCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: ['#fbbf24', '#60a5fa', '#c084fc', '#34d399', '#f87171'],
    }]
  }), [statusCounts]);

  const categoryBarData = useMemo(() => ({
    labels: Object.keys(categoryCounts).map(c => c.charAt(0).toUpperCase() + c.slice(1)),
    datasets: [{
      label: 'Requests by Category',
      data: Object.values(categoryCounts),
      backgroundColor: '#60a5fa',
    }]
  }), [categoryCounts]);

  const lineData = useMemo(() => ({
    labels: Object.keys(requestsOverTime),
    datasets: [{
      label: 'Requests (last 30 days)',
      data: Object.values(requestsOverTime),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      tension: 0.2,
      fill: true,
    }]
  }), [requestsOverTime]);

  const topVolData = useMemo(() => ({
    labels: topVolunteers.map(v => v[0]),
    datasets: [{
      label: 'Assigned Requests',
      data: topVolunteers.map(v => v[1]),
      backgroundColor: '#34d399'
    }]
  }), [topVolunteers]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <div className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
          <button onClick={loadData} className="ml-4 px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition text-xs font-medium">🔄 Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-semibold mb-3">Status Distribution</h4>
          <Pie data={statusPieData} />
        </div>
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
          <h4 className="font-semibold mb-3">Requests Over Time (30 days)</h4>
          <Line data={lineData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-semibold mb-3">Requests by Category</h4>
          <Bar data={categoryBarData} />
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-semibold mb-3">Top Volunteers</h4>
          <Bar data={topVolData} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="font-semibold mb-3">Raw Data Preview</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Request</th>
                <th className="px-4 py-2 text-left">Requester</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Assigned To</th>
                <th className="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan="6" className="p-6 text-center text-gray-500">No requests available</td></tr>
              ) : (
                requests.map(r => (
                  <tr key={r._id || r.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{r.title || r.category}</td>
                    <td className="px-4 py-2">{r.requesterName || r.requesterEmail}</td>
                    <td className="px-4 py-2">{typeof r.location === 'string' ? r.location : (r.location?.address || (r.location?.latitude ? `${r.location.latitude.toFixed(4)}, ${r.location.longitude.toFixed(4)}` : 'N/A'))}</td>
                    <td className="px-4 py-2">{r.status}</td>
                    <td className="px-4 py-2">{(r.assignedVolunteer && (r.assignedVolunteer.volunteerName || r.assignedVolunteer.volunteerEmail)) || (r.assignedTo && r.assignedTo.volunteerName) || '—'}</td>
                    <td className="px-4 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;

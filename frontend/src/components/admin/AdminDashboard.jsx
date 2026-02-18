import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ManageUsers from './ManageUsers';
import ManageVolunteers from './ManageVolunteers';
import MonitoringDashboard from './MonitoringDashboard';
import AdminReports from './AdminReports';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Manage Users', icon: '👥' },
    { id: 'volunteers', label: 'Manage Volunteers', icon: '🤝' },
    { id: 'monitoring', label: 'Monitoring', icon: '📡' },
    { id: 'reports', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔐</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">System Administration Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{currentUser?.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-all flex items-center gap-2`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardOverview />}
        {activeTab === 'users' && <ManageUsers />}
        {activeTab === 'volunteers' && <ManageVolunteers />}
        {activeTab === 'monitoring' && <MonitoringDashboard />}
        {activeTab === 'reports' && <AdminReports />}
      </div>
    </div>
  );
};

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVolunteers: 0,
    activeRequests: 0,
    completedRequests: 0,
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [activeRequests, setActiveRequests] = useState([]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/admin/dashboard/metrics');
      const data = await response.json();
      
      setStats({
        totalUsers: data.users?.total || 0,
        totalVolunteers: data.users?.volunteers || 0,
        activeRequests: data.requests?.ongoing || 0,
        completedRequests: data.requests?.completed || 0,
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveRequests = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/help-requests/all');
      const data = await response.json();
      setActiveRequests(data || []);
    } catch (error) {
      console.error('Error loading active requests:', error);
    }
  };

  useEffect(() => {
    loadStats();
    loadActiveRequests();
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadStats();
      loadActiveRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusProgress = (status) => {
    const statusMap = {
      'open': 0,
      'accepted': 33,
      'in-progress': 66,
      'completed': 100,
      'cancelled': 0
    };
    return statusMap[status] || 0;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'open': 'bg-gray-500',
      'accepted': 'bg-yellow-500',
      'in-progress': 'bg-blue-500',
      'completed': 'bg-green-500',
      'cancelled': 'bg-red-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  const statusSteps = ['open', 'accepted', 'in-progress', 'completed'];

  const StatCard = ({ icon, title, value, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
        <div className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
          <button
            onClick={() => {
              loadStats();
              loadActiveRequests();
            }}
            className="ml-4 px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition text-xs font-medium"
          >
            🔄 Refresh Now
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon="👥"
          title="Total Users"
          value={stats.totalUsers}
          color="border-blue-500"
        />
        <StatCard
          icon="🤝"
          title="Active Volunteers"
          value={stats.totalVolunteers}
          color="border-green-500"
        />
        <StatCard
          icon="⏳"
          title="Active Requests"
          value={stats.activeRequests}
          color="border-yellow-500"
        />
        <StatCard
          icon="✅"
          title="Completed"
          value={stats.completedRequests}
          color="border-purple-500"
        />
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity Tracking</h3>
        {activeRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active requests at the moment</p>
        ) : (
          <div className="space-y-6">
            {activeRequests.map((request, index) => {
              const progress = getStatusProgress(request.status);
              const statusColor = getStatusColor(request.status);
              const currentIndex = statusSteps.indexOf(request.status);
              const isCancelled = request.status === 'cancelled';
              return (
                <div key={request._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{request.title}</p>
                      <p className="text-sm text-gray-600">Request ID: {request._id?.toString().substring(0, 8)}...</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${statusColor} self-start`}>
                      {request.status?.replace('-', ' ')?.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Open'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                      <p className="font-medium text-gray-900">Description</p>
                      <p className="text-gray-600">{request.description}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Category / Urgency</p>
                      <p className="text-gray-600 capitalize">
                        {request.category} • {request.urgency}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Requester</p>
                      <p className="text-gray-600">{request.requesterName} ({request.requesterEmail})</p>
                      <p className="text-gray-600">{request.requesterPhone} • {request.requesterCity}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Location</p>
                      <p className="text-gray-600">{request.location?.address || 'Address not provided'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Assigned Volunteer/Technician</p>
                      <p className="text-gray-600">
                        {request.assignedVolunteer?.volunteerName
                          ? `${request.assignedVolunteer.volunteerName} (${request.assignedVolunteer.volunteerEmail || 'Email not available'})`
                          : 'Not assigned yet'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Created At</p>
                      <p className="text-gray-600">{request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      {statusSteps.map((step, stepIndex) => {
                        const isCompleted = currentIndex >= 0 && stepIndex <= currentIndex && !isCancelled;
                        return (
                          <div key={step} className="flex-1 flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                              {isCompleted ? '✓' : stepIndex + 1}
                            </div>
                            <span className="mt-2 text-xs text-gray-600 capitalize">{step.replace('-', ' ')}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="relative mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-2 ${statusColor} transition-all duration-300`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    {isCancelled && (
                      <p className="mt-3 text-sm text-red-600">Request was cancelled.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

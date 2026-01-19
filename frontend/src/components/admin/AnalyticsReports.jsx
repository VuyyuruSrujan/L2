import { useState, useEffect } from 'react';
import axios from 'axios';

const AnalyticsReports = () => {
  const [analytics, setAnalytics] = useState({
    totalRequests: 0,
    completedRequests: 0,
    activeRequests: 0,
    totalVolunteers: 0,
    activeVolunteers: 0,
    totalRequesters: 0,
    averageCompletionTime: 0,
    categoryBreakdown: [],
    urgencyBreakdown: [],
    statusBreakdown: [],
    cityBreakdown: [],
    recentActivity: [],
    topVolunteers: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/analytics/reports?range=${dateRange}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      alert('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color = 'blue', icon }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600 mt-2`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-4xl opacity-20">{icon}</div>}
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, total, color = 'blue' }) => {
    const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-gray-600">{value} ({percentage}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`bg-${color}-500 h-3 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-700">Time Period:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Requests"
          value={analytics.totalRequests}
          color="blue"
          icon="📋"
        />
        <StatCard 
          title="Completed"
          value={analytics.completedRequests}
          subtitle={`${analytics.totalRequests > 0 ? ((analytics.completedRequests / analytics.totalRequests) * 100).toFixed(1) : 0}% completion rate`}
          color="green"
          icon="✓"
        />
        <StatCard 
          title="Active Requests"
          value={analytics.activeRequests}
          subtitle="In-progress + Accepted"
          color="yellow"
          icon="⏳"
        />
        <StatCard 
          title="Active Volunteers"
          value={`${analytics.activeVolunteers}/${analytics.totalVolunteers}`}
          subtitle="Available volunteers"
          color="purple"
          icon="👥"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Status Distribution</h3>
          {analytics.statusBreakdown.map((item, index) => (
            <ProgressBar 
              key={index}
              label={item.status.toUpperCase()}
              value={item.count}
              total={analytics.totalRequests}
              color={
                item.status === 'completed' ? 'green' :
                item.status === 'in-progress' ? 'blue' :
                item.status === 'accepted' ? 'purple' :
                item.status === 'open' ? 'yellow' : 'gray'
              }
            />
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Request Categories</h3>
          {analytics.categoryBreakdown.map((item, index) => (
            <ProgressBar 
              key={index}
              label={item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              value={item.count}
              total={analytics.totalRequests}
              color="indigo"
            />
          ))}
        </div>
      </div>

      {/* Urgency and Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgency Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Urgency Levels</h3>
          {analytics.urgencyBreakdown.map((item, index) => (
            <ProgressBar 
              key={index}
              label={item.urgency.toUpperCase()}
              value={item.count}
              total={analytics.totalRequests}
              color={
                item.urgency === 'urgent' ? 'red' :
                item.urgency === 'high' ? 'orange' :
                item.urgency === 'medium' ? 'yellow' : 'green'
              }
            />
          ))}
        </div>

        {/* City Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Cities</h3>
          {analytics.cityBreakdown.slice(0, 5).map((item, index) => (
            <ProgressBar 
              key={index}
              label={item.city}
              value={item.count}
              total={analytics.totalRequests}
              color="teal"
            />
          ))}
        </div>
      </div>

      {/* Top Volunteers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">⭐ Top Volunteers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.topVolunteers.map((volunteer, index) => (
                <tr key={volunteer._id} className={index < 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{volunteer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{volunteer.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{volunteer.completedCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ⭐ {volunteer.rating?.average?.toFixed(1) || 'N/A'} ({volunteer.rating?.count || 0})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {analytics.topVolunteers.length === 0 && (
            <p className="text-center text-gray-500 py-4">No volunteer data available</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Recent Activity</h3>
        <div className="space-y-3">
          {analytics.recentActivity.map((activity, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded">
              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
              <p className="text-xs text-gray-600">{activity.requesterName} • {activity.city}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(activity.createdAt).toLocaleString()} • Status: <span className="font-medium">{activity.status}</span>
              </p>
            </div>
          ))}
          {analytics.recentActivity.length === 0 && (
            <p className="text-center text-gray-500 py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
        <h3 className="text-xl font-bold mb-4">📈 System Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm opacity-90">Total Users</p>
            <p className="text-3xl font-bold">{analytics.totalRequesters + analytics.totalVolunteers}</p>
            <p className="text-xs opacity-75">
              {analytics.totalRequesters} requesters, {analytics.totalVolunteers} volunteers
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">Success Rate</p>
            <p className="text-3xl font-bold">
              {analytics.totalRequests > 0 ? ((analytics.completedRequests / analytics.totalRequests) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs opacity-75">Requests completed successfully</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Avg. Response Time</p>
            <p className="text-3xl font-bold">{analytics.averageResponseTime || 'N/A'}</p>
            <p className="text-xs opacity-75">From request to acceptance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReports;

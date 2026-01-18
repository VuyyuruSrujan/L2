import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  STORAGE_KEYS,
  getFromStorage,
} from '../../utils/localStorage';

const ReportView = () => {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allComplaints = getFromStorage(STORAGE_KEYS.COMPLAINTS) || [];
    const cityComplaints = allComplaints.filter(
      (c) => c.adminId === currentUser.id
    );
    setComplaints(cityComplaints);

    const allPayments = getFromStorage(STORAGE_KEYS.PAYMENTS) || [];
    const adminPayments = allPayments.filter(
      (p) => p.adminId === currentUser.id
    );
    setPayments(adminPayments);

    const allUsers = getFromStorage(STORAGE_KEYS.USERS) || [];
    setUsers(allUsers);
  };

  const filterByDate = (items) => {
    if (dateRange === 'all') return items;

    const now = new Date();
    const filtered = items.filter((item) => {
      const itemDate = new Date(item.createdAt);
      const diffDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));

      if (dateRange === 'week') return diffDays <= 7;
      if (dateRange === 'month') return diffDays <= 30;
      if (dateRange === 'year') return diffDays <= 365;
      return true;
    });

    return filtered;
  };

  const filteredComplaints = filterByDate(complaints);
  const filteredPayments = filterByDate(payments);

  const totalRevenue = filteredPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  const getTechnicianName = (techId) => {
    const tech = users.find((u) => u.id === techId && u.role === 'technician');
    return tech ? tech.name : 'N/A';
  };

  const technicianPerformance = () => {
    const techStats = {};

    filteredComplaints.forEach((complaint) => {
      if (complaint.technicianId) {
        if (!techStats[complaint.technicianId]) {
          techStats[complaint.technicianId] = {
            name: getTechnicianName(complaint.technicianId),
            total: 0,
            closed: 0,
          };
        }
        techStats[complaint.technicianId].total++;
        if (complaint.status === 'closed') {
          techStats[complaint.technicianId].closed++;
        }
      }
    });

    return Object.values(techStats);
  };

  const techPerformance = technicianPerformance();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Complaints</h3>
          <p className="text-3xl font-bold text-gray-900">{filteredComplaints.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Resolved</h3>
          <p className="text-3xl font-bold text-green-600">
            {filteredComplaints.filter((c) => c.status === 'closed').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {
              filteredComplaints.filter(
                (c) => c.status === 'open' || c.status === 'assigned'
              ).length
            }
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-blue-600">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Performance</h3>
        {techPerformance.length > 0 ? (
          <div className="space-y-4">
            {techPerformance.map((tech, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{tech.name}</span>
                  <span className="text-sm text-gray-600">
                    {tech.closed} / {tech.total} closed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${tech.total > 0 ? (tech.closed / tech.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Completion Rate:{' '}
                  {tech.total > 0
                    ? ((tech.closed / tech.total) * 100).toFixed(1)
                    : 0}
                  %
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No technician data available</p>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
        {filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    From
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.slice(0, 10).map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {payment.fromRole === 'customer' ? 'Customer' : 'Admin'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center">No payments found</p>
        )}
      </div>
    </div>
  );
};

export default ReportView;

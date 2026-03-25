import { useState, useEffect } from 'react';

const ManageVolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [expandedRequestId, setExpandedRequestId] = useState(null);

  const formatSkills = (skills = []) => {
    if (!Array.isArray(skills) || skills.length === 0) return 'Not provided';
    return skills.map(skill => skill.charAt(0).toUpperCase() + skill.slice(1)).join(', ');
  };

  const formatJoinedDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString();
  };

  const isSkillMatch = (volunteer, request) => {
    if (!request?.category || !Array.isArray(volunteer?.skills)) return false;
    return volunteer.skills.map(skill => skill.toLowerCase()).includes(request.category.toLowerCase());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/users/role/volunteer');
      const data = await response.json();
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error loading volunteers:', error);
      setVolunteers([]);
    }

    try {
      const reqRes = await fetch('http://localhost:3000/admin/help-requests/all');
      const reqData = await reqRes.json();
      // Normalize IDs and keep requests that are open / have no assigned volunteer
      const normalized = (reqData || []).map(r => ({
        ...r,
        id: (r._id && (r._id.$oid || r._id)) || r.id || (r._id && r._id.toString && r._id.toString())
      }));

      const pending = normalized.filter(r => {
        const status = (r.status || '').toLowerCase();
        const hasAssigned = r.assignedVolunteer || r.assignedTo || r.assigned;
        return (!hasAssigned && (status === 'open' || status === 'pending')) || status === 'open';
      });

      setRequests(pending);
    } catch (err) {
      console.error('Error loading help requests from server, falling back to localStorage:', err);
      const helpRequests = JSON.parse(localStorage.getItem('service_app_help_requests') || '[]');
      setRequests(helpRequests.filter(r => r.status === 'pending' || r.status === 'active'));
    }
    setLastRefresh(new Date());
  };

  const handleAssignVolunteer = () => {
    if (!selectedRequest || !selectedVolunteer) {
      alert('Please select both a request and a volunteer');
      return;
    }

    // Call admin API to assign volunteer
    (async () => {
      try {
        const body = {
          requestId: selectedRequest.id || selectedRequest._id || selectedRequest._id?.$oid,
          volunteerId: selectedVolunteer._id || selectedVolunteer.id,
          adminEmail: 'admin@example.com',
          adminName: 'Admin'
        };

        const res = await fetch('http://localhost:3000/admin/assign-volunteer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to assign volunteer');
        }

        alert('Volunteer assigned successfully!');
        setSelectedRequest(null);
        setSelectedVolunteer(null);
        loadData();
      } catch (err) {
        console.error('Error assigning volunteer:', err);
        alert('Error assigning volunteer: ' + (err.message || 'unknown'));
      }
    })();
  };

  const getDistanceText = (vol, req) => {
    if (!vol.location || !req.location) return 'N/A';
    // Simple distance placeholder - in real app would use geolocation
    return `${Math.random() * 10 + 1}km`;
  };

  const formatLocation = (loc) => {
    if (!loc) return 'N/A';
    if (typeof loc === 'string') return loc || 'N/A';
    if (loc.address) return loc.address || (loc.latitude && loc.longitude ? `${loc.latitude}, ${loc.longitude}` : 'N/A');
    if (loc.latitude !== undefined && loc.longitude !== undefined) return `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`;
    return 'N/A';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Volunteers</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Last updated: {lastRefresh.toLocaleTimeString()}</span>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition text-xs font-medium"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Requests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Pending Requests</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {(() => {
              const pendingRequests = requests.filter(r => ['pending', 'open'].includes((r.status || '').toLowerCase()));
              if (pendingRequests.length === 0) {
                return <p className="text-gray-500 text-sm">No pending requests</p>;
              }

              return pendingRequests.map((req, idx) => (
                <div
                  key={req.id || (req._id && (req._id.$oid || req._id)) || idx}
                  className={`p-4 border rounded-lg transition ${
                    selectedRequest?.id === req.id ? 'bg-blue-50 border-blue-500' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div onClick={() => setSelectedRequest(req)} className="flex-1 cursor-pointer">
                      <p className="font-semibold text-gray-900">{req.title || req.category}</p>
                      <p className="text-sm text-gray-600 mt-1">{req.description ? `${req.description.slice(0, 120)}${req.description.length > 120 ? '...' : ''}` : ''}</p>
                      <p className="text-sm text-gray-600 mt-2">📍 {formatLocation(req.location)}</p>
                      <p className="text-sm text-gray-600">👤 {req.requesterName || req.requesterEmail || 'Unknown'}</p>
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (req.urgency || '').toLowerCase() === 'urgent' ? 'bg-red-600 text-white' :
                        (req.urgency || '').toLowerCase() === 'high' ? 'bg-red-400 text-white' :
                        (req.urgency || '').toLowerCase() === 'medium' ? 'bg-yellow-300 text-gray-800' : 'bg-green-200 text-gray-800'
                      }`}>
                        {req.urgency ? req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1) : 'Unknown'}
                      </span>
                      <p className="text-xs text-gray-500 mt-2">{req.createdAt ? new Date(req.createdAt).toLocaleString() : ''}</p>
                      <button
                        onClick={() => setExpandedRequestId(expandedRequestId === req.id ? null : req.id)}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        {expandedRequestId === req.id ? 'Hide details' : 'View details'}
                      </button>
                    </div>
                  </div>

                  {expandedRequestId === req.id && (
                    <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <p className="mb-2"><strong>Description:</strong> {req.description || '—'}</p>
                      <p className="mb-1"><strong>Requester:</strong> {req.requesterName || '—'}</p>
                      {req.requesterPhone && <p className="mb-1"><strong>Phone:</strong> {req.requesterPhone}</p>}
                      {req.requesterEmail && <p className="mb-1"><strong>Email:</strong> {req.requesterEmail}</p>}
                      {req.meetLink && <p className="mb-1"><strong>Meet:</strong> <a className="text-blue-600 hover:underline" href={req.meetLink}>{req.meetLink}</a></p>}
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Available Volunteers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Available Volunteers</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {volunteers.filter(vol => vol.isAvailable !== false).length === 0 ? (
              <p className="text-gray-500 text-sm">No volunteers available</p>
            ) : (
              volunteers
                .filter(vol => vol.isAvailable !== false)
                .map(vol => (
                <div
                  key={vol._id || vol.id || vol.email}
                  onClick={() => setSelectedVolunteer(vol)}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedVolunteer?.email === vol.email
                      ? 'bg-green-50 border-green-500'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{vol.name}</p>
                      <p className="text-sm text-gray-600 mt-1">📧 {vol.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${vol.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {vol.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                    <p className="text-sm text-gray-600">📞 {vol.phone || 'N/A'}</p>
                    <p className="text-sm text-gray-600">📍 {vol.city || 'N/A'}</p>
                    <p className="text-sm text-gray-600 md:col-span-2">🏠 {vol.address || 'N/A'}</p>
                    <p className="text-sm text-gray-600 md:col-span-2">🛠 Skills: {formatSkills(vol.skills)}</p>
                    <p className="text-sm text-gray-600">
                      ⭐ Rating: {vol.rating?.average ? `${Number(vol.rating.average).toFixed(1)}/5` : 'N/A'}
                      {typeof vol.rating?.count === 'number' ? ` (${vol.rating.count} reviews)` : ''}
                    </p>
                    <p className="text-sm text-gray-600">✅ Completed: {vol.completedRequests || 0}</p>
                    <p className="text-sm text-gray-600">🗓 Joined: {formatJoinedDate(vol.createdAt)}</p>
                    <p className="text-sm text-gray-600">🟢 Status: {vol.isAvailable === false ? 'Unavailable' : 'Available'}</p>
                  </div>

                  {selectedRequest && (
                    <p className={`text-xs mt-2 font-medium ${isSkillMatch(vol, selectedRequest) ? 'text-green-700' : 'text-amber-700'}`}>
                      {isSkillMatch(vol, selectedRequest)
                        ? `Skill match: Yes (${selectedRequest.category})`
                        : `Skill match: Not matched to ${selectedRequest.category || 'request category'}`}
                    </p>
                  )}

                  {selectedRequest && (
                    <p className="text-xs text-green-600 mt-2">
                      Distance: {getDistanceText(vol, selectedRequest)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assignment Details */}
      {selectedRequest && selectedVolunteer && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Assignment Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Request:</p>
              <p className="text-lg font-semibold text-gray-900">{selectedRequest.title || selectedRequest.category}</p>
              <p className="text-sm text-gray-600 mt-2">Requester: {selectedRequest.requesterName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Volunteer:</p>
              <p className="text-lg font-semibold text-gray-900">{selectedVolunteer.name}</p>
              <p className="text-sm text-gray-600 mt-2">Email: {selectedVolunteer.email}</p>
            </div>
          </div>
          <button
            onClick={handleAssignVolunteer}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition"
          >
            ✓ Confirm Assignment
          </button>
        </div>
      )}

      {/* Recently Assigned section removed per request */}
    </div>
  );
};

export default ManageVolunteers;

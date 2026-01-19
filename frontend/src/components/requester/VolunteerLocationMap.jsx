import { useState, useEffect } from 'react';
import axios from 'axios';

const VolunteerLocationMap = ({ requestId, volunteerInfo }) => {
  const [volunteerLocation, setVolunteerLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchVolunteerLocation();
    
    // Poll for location updates every 10 seconds
    const intervalId = setInterval(fetchVolunteerLocation, 10000);
    
    return () => clearInterval(intervalId);
  }, [requestId]);

  const fetchVolunteerLocation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/help-requests/${requestId}`);
      
      if (response.data.assignedVolunteer?.currentLocation) {
        setVolunteerLocation(response.data.assignedVolunteer.currentLocation);
        setLastUpdate(new Date(response.data.assignedVolunteer.currentLocation.lastUpdated));
      }
    } catch (error) {
      console.error('Error fetching volunteer location:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  const openInGoogleMaps = () => {
    if (volunteerLocation) {
      const url = `https://www.google.com/maps?q=${volunteerLocation.latitude},${volunteerLocation.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (!volunteerInfo) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">No volunteer assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-lg">
          🧭 Volunteer Location
        </h3>
        {loading && (
          <span className="text-sm text-blue-600">Updating...</span>
        )}
      </div>

      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Volunteer Details</p>
          <p className="text-gray-900">{volunteerInfo.volunteerName}</p>
          <p className="text-sm text-gray-600">{volunteerInfo.volunteerPhone}</p>
        </div>

        {volunteerLocation ? (
          <>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-gray-700">Live Location</p>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Lat: {volunteerLocation.latitude.toFixed(6)}, 
                Lng: {volunteerLocation.longitude.toFixed(6)}
              </p>
              {lastUpdate && (
                <p className="text-xs text-gray-500">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>

            <button
              onClick={openInGoogleMaps}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
            >
              <span>📍</span>
              <span>View on Google Maps</span>
            </button>

            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              ℹ️ Location updates automatically every 10 seconds
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              Volunteer hasn't started sharing location yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerLocationMap;

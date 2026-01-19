import { useState, useEffect } from 'react';
import axios from 'axios';

const NearbyVolunteers = ({ requestLocation, category, city }) => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (requestLocation?.latitude && requestLocation?.longitude) {
      fetchNearbyVolunteers();
    }
  }, [requestLocation]);

  const fetchNearbyVolunteers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        latitude: requestLocation.latitude,
        longitude: requestLocation.longitude,
        maxDistance: 50 // 50 km radius
      });
      
      if (category) params.append('category', category);
      if (city) params.append('city', city);

      const response = await axios.get(`http://localhost:3000/volunteers/best-match?${params}`);
      setVolunteers(response.data);
    } catch (error) {
      console.error('Error fetching nearby volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600">Finding nearby volunteers...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-900 mb-3">
        📍 Nearby Volunteers ({volunteers.length})
      </h3>
      
      {volunteers.length === 0 ? (
        <p className="text-gray-500 text-sm">No volunteers found in your area</p>
      ) : (
        <div className="space-y-2">
          {volunteers.slice(0, 5).map((volunteer) => (
            <div key={volunteer._id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{volunteer.name}</p>
                  <p className="text-xs text-gray-600">{volunteer.city}</p>
                  {volunteer.rating && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⭐ {volunteer.rating.average?.toFixed(1) || 'N/A'} ({volunteer.rating.count || 0} reviews)
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {volunteer.distance !== null && (
                    <span className="text-sm font-semibold text-blue-600">
                      {volunteer.distance} km
                    </span>
                  )}
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      volunteer.isAvailable 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {volunteer.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>
              {volunteer.skills && volunteer.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {volunteer.skills.map((skill, idx) => (
                    <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyVolunteers;

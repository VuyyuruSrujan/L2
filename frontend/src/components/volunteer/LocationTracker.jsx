import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const LocationTracker = ({ requestId, isTracking, onStop }) => {
  const [locationStatus, setLocationStatus] = useState('inactive');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState('');
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (isTracking) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isTracking]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('tracking');
    setError('');

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setError('Unable to get your location: ' + err.message);
        setLocationStatus('error');
      }
    );

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setError('Location tracking error: ' + err.message);
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setLocationStatus('inactive');
    }
  };

  const updateLocation = async (latitude, longitude) => {
    try {
      await axios.post(`http://localhost:3000/help-requests/${requestId}/update-location`, {
        latitude,
        longitude
      });
      setLastUpdate(new Date());
      setLocationStatus('active');
    } catch (err) {
      console.error('Error updating location:', err);
      setError('Failed to update location on server');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            locationStatus === 'active' ? 'bg-green-500 animate-pulse' :
            locationStatus === 'tracking' ? 'bg-yellow-500 animate-pulse' :
            locationStatus === 'error' ? 'bg-red-500' :
            'bg-gray-400'
          }`} />
          <div>
            <h3 className="font-semibold text-gray-900">Location Tracking</h3>
            <p className="text-sm text-gray-600">
              {locationStatus === 'active' && 'Sharing your location with requester'}
              {locationStatus === 'tracking' && 'Acquiring location...'}
              {locationStatus === 'error' && 'Tracking error'}
              {locationStatus === 'inactive' && 'Not tracking'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onStop}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
        >
          Stop Tracking
        </button>
      </div>
      
      {lastUpdate && (
        <div className="mt-3 text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
      
      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
        ℹ️ Your location is updated automatically every few seconds while tracking is active.
      </div>
    </div>
  );
};

export default LocationTracker;

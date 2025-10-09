import React, { useState, useEffect } from 'react';
import GoogleMap from './GoogleMap';
import CoordinateDisplay from './CoordinateDisplay';

const TrackingMap = ({ 
  deliveryAgentLocation, 
  deliveryAddress, 
  orderNumber,
  isTracking = false,
  onLocationUpdate,
  apiKey 
}) => {
  const [mapCenter, setMapCenter] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [route, setRoute] = useState(null);

  useEffect(() => {
    // Set initial map center - prioritize showing both locations
    if (deliveryAgentLocation && deliveryAgentLocation.latitude && deliveryAgentLocation.longitude &&
        deliveryAddress && deliveryAddress.latitude && deliveryAddress.longitude) {
      // If both locations exist, center between them
      const centerLat = (deliveryAgentLocation.latitude + deliveryAddress.latitude) / 2;
      const centerLng = (deliveryAgentLocation.longitude + deliveryAddress.longitude) / 2;
      setMapCenter({
        lat: centerLat,
        lng: centerLng
      });
    } else if (deliveryAgentLocation && deliveryAgentLocation.latitude && deliveryAgentLocation.longitude) {
      setMapCenter({
        lat: deliveryAgentLocation.latitude,
        lng: deliveryAgentLocation.longitude
      });
    } else if (deliveryAddress && deliveryAddress.latitude && deliveryAddress.longitude) {
      setMapCenter({
        lat: deliveryAddress.latitude,
        lng: deliveryAddress.longitude
      });
    }
  }, [deliveryAgentLocation, deliveryAddress]);

  useEffect(() => {
    const newMarkers = [];

    console.log('TrackingMap - deliveryAgentLocation:', deliveryAgentLocation);
    console.log('TrackingMap - deliveryAddress:', deliveryAddress);

    // Add delivery agent marker
    if (deliveryAgentLocation && deliveryAgentLocation.latitude && deliveryAgentLocation.longitude) {
      console.log('Adding delivery agent marker at:', deliveryAgentLocation.latitude, deliveryAgentLocation.longitude);
      newMarkers.push({
        position: {
          lat: deliveryAgentLocation.latitude,
          lng: deliveryAgentLocation.longitude
        },
        title: 'Delivery Agent',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="#1E40AF" stroke-width="2"/>
              <path d="M16 8l-4 8h8l-4-8z" fill="white"/>
            </svg>
          `),
          scaledSize: { width: 32, height: 32 },
          anchor: { x: 16, y: 16 }
        },
        label: {
          text: 'DA',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });
    } else {
      console.log('Delivery agent location missing or invalid:', deliveryAgentLocation);
    }

    // Add delivery address marker
    if (deliveryAddress && deliveryAddress.latitude && deliveryAddress.longitude) {
      console.log('Adding delivery address marker at:', deliveryAddress.latitude, deliveryAddress.longitude);
      newMarkers.push({
        position: {
          lat: deliveryAddress.latitude,
          lng: deliveryAddress.longitude
        },
        title: `Delivery Address: ${deliveryAddress.address || 'Unknown Address'}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="16" fill="#EF4444" stroke="#DC2626" stroke-width="3"/>
              <path d="M20 8l-3 6h6l-3-6z" fill="white"/>
              <circle cx="20" cy="20" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: { width: 40, height: 40 },
          anchor: { x: 20, y: 20 }
        },
        label: {
          text: '📍',
          fontSize: '18px',
          color: 'white'
        },
        animation: null
      });
    } else {
      console.log('Delivery address missing or invalid:', deliveryAddress);
    }

    console.log('Total markers to add:', newMarkers.length);
    setMarkers(newMarkers);
  }, [deliveryAgentLocation, deliveryAddress]);

  const handleMapClick = (latLng) => {
    if (onLocationUpdate) {
      onLocationUpdate({
        latitude: latLng.lat(),
        longitude: latLng.lng()
      });
    }
  };

  const handleMarkerClick = (markerData) => {
    console.log('Marker clicked:', markerData);
  };

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <h4 className="text-lg font-medium text-gray-800 mb-2">
          Live Tracking Map - Order #{orderNumber}
        </h4>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Delivery Agent</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Delivery Address</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span>{isTracking ? 'Tracking Active' : 'Click "Start Tracking" to begin'}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Check if API key is properly configured */}
        {(!apiKey || apiKey === 'your_google_maps_api_key_here') ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-4">
            <div className="text-center">
              <div className="text-yellow-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Google Maps API Key Required
              </h3>
              <p className="text-sm text-yellow-700 mb-4">
                To display the interactive map, please configure your Google Maps API key in the environment variables.
              </p>
              <div className="bg-white rounded-lg p-4 text-left">
                <h4 className="font-medium text-gray-800 mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                  <li>Enable Maps JavaScript API and Geocoding API</li>
                  <li>Create an API key</li>
                  <li>Add <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key</code> to your <code className="bg-gray-100 px-1 rounded">frontend/.env</code> file</li>
                  <li>Restart your development server</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <GoogleMap
            center={mapCenter}
            zoom={15}
            markers={markers}
            onMapClick={handleMapClick}
            onMarkerClick={handleMarkerClick}
            height="400px"
            width="100%"
            className="rounded-lg border border-gray-300"
            apiKey={apiKey}
          />
        )}
        
        {/* Always show coordinate display as fallback */}
        <div className="mt-4">
          <CoordinateDisplay
            deliveryAgentLocation={deliveryAgentLocation}
            deliveryAddress={deliveryAddress}
            orderNumber={orderNumber}
          />
        </div>
        
        {/* Map overlay with location info */}
        {deliveryAgentLocation && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
            <h5 className="font-medium text-sm text-gray-800 mb-2">Current Location</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Lat: {deliveryAgentLocation.latitude?.toFixed(6)}</div>
              <div>Lng: {deliveryAgentLocation.longitude?.toFixed(6)}</div>
              {deliveryAgentLocation.accuracy && (
                <div>Accuracy: ±{deliveryAgentLocation.accuracy.toFixed(0)}m</div>
              )}
              {deliveryAgentLocation.lastUpdated && (
                <div>Updated: {new Date(deliveryAgentLocation.lastUpdated).toLocaleTimeString()}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Distance calculation */}
      {deliveryAgentLocation && deliveryAddress && 
       deliveryAgentLocation.latitude && deliveryAgentLocation.longitude &&
       deliveryAddress.latitude && deliveryAddress.longitude && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-sm text-blue-800 mb-2">Delivery Information</h5>
          <div className="text-sm text-blue-700">
            <div>Distance to destination: {calculateDistance(
              deliveryAgentLocation.latitude,
              deliveryAgentLocation.longitude,
              deliveryAddress.latitude,
              deliveryAddress.longitude
            ).toFixed(2)} km</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

export default TrackingMap;

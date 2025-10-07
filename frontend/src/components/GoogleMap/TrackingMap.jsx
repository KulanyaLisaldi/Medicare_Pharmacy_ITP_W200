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
    // Set initial map center
    if (deliveryAgentLocation && deliveryAgentLocation.latitude && deliveryAgentLocation.longitude) {
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

    // Add delivery agent marker
    if (deliveryAgentLocation && deliveryAgentLocation.latitude && deliveryAgentLocation.longitude) {
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
    }

    // Add delivery address marker
    if (deliveryAddress && deliveryAddress.latitude && deliveryAddress.longitude) {
      newMarkers.push({
        position: {
          lat: deliveryAddress.latitude,
          lng: deliveryAddress.longitude
        },
        title: 'Delivery Address',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#EF4444" stroke="#DC2626" stroke-width="2"/>
              <path d="M16 6l-2 4h4l-2-4z" fill="white"/>
            </svg>
          `),
          scaledSize: { width: 32, height: 32 },
          anchor: { x: 16, y: 16 }
        },
        label: {
          text: '📍',
          fontSize: '16px'
        }
      });
    }

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
            <span>{isTracking ? 'Tracking Active' : 'Tracking Inactive'}</span>
          </div>
        </div>
      </div>

      <div className="relative">
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
        
        {/* Fallback coordinate display */}
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

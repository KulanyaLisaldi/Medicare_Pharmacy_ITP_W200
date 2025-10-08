import React from 'react';

const CoordinateDisplay = ({ 
  deliveryAgentLocation, 
  deliveryAddress, 
  orderNumber 
}) => {
  return (
    <div className="bg-white rounded-lg h-64 p-4 border-2 border-dashed border-gray-300">
      <div className="text-center">
        <div className="text-blue-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Order #{orderNumber} - Location Details
        </h3>
        
        <div className="space-y-4 text-left">
          {/* Delivery Agent Location */}
          {deliveryAgentLocation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="font-medium text-blue-800">Delivery Agent Location</span>
              </div>
              <div className="text-sm text-gray-700">
                <p><strong>Latitude:</strong> {deliveryAgentLocation.latitude?.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {deliveryAgentLocation.longitude?.toFixed(6)}</p>
                {deliveryAgentLocation.accuracy && (
                  <p><strong>Accuracy:</strong> ±{deliveryAgentLocation.accuracy.toFixed(0)}m</p>
                )}
              </div>
            </div>
          )}
          
          {/* Delivery Address */}
          {deliveryAddress && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="font-medium text-red-800">Delivery Address</span>
              </div>
              <div className="text-sm text-gray-700">
                <p><strong>Address:</strong> {deliveryAddress.address || 'Address not available'}</p>
                {deliveryAddress.latitude && deliveryAddress.longitude && (
                  <>
                    <p><strong>Latitude:</strong> {deliveryAddress.latitude.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> {deliveryAddress.longitude.toFixed(6)}</p>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Distance Calculation */}
          {deliveryAgentLocation && deliveryAddress && 
           deliveryAgentLocation.latitude && deliveryAgentLocation.longitude &&
           deliveryAddress.latitude && deliveryAddress.longitude && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="font-medium text-green-800">Distance</span>
              </div>
              <div className="text-sm text-gray-700">
                <p><strong>Straight-line distance:</strong> {calculateDistance(
                  deliveryAgentLocation.latitude, 
                  deliveryAgentLocation.longitude,
                  deliveryAddress.latitude, 
                  deliveryAddress.longitude
                ).toFixed(2)} km</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-700">
            <strong>Location Data:</strong> This shows the coordinate information for tracking purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default CoordinateDisplay;

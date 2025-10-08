import React, { useEffect, useRef, useState } from 'react';

const GoogleMap = ({ 
  center, 
  zoom = 15, 
  markers = [], 
  onMapClick,
  onMarkerClick,
  height = '400px',
  width = '100%',
  className = '',
  apiKey
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [googleMaps, setGoogleMaps] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const resolvedApiKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        
        console.log('Google Maps API Key:', resolvedApiKey ? `${resolvedApiKey.substring(0, 10)}...` : 'Not found');
        
        if (!resolvedApiKey || resolvedApiKey === 'your_google_maps_api_key_here') {
          setError('Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file with your actual API key. For now, showing location coordinates instead of map.');
          return;
        }

        // Use the new Google Maps API
        if (window.google && window.google.maps) {
          setGoogleMaps(window.google.maps);
          setIsLoaded(true);
          console.log('Google Maps already loaded');
          return;
        }

        // Set up timeout to detect loading failures
        const timeoutId = setTimeout(() => {
          if (!isLoaded) {
            setError('Google Maps failed to load within 10 seconds. This might be due to API key restrictions, billing issues, or network problems. Please check your Google Cloud Console settings.');
          }
        }, 10000);

        // Load Google Maps script if not already loaded
        if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${resolvedApiKey}&libraries=places,geometry&callback=initGoogleMap`;
          script.async = true;
          script.defer = true;
          
          // Set up global callback
          window.initGoogleMap = () => {
            clearTimeout(timeoutId);
            if (window.google && window.google.maps) {
              setGoogleMaps(window.google.maps);
              setIsLoaded(true);
              console.log('Google Maps loaded successfully');
            } else {
              setError('Google Maps failed to initialize properly');
            }
          };
          
          // Handle Google Maps API errors
          window.gm_authFailure = () => {
            clearTimeout(timeoutId);
            console.error('Google Maps API authentication failed');
            setError('Google Maps API authentication failed. Please check your API key configuration, restrictions, and billing settings.');
          };
          
          script.onerror = (error) => {
            clearTimeout(timeoutId);
            console.error('Script loading error:', error);
            setError('Failed to load Google Maps script. This could be due to: 1) Invalid API key, 2) API restrictions, 3) Billing not enabled, 4) Network issues.');
          };
          
          document.head.appendChild(script);
        } else {
          // Script already exists, wait for it to load
          const checkGoogleMaps = () => {
            if (window.google && window.google.maps) {
              clearTimeout(timeoutId);
              setGoogleMaps(window.google.maps);
              setIsLoaded(true);
              console.log('Google Maps loaded successfully');
            } else {
              setTimeout(checkGoogleMaps, 100);
            }
          };
          checkGoogleMaps();
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        if (err.message && err.message.includes('API key')) {
          setError(`Google Maps API Error: ${err.message}. Please check your API key configuration and ensure the Maps JavaScript API is enabled.`);
        } else {
          setError(`Failed to load Google Maps: ${err.message || 'Unknown error'}`);
        }
      }
    };

    loadGoogleMaps();
  }, [apiKey]);

  useEffect(() => {
    if (isLoaded && googleMaps && mapRef.current && !map) {
      const mapInstance = new googleMaps.Map(mapRef.current, {
        center: center || { lat: 6.9271, lng: 79.8612 }, // Default to Colombo, Sri Lanka
        zoom: zoom,
        mapTypeId: googleMaps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);

      // Add click listener if provided
      if (onMapClick) {
        mapInstance.addListener('click', (event) => {
          onMapClick(event.latLng);
        });
      }
    }
  }, [isLoaded, googleMaps, center, zoom, onMapClick]);

  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  useEffect(() => {
    if (map && markers.length > 0) {
      console.log('GoogleMap - Adding markers:', markers);
      
      // Clear existing markers
      const existingMarkers = map.markers || [];
      existingMarkers.forEach(marker => marker.setMap(null));

      // Add new markers
      const newMarkers = markers.map(markerData => {
        console.log('Creating marker at:', markerData.position);
        const marker = new googleMaps.Marker({
          position: markerData.position,
          map: map,
          title: markerData.title || '',
          icon: markerData.icon || null,
          label: markerData.label || null,
          animation: markerData.animation || null
        });

        // Add click listener if provided
        if (onMarkerClick) {
          marker.addListener('click', () => {
            onMarkerClick(markerData);
          });
        }

        return marker;
      });

      // Store markers reference
      map.markers = newMarkers;
      console.log('GoogleMap - Markers added successfully:', newMarkers.length);

      // Fit map to show all markers
      if (markers.length > 0) {
        const bounds = new googleMaps.LatLngBounds();
        markers.forEach(marker => {
          bounds.extend(marker.position);
        });
        
        // Add some padding to the bounds
        const padding = 0.01; // Adjust this value as needed
        bounds.extend(new googleMaps.LatLng(
          bounds.getNorthEast().lat() + padding,
          bounds.getNorthEast().lng() + padding
        ));
        bounds.extend(new googleMaps.LatLng(
          bounds.getSouthWest().lat() - padding,
          bounds.getSouthWest().lng() - padding
        ));
        
        map.fitBounds(bounds);
        
        // Ensure minimum zoom level
        const listener = googleMaps.event.addListener(map, 'bounds_changed', () => {
          if (map.getZoom() > 15) map.setZoom(15);
          googleMaps.event.removeListener(listener);
        });
      }
    } else if (map && markers.length === 0) {
      console.log('GoogleMap - No markers to add');
    }
  }, [map, markers, onMarkerClick]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}
        style={{ height, width }}
      >
        <div className="text-center p-4">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Google Maps Error</h3>
          <p className="text-sm text-gray-700 mb-4">{error}</p>
          <div className="bg-white rounded-lg p-3 text-left">
            <h4 className="font-medium text-gray-800 mb-2">Troubleshooting Steps:</h4>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Verify your API key is correct in the .env file</li>
              <li>Ensure Maps JavaScript API is enabled in Google Cloud Console</li>
              <li>Check API key restrictions allow localhost:5173</li>
              <li>Verify billing is enabled for your Google Cloud project</li>
              <li>Check if API key has proper domain restrictions</li>
              <li>Try refreshing the page or clearing browser cache</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="text-blue-500 mb-2">
            <svg className="w-8 h-8 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={className}
      style={{ height, width }}
    />
  );
};

export default GoogleMap;

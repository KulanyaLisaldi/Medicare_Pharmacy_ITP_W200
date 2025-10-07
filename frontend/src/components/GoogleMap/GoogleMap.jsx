import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

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
        const apiKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
          setError('Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file with your actual API key. For now, showing location coordinates instead of map.');
          return;
        }

        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        const google = await loader.load();
        setGoogleMaps(google.maps);
        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps');
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
      // Clear existing markers
      const existingMarkers = map.markers || [];
      existingMarkers.forEach(marker => marker.setMap(null));

      // Add new markers
      const newMarkers = markers.map(markerData => {
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

      // Fit map to show all markers
      if (markers.length > 1) {
        const bounds = new googleMaps.LatLngBounds();
        markers.forEach(marker => {
          bounds.extend(marker.position);
        });
        map.fitBounds(bounds);
      }
    }
  }, [map, markers, onMarkerClick]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-500 mt-1">Please check your Google Maps API key</p>
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

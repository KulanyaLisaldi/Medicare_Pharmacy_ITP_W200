import { Client } from '@googlemaps/google-maps-services-js';

// Initialize Google Maps client
const client = new Client({});

/**
 * Convert address string to coordinates using Google Maps Geocoding API
 * @param {string} address - The address to geocode
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string}>}
 */
export const geocodeAddress = async (address) => {
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
            console.warn('Google Maps API key not found, using fallback geocoding');
            return await fallbackGeocodeAddress(address);
        }

        const response = await client.geocode({
            params: {
                address: address,
                key: apiKey,
                region: 'lk', // Sri Lanka region bias
                components: {
                    country: 'LK' // Sri Lanka
                }
            }
        });

        if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            const location = result.geometry.location;
            
            return {
                latitude: location.lat,
                longitude: location.lng,
                formattedAddress: result.formatted_address,
                placeId: result.place_id
            };
        } else {
            console.warn('No geocoding results found for address:', address);
            return await fallbackGeocodeAddress(address);
        }
    } catch (error) {
        console.error('Google Maps Geocoding API error:', error.message);
        console.warn('Falling back to mock geocoding for address:', address);
        return await fallbackGeocodeAddress(address);
    }
};

/**
 * Fallback geocoding using mock data for Sri Lankan cities
 * @param {string} address - The address to geocode
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string}>}
 */
const fallbackGeocodeAddress = async (address) => {
    // Mock implementation for Sri Lanka coordinates
    const mockCoordinates = {
        'colombo': { latitude: 6.9271, longitude: 79.8612 },
        'kandy': { latitude: 7.2906, longitude: 80.6337 },
        'galle': { latitude: 6.0329, longitude: 80.2170 },
        'jaffna': { latitude: 9.6615, longitude: 80.0255 },
        'anuradhapura': { latitude: 8.3114, longitude: 80.4037 },
        'kurunegala': { latitude: 7.4863, longitude: 80.3630 },
        'negombo': { latitude: 7.2086, longitude: 79.8358 },
        'batticaloa': { latitude: 7.7102, longitude: 81.6924 },
        'ratnapura': { latitude: 6.6828, longitude: 80.4012 },
        'badulla': { latitude: 6.9934, longitude: 81.0550 }
    };

    // Simple keyword matching for demonstration
    const addressLower = address.toLowerCase();
    
    for (const [city, coords] of Object.entries(mockCoordinates)) {
        if (addressLower.includes(city)) {
            return {
                ...coords,
                formattedAddress: `${city.charAt(0).toUpperCase() + city.slice(1)}, Sri Lanka`,
                placeId: null
            };
        }
    }

    // Default to Colombo if no match found
    return {
        ...mockCoordinates.colombo,
        formattedAddress: 'Colombo, Sri Lanka',
        placeId: null
    };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

/**
 * Generate a unique tracking number
 * @returns {string} Tracking number
 */
export const generateTrackingNumber = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TRK${timestamp}${random}`.toUpperCase();
};

/**
 * Generate a unique order number
 * @returns {string} Order number
 */
export const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 3);
    return `ORD${timestamp}${random}`.toUpperCase();
};

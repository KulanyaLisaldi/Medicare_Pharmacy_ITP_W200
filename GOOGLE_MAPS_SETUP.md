# Google Maps API Configuration
# Get your API key from: https://console.cloud.google.com/google/maps-apis

# Frontend (Vite) - Create frontend/.env file
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_BACKEND_URL=http://localhost:5001

# Backend (Node.js) - Create backend/.env file
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
FRONTEND_URL=http://localhost:5173

# Instructions:
# 1. Go to Google Cloud Console (https://console.cloud.google.com/)
# 2. Create a new project or select existing one
# 3. Enable the following APIs:
#    - Maps JavaScript API
#    - Geocoding API
#    - Places API (optional)
# 4. Create credentials (API Key)
# 5. Restrict the API key to your domains for security
# 6. Replace 'your_google_maps_api_key_here' with your actual API key
# 7. Copy this file to .env in both frontend and backend directories

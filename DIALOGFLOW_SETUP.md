# Dialogflow Chatbot Integration Guide

## Setup Instructions

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Dialogflow API
4. Create a service account and download the JSON key file
5. Place the key file in the backend directory as `dialogflow-key.json`

### 2. Dialogflow Agent Setup
1. Go to [Dialogflow Console](https://dialogflow.cloud.google.com/)
2. Create a new agent
3. Set the project ID to match your Google Cloud project
4. Configure the following intents:

#### Intents to Create:
- **BookAppointment**: "I want to book an appointment", "Schedule a visit", "Book a slot"
- **ViewBookings**: "Show my appointments", "View my bookings", "Check my schedule"
- **ViewProducts**: "Show me products", "Browse medicines", "What products do you have"
- **GetHelp**: "Help me", "What can you do", "How can you help"
- **ContactInfo**: "Contact information", "Phone number", "Address", "How to reach you"

### 3. Environment Variables
Add these to your backend `.env` file:
```
DIALOGFLOW_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./dialogflow-key.json
```

### 4. Multi-language Support
To enable multi-language support:
1. In Dialogflow Console, go to Settings > Languages
2. Add languages: English (en-US), Sinhala (si-LK), Tamil (ta-LK)
3. Update the language code in the chatbot controller

### 5. Testing
1. Start the backend server: `npm start`
2. Start the frontend server: `npm run dev`
3. Open the application and click the chatbot icon
4. Test various intents like "Book appointment", "View my bookings"

### 6. Customization
- Modify `ActionProvider.js` to customize responses
- Update `MessageParser.js` to handle more complex queries
- Add new intents in Dialogflow and corresponding handlers in `chatbotController.js`

## Features Implemented
- ✅ Book appointment intent
- ✅ View bookings intent  
- ✅ View products intent
- ✅ Help intent
- ✅ Contact information intent
- ✅ Multi-language support structure
- ✅ Responsive chatbot widget
- ✅ Integration with existing APIs

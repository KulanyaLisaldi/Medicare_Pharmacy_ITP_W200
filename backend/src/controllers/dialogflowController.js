import { SessionsClient } from '@google-cloud/dialogflow';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Order from '../models/Order.js';

// Initialize Dialogflow client
const dialogflowClient = new SessionsClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-credentials.json'
});

const projectId = process.env.DIALOGFLOW_PROJECT_ID || 'your-project-id';
const sessionId = 'medicare-chatbot-session';

// Process message with Dialogflow
export const processMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId || null; // Allow null for unauthenticated users

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Create session path
    const sessionPath = dialogflowClient.projectAgentSessionPath(projectId, sessionId);

    // Prepare request for Dialogflow
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: 'en-US'
        }
      }
    };

    // Detect intent
    const [response] = await dialogflowClient.detectIntent(request);
    const intent = response.queryResult.intent.displayName;
    const parameters = response.queryResult.parameters.fields;
    const fulfillmentText = response.queryResult.fulfillmentText;

    console.log('Dialogflow Intent:', intent);
    console.log('Parameters:', parameters);

    // Handle different intents
    let apiResponse = await handleIntent(intent, parameters, userId, message);

    res.status(200).json({
      success: true,
      intent: intent,
      response: apiResponse || fulfillmentText,
      parameters: parameters
    });

  } catch (error) {
    console.error('Dialogflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing message with Dialogflow'
    });
  }
};

// Handle different intents
const handleIntent = async (intent, parameters, userId, originalMessage) => {
  // If user is not authenticated, provide limited responses
  if (!userId) {
    return handleUnauthenticatedIntent(intent, parameters, originalMessage);
  }

  switch (intent) {
    case 'BookAppointment':
      return await handleBookAppointment(parameters, userId);
    
    case 'ViewBookings':
      return await handleViewBookings(userId);
    
    case 'FindDoctor':
      return await handleFindDoctor(parameters, originalMessage);
    
    case 'MedicineRecommendation':
      return await handleMedicineRecommendation(parameters);
    
    case 'TrackDelivery':
      return await handleTrackDelivery(parameters, userId);
    
    
    case 'DefaultWelcomeIntent':
    case 'GreetingIntent':
      return "👋 Hello! I'm your Medicare Assistant. How can I help you today?";
    
    default:
      return "I'm here to help! Please select one of the options below or describe what you need assistance with.";
  }
};

// Handle intents for unauthenticated users
const handleUnauthenticatedIntent = (intent, parameters, originalMessage) => {
  switch (intent) {
    case 'BookAppointment':
      return "🩺 Booking a New Appointment\n\n" +
             "I'll guide you through booking an appointment step by step:\n\n" +
             "1️⃣ Find Your Doctor\n" +
             "First, let's find the right doctor for you. You can search by:\n" +
             "• Doctor's name\n" +
             "• Specialization (Pediatrics, Cardiology, etc.)\n" +
             "• Location or hospital\n\n" +
             "2️⃣ Book Your Slot\n" +
             "Once you find your doctor, click the 'Book' button to see available time slots.\n\n" +
             "3️⃣ Fill Appointment Form\n" +
             "You'll need to provide:\n" +
             "• Preferred date and time\n" +
             "• Reason for visit\n" +
             "• Contact information\n\n" +
             "4️⃣ Confirm & Submit\n" +
             "Review your details and submit to confirm your appointment.\n\n" +
             "Ready to start? Let me help you find a doctor!";
    
    case 'ViewBookings':
      return "To view your bookings, please sign in to your account first.";
    
    case 'FindDoctor':
      return "I can help you find doctors! Here are some ways to get started:\n\n• Browse by specialty\n• Describe your symptoms\n• View all available doctors\n\nPlease sign in to access the full doctor directory.";
    
    case 'MedicineRecommendation':
      return "I can help you with medicine information! What type of medication are you looking for?";
    
    case 'TrackDelivery':
      return "To track your delivery, please sign in to your account first.";
    
    case 'DefaultWelcomeIntent':
    case 'GreetingIntent':
      return "👋 Hello! I'm your Medicare Assistant. How can I help you today?";
    
    default:
      return "I'm here to help! Please sign in to access all features, or ask me about our services.";
  }
};

// Book Appointment Intent
const handleBookAppointment = async (parameters, userId) => {
  const appointmentType = parameters.appointment_type?.stringValue || 'General Checkup';
  const preferredDate = parameters.date?.stringValue;
  const preferredTime = parameters.time?.stringValue;

  // If user is not authenticated, show steps
  if (!userId) {
    return "To book an appointment, please sign in to your account first. You can create an account or sign in using the buttons in the top right corner.";
  }

  // Here you would integrate with your appointment booking API
  return `I can help you book a ${appointmentType} appointment${preferredDate ? ` for ${preferredDate}` : ''}${preferredTime ? ` at ${preferredTime}` : ''}. Would you like me to show you available time slots?`;
};

// View Bookings Intent
const handleViewBookings = async (userId) => {
  try {
    // Get user's appointments
    const appointments = await Appointment.find({ userId })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ appointmentDate: 1 })
      .limit(5);

    if (appointments.length === 0) {
      return "You don't have any upcoming appointments. Would you like to book one?";
    }

    let response = "Here are your upcoming appointments:\n\n";
    appointments.forEach((apt, index) => {
      const date = new Date(apt.appointmentDate).toLocaleDateString();
      const time = new Date(apt.appointmentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      response += `${index + 1}. Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName} - ${apt.doctorId.specialization}\n`;
      response += `   📅 ${date} at ${time}\n`;
      response += `   📍 ${apt.location || 'Main Clinic'}\n\n`;
    });

    response += "Would you like to reschedule or cancel any of these appointments?";
    return response;

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return "I'm having trouble accessing your appointments. Please try again later.";
  }
};

// Find Doctor Intent
const handleFindDoctor = async (parameters, originalMessage) => {
  const specialty = parameters.specialty?.stringValue;
  const symptoms = parameters.symptoms?.stringValue;
  const action = parameters.action?.stringValue;

  // Handle "Show all available doctors" action
  if (action === 'show_all_doctors' || originalMessage.toLowerCase().includes('show all') || originalMessage.toLowerCase().includes('all doctors')) {
    return await handleShowAllDoctors();
  }

  // Handle "Describe symptoms" action
  if (action === 'describe_symptoms' || originalMessage.toLowerCase().includes('describe symptoms') || originalMessage.toLowerCase().includes('symptom')) {
    return "Please describe your symptoms or health concerns, and I'll recommend the best specialist for you. For example: 'I have chest pain' or 'I have a skin rash'.";
  }

  if (specialty) {
    // Find doctors by specialty
    const doctors = await User.find({ 
      role: 'doctor', 
      specialization: { $regex: specialty, $options: 'i' } 
    }).limit(5);

    if (doctors.length === 0) {
      return `I couldn't find any ${specialty} specialists. Would you like me to search for a different specialty?`;
    }

    let response = `Here are available ${specialty} specialists:\n\n`;
    doctors.forEach((doctor, index) => {
      response += `${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName}\n`;
      response += `   🏥 ${doctor.specialization}\n`;
      response += `   📧 ${doctor.email}\n`;
      response += `   📞 ${doctor.phone || 'Contact via email'}\n`;
      response += `   ⭐ Rating: ${doctor.rating || '4.5'}/5\n\n`;
    });

    response += "Would you like to book an appointment with any of these doctors?";
    return response;

  } else if (symptoms || originalMessage.toLowerCase().includes('symptom') || originalMessage.toLowerCase().includes('pain') || originalMessage.toLowerCase().includes('ache')) {
    // Analyze symptoms and recommend specialty
    const symptomAnalysis = analyzeSymptoms(originalMessage);
    return `Based on your symptoms, I recommend consulting a ${symptomAnalysis.specialty}. ${symptomAnalysis.reason} Would you like me to find available ${symptomAnalysis.specialty} specialists?`;
  } else {
    return "I can help you find the right doctor! Choose an option:\n\n• View all available doctors\n• Describe your symptoms for recommendations\n• Browse by specialty";
  }
};

// Show all available doctors
const handleShowAllDoctors = async () => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('firstName lastName specialization email phone rating')
      .sort({ specialization: 1, lastName: 1 })
      .limit(10);

    if (doctors.length === 0) {
      return "No doctors are currently available in our system. Please check back later.";
    }

    let response = "Here are all available doctors in our system:\n\n";
    
    // Group doctors by specialty
    const doctorsBySpecialty = {};
    doctors.forEach(doctor => {
      const specialty = doctor.specialization || 'General Practice';
      if (!doctorsBySpecialty[specialty]) {
        doctorsBySpecialty[specialty] = [];
      }
      doctorsBySpecialty[specialty].push(doctor);
    });

    // Display doctors grouped by specialty
    Object.keys(doctorsBySpecialty).forEach(specialty => {
      response += `🏥 ${specialty}:\n`;
      doctorsBySpecialty[specialty].forEach((doctor, index) => {
        response += `   ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName}\n`;
        response += `      📧 ${doctor.email}\n`;
        response += `      📞 ${doctor.phone || 'Contact via email'}\n`;
        response += `      ⭐ Rating: ${doctor.rating || '4.5'}/5\n\n`;
      });
    });

    response += "Would you like to book an appointment with any of these doctors?";
    return response;

  } catch (error) {
    console.error('Error fetching doctors:', error);
    return "I'm having trouble accessing our doctor database. Please try again later.";
  }
};

// Medicine Recommendation Intent
const handleMedicineRecommendation = async (parameters) => {
  const medicineType = parameters.medicine_type?.stringValue;
  const condition = parameters.condition?.stringValue;

  if (medicineType) {
    return `I can help you find ${medicineType} medications. Here are some popular options:\n\n• Over-the-counter options\n• Prescription medications\n• Natural alternatives\n\nWould you like me to search for specific ${medicineType} medicines?`;
  } else if (condition) {
    return `For ${condition}, I recommend consulting with a healthcare provider for proper medication. However, I can help you find general information about treatments for ${condition}.`;
  } else {
    return "I can help you with medicine recommendations! What type of medication are you looking for? (e.g., pain relief, cold medicine, vitamins)";
  }
};

// Track Delivery Intent
const handleTrackDelivery = async (parameters, userId) => {
  const orderNumber = parameters.order_number?.stringValue;

  if (orderNumber) {
    // Track specific order
    const order = await Order.findOne({ 
      orderNumber: orderNumber,
      userId: userId 
    });

    if (!order) {
      return `I couldn't find an order with number ${orderNumber}. Please check the order number and try again.`;
    }

    const status = order.status || 'Processing';
    const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'TBD';

    return `Order ${orderNumber} Status:\n\n📦 Current Status: ${status}\n📅 Expected Delivery: ${deliveryDate}\n📍 Tracking: ${order.trackingNumber || 'Not available'}\n\nWould you like more details about this order?`;

  } else {
    // Get recent orders
    const recentOrders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    if (recentOrders.length === 0) {
      return "You don't have any recent orders. Would you like to browse our products?";
    }

    let response = "Here are your recent orders:\n\n";
    recentOrders.forEach((order, index) => {
      const status = order.status || 'Processing';
      response += `${index + 1}. Order #${order.orderNumber}\n`;
      response += `   📦 Status: ${status}\n`;
      response += `   📅 Date: ${new Date(order.createdAt).toLocaleDateString()}\n\n`;
    });

    response += "Which order would you like to track?";
    return response;
  }
};


// Analyze symptoms and recommend specialty
const analyzeSymptoms = (message) => {
  const symptomText = message.toLowerCase();
  
  const symptomMapping = {
    // Cardiovascular symptoms
    'chest pain': { specialty: 'Cardiologist', reason: 'Chest pain requires immediate cardiac evaluation.' },
    'heart palpitation': { specialty: 'Cardiologist', reason: 'Heart palpitations need cardiac assessment.' },
    'shortness of breath': { specialty: 'Cardiologist', reason: 'Breathing difficulties may indicate heart issues.' },
    'high blood pressure': { specialty: 'Cardiologist', reason: 'Blood pressure issues need cardiac monitoring.' },
    
    // Neurological symptoms
    'headache': { specialty: 'Neurologist', reason: 'Headaches may indicate neurological issues.' },
    'migraine': { specialty: 'Neurologist', reason: 'Migraines require neurological evaluation.' },
    'seizure': { specialty: 'Neurologist', reason: 'Seizures need immediate neurological assessment.' },
    'dizziness': { specialty: 'Neurologist', reason: 'Dizziness may indicate neurological problems.' },
    'numbness': { specialty: 'Neurologist', reason: 'Numbness requires neurological evaluation.' },
    
    // Respiratory symptoms
    'cough': { specialty: 'Pulmonologist', reason: 'Persistent cough may indicate respiratory issues.' },
    'asthma': { specialty: 'Pulmonologist', reason: 'Asthma requires pulmonary specialist care.' },
    'wheezing': { specialty: 'Pulmonologist', reason: 'Wheezing indicates respiratory problems.' },
    
    // Dermatological symptoms
    'skin rash': { specialty: 'Dermatologist', reason: 'Skin issues are best handled by dermatologists.' },
    'acne': { specialty: 'Dermatologist', reason: 'Acne treatment needs dermatological expertise.' },
    'mole': { specialty: 'Dermatologist', reason: 'Mole changes require dermatological evaluation.' },
    'itching': { specialty: 'Dermatologist', reason: 'Persistent itching needs skin specialist care.' },
    
    // Pediatric symptoms
    'child': { specialty: 'Pediatrician', reason: 'Children need specialized pediatric care.' },
    'baby': { specialty: 'Pediatrician', reason: 'Infants require pediatric specialist care.' },
    'fever': { specialty: 'General Practitioner', reason: 'Fever is best evaluated by a general practitioner first.' },
    
    // Gynecological symptoms
    'pregnancy': { specialty: 'Gynecologist', reason: 'Pregnancy-related concerns need obstetric care.' },
    'menstrual': { specialty: 'Gynecologist', reason: 'Menstrual issues need gynecological evaluation.' },
    'fertility': { specialty: 'Gynecologist', reason: 'Fertility concerns need reproductive health specialist.' },
    
    // Gastrointestinal symptoms
    'stomach pain': { specialty: 'Gastroenterologist', reason: 'Digestive issues require gastroenterology expertise.' },
    'nausea': { specialty: 'Gastroenterologist', reason: 'Persistent nausea needs digestive system evaluation.' },
    'diarrhea': { specialty: 'Gastroenterologist', reason: 'Digestive problems need gastroenterology care.' },
    'constipation': { specialty: 'Gastroenterologist', reason: 'Bowel issues require gastroenterology assessment.' },
    
    // Endocrine symptoms
    'diabetes': { specialty: 'Endocrinologist', reason: 'Diabetes management needs endocrinology expertise.' },
    'thyroid': { specialty: 'Endocrinologist', reason: 'Thyroid issues require endocrinology specialist.' },
    'weight gain': { specialty: 'Endocrinologist', reason: 'Unexplained weight changes need endocrine evaluation.' },
    
    // Mental health symptoms
    'anxiety': { specialty: 'Psychiatrist', reason: 'Anxiety disorders need psychiatric evaluation.' },
    'depression': { specialty: 'Psychiatrist', reason: 'Depression requires mental health specialist care.' },
    'stress': { specialty: 'Psychiatrist', reason: 'Chronic stress needs mental health assessment.' },
    'mental health': { specialty: 'Psychiatrist', reason: 'Mental health concerns need psychiatric evaluation.' },
    
    // Orthopedic symptoms
    'bone pain': { specialty: 'Orthopedist', reason: 'Bone and joint issues need orthopedic care.' },
    'back pain': { specialty: 'Orthopedist', reason: 'Back problems require orthopedic evaluation.' },
    'joint pain': { specialty: 'Orthopedist', reason: 'Joint issues need orthopedic specialist care.' },
    'fracture': { specialty: 'Orthopedist', reason: 'Bone fractures require orthopedic treatment.' },
    
    // Eye symptoms
    'eye problem': { specialty: 'Ophthalmologist', reason: 'Eye issues need specialized eye care.' },
    'vision': { specialty: 'Ophthalmologist', reason: 'Vision problems require ophthalmology evaluation.' },
    'blurred vision': { specialty: 'Ophthalmologist', reason: 'Vision changes need eye specialist assessment.' },
    
    // ENT symptoms
    'ear pain': { specialty: 'ENT Specialist', reason: 'Ear, nose, and throat issues need ENT expertise.' },
    'hearing': { specialty: 'ENT Specialist', reason: 'Hearing problems require ENT specialist care.' },
    'sinus': { specialty: 'ENT Specialist', reason: 'Sinus issues need ENT evaluation.' },
    'throat pain': { specialty: 'ENT Specialist', reason: 'Throat problems require ENT specialist care.' }
  };

  for (const [symptom, recommendation] of Object.entries(symptomMapping)) {
    if (symptomText.includes(symptom)) {
      return recommendation;
    }
  }

  return { specialty: 'General Practitioner', reason: 'For general health concerns, start with a general practitioner who can refer you to the appropriate specialist.' };
};

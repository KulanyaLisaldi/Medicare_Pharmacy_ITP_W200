import { createChatBotMessage } from 'react-chatbot-kit';

class ActionProvider {
  constructor(createChatBotMessage, setStateFunc, createClientMessage) {
    this.createChatBotMessage = createChatBotMessage;
    // Keep a live reference of state so we can compare previous results reliably
    // Initialize with sensible defaults to avoid undefined checks during early lifecycle
    this.stateRef = { current: { awaitingSymptoms: false, messages: [] } };
    this.setState = (updater) => {
      setStateFunc((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        this.stateRef.current = next;
        return next;
      });
    };
    this.createClientMessage = createClientMessage;
    // awaitingSymptoms feature removed
    this.awaitingSymptoms = false;
    this.selectedMedicineCategory = null;
  }

  // Handle Dialogflow responses
  handleDialogflowResponse = async (userMessage) => {
    try {
      // awaitingSymptoms flow removed
      
      const token = localStorage.getItem('token');
      
      // Always allow core flows even if not signed in

      const response = await fetch('http://localhost:5001/api/dialogflow/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (response.status === 401) {
        // Token expired, use local responses
        this.handleLocalResponse(userMessage);
        return;
      }

      // If Dialogflow backend errors, fall back to local responses gracefully
      if (!response.ok) {
        this.handleLocalResponse(userMessage);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        // Handle different intent responses
        switch (data.intent) {
          case 'BookAppointment':
            this.handleBookAppointment(data);
            break;
          case 'ViewBookings':
            this.handleViewBookings(data);
            break;
          case 'FindDoctor':
            this.handleFindDoctor(data);
            break;
          case 'MedicineRecommendation':
            this.handleMedicineRecommendation(data);
            break;
          case 'TrackDelivery':
            this.handleTrackDelivery(data);
            break;
          default:
            this.handleDefaultResponse(data);
        }
      } else {
        // If Dialogflow returns an application error, prefer local fallback
        this.handleLocalResponse(userMessage);
      }
    } catch (error) {
      console.error('Dialogflow error:', error);
      this.handleLocalResponse(userMessage);
    }
  };

  // Symptom mapping removed

  // Symptom analysis removed

  // Symptom input handler removed

  // Fetch doctors by specialization and show list
  findSpecialist = async (specialty) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/doctor-recommendations/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ specialty })
      });

      const data = await response.json();

      if (response.ok && data?.data?.doctors) {
        // Deduplicate by id/email to avoid repeats
        const seen = new Set();
        const uniqueDoctors = (data.data.doctors || []).filter(d => {
          const key = d.id || d.email || `${d.name}-${d.specialization}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // If results are identical to the last render for the same specialty, avoid adding another message
        const prevState = this.stateRef?.current;
        const prevResults = prevState?.doctorResults;
        let isSameAsBefore = false;
        if (prevResults && prevResults.specialty === specialty) {
          const prevKeys = new Set((prevResults.doctors || []).map(d => d.id || d.email || `${d.name}-${d.specialization}`));
          const newKeys = new Set(uniqueDoctors.map(d => d.id || d.email || `${d.name}-${d.specialization}`));
          if (prevKeys.size === newKeys.size) {
            isSameAsBefore = [...newKeys].every(k => prevKeys.has(k));
          }
        }

        if (isSameAsBefore) {
          // Do not duplicate the same list again
          return;
        }

        const payload = { specialty, doctors: uniqueDoctors };
        this.setState(prev => ({ ...prev, doctorResults: payload }));
        const message = this.createChatBotMessage('', { widget: 'doctorList', payload });
        this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
      } else {
        const notAvailable = data?.message || `No ${specialty} doctors found.`;
        // Avoid pushing the same not-available message twice in a row
        const prev = this.stateRef?.current;
        const lastMsg = prev?.messages?.[prev.messages.length - 1]?.props?.message || prev?.messages?.[prev.messages.length - 1]?.message;
        if (lastMsg !== notAvailable) {
          const payload = { specialty, doctors: [], message: notAvailable };
          this.setState(prev => ({ ...prev, doctorResults: payload }));
          const message = this.createChatBotMessage('', { widget: 'doctorList', payload });
          this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
        }
      }
    } catch (error) {
      console.error('Doctor recommendation error:', error);
      const message = this.createChatBotMessage('Sorry, something went wrong fetching doctors.');
      this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
    }
  };

  // Symptom to Specialty mapping for the selector
  symptomToSpecialty = {
    'headache': 'Neurology',
    'migraine': 'Neurology',
    'seizure': 'Neurology',
    'dizziness': 'Neurology',
    'memory': 'Neurology',
    'confusion': 'Neurology',
    'numbness': 'Neurology',
    'tingling': 'Neurology',
    'chest pain': 'Cardiology',
    'heart': 'Cardiology',
    'blood pressure': 'Cardiology',
    'palpitation': 'Cardiology',
    'shortness of breath': 'Cardiology',
    'cough': 'Pulmonology',
    'asthma': 'Pulmonology',
    'lung': 'Pulmonology',
    'wheezing': 'Pulmonology',
    'chest tightness': 'Pulmonology',
    'skin': 'Dermatology',
    'rash': 'Dermatology',
    'acne': 'Dermatology',
    'mole': 'Dermatology',
    'itching': 'Dermatology',
    'dry skin': 'Dermatology',
    'child': 'Pediatrics',
    'baby': 'Pediatrics',
    'infant': 'Pediatrics',
    'toddler': 'Pediatrics',
    'pregnancy': 'Gynecology',
    'menstrual': 'Gynecology',
    'period': 'Gynecology',
    'fertility': 'Gynecology',
    'stomach': 'Gastroenterology',
    'digestion': 'Gastroenterology',
    'nausea': 'Gastroenterology',
    'vomiting': 'Gastroenterology',
    'diarrhea': 'Gastroenterology',
    'constipation': 'Gastroenterology',
    'abdominal pain': 'Gastroenterology',
    'tooth': 'Dentistry',
    'dental': 'Dentistry',
    'gum': 'Dentistry',
    'jaw': 'Dentistry',
    'mouth': 'Dentistry',
    'oral': 'Dentistry',
    'eye': 'Ophthalmology',
    'vision': 'Ophthalmology',
    'blurred': 'Ophthalmology',
    'glaucoma': 'Ophthalmology',
    'ear': 'ENT',
    'nose': 'ENT',
    'throat': 'ENT',
    'hearing': 'ENT',
    'sinus': 'ENT',
    'anxiety': 'Psychiatry',
    'depression': 'Psychiatry',
    'stress': 'Psychiatry',
    'mental': 'Psychiatry',
    'bone': 'Orthopedics',
    'joint': 'Orthopedics',
    'back': 'Orthopedics',
    'spine': 'Orthopedics',
    'fracture': 'Orthopedics',
    'urine infection': 'Urology',
    'kidney pain': 'Urology',
    'fever': 'General Medicine',
    'flu': 'General Medicine',
    'infection': 'General Medicine'
  };

  // Show list of symptoms for user to choose
  handleDescribeSymptoms = () => {
    const intro = this.createChatBotMessage(
      'Select a symptom so I can recommend the most suitable specialist:',
      { widget: 'symptomSelector' }
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, intro] }));
  };

  // Handle when user picks a symptom
  handleSymptomChoice = async (symptom) => {
    const text = String(symptom || '').toLowerCase();
    let specialty = 'General Medicine';
    for (const [key, value] of Object.entries(this.symptomToSpecialty)) {
      if (text.includes(key)) { specialty = value; break; }
    }
    const rec = this.createChatBotMessage(`Based on '${symptom}', you should consult a ${specialty} specialist.`);
    this.setState(prev => ({ ...prev, messages: [...prev.messages, rec] }));
    await this.findSpecialist(specialty);
  };

  // Handle local responses when not authenticated
  handleLocalResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('book') && message.includes('appointment')) {
      this.handleBookAppointment({ response: "To book an appointment, please sign in to your account first. You can create an account or sign in using the buttons in the top right corner." });
    } else if (message.includes('view') && message.includes('booking')) {
      this.handleViewBookings({ response: "To view your bookings, please sign in to your account first." });
    } else if (message.includes('find') && message.includes('doctor')) {
      this.handleFindDoctor({ response: "I can help you find doctors! Here are some ways to get started:" });
    } else if (message.includes('medicine') || message.includes('medication')) {
      this.handleMedicineRecommendation({ response: "I can help you with medicine information! What type of medication are you looking for?" });
    } else if (message.includes('track') && message.includes('delivery')) {
      this.handleTrackDelivery({ response: "To track your delivery, please sign in to your account first." });
    } else {
      this.handleDefaultResponse({ response: "I'm here to help! Please sign in to access all features, or ask me about our services." });
    }
  };

  handleBookAppointment = (data) => {
    const message = this.createChatBotMessage(
      "🩺 Booking a New Appointment\n\n" +
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
      "Ready to start? Let me help you find a doctor!",
      { widget: 'doctorFinder' }
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
  };

  // Handle booking steps
  handleBookingSteps = () => {
    const stepMessage = this.createChatBotMessage(
      "🗓️ Need help booking an appointment? Here's how to do it:\n\n" +
      "1️⃣ Sign In\n" +
      "Tap the Sign In button at the top right to access your account.\n\n" +
      "2️⃣ Choose a Doctor\n" +
      "Go to the Doctors section and pick a specialist that fits your needs.\n\n" +
      "3️⃣ Pick a Time\n" +
      "Select a date & time that works best for you.\n\n" +
      "4️⃣ Fill in Your Info\n" +
      "Enter your contact details and any important notes.\n\n" +
      "5️⃣ Confirm Booking\n" +
      "Review everything and hit Confirm. Done! ✅\n\n" +
      "💬 Let me know if you'd like me to walk you through it step by step!",
      { widget: 'bookingHelp' }
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, stepMessage] }));
  };

  // Handle user response to booking help
  handleBookingHelpResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('no') || message.includes('nope') || message.includes('not') || message.includes('nothing')) {
      this.handleThankYouMessage();
    } else if (message.includes('yes') || message.includes('help') || message.includes('assist')) {
      this.handleDetailedHelp();
    } else {
      this.handleGeneralHelp();
    }
  };

  // Show thank you message
  handleThankYouMessage = () => {
    const thankYouMessage = this.createChatBotMessage(
      "Thank you for using GodaMediCare 💙 Have a healthy and happy day!",
      { widget: 'conversationEnd' }
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, thankYouMessage] }));
  };

  // Handle conversation end
  handleConversationEnd = () => {
    const endMessage = this.createChatBotMessage(
      "Do you need any more help? You can ask me another question anytime."
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, endMessage] }));
  };

  // Handle help options
  handleHelpOptions = (userResponse) => {
    const response = userResponse.toLowerCase();
    
    if (response.includes('yes') || response.includes('help') || response.includes('more')) {
      this.handleGreeting(); // Show main menu again
    } else if (response.includes('no') || response.includes('nope') || response.includes('not')) {
      this.handleThankYouMessage();
    } else {
      this.handleConversationEnd();
    }
  };

  // Handle reschedule restrictions
  handleRescheduleRestrictions = () => {
    const restrictionMessage = this.createChatBotMessage(
      "🔄 Reschedule or Cancel Appointment\n\n" +
      "For your security and to avoid double-booking, you cannot reschedule or cancel appointments directly through the chatbot.\n\n" +
      "To make changes to your appointment:\n\n" +
      "1️⃣ Contact the Hospital\n" +
      "Call the hospital or clinic directly using the contact information provided in your appointment confirmation.\n\n" +
      "2️⃣ Use the Main Website\n" +
      "Visit the main website and use the 'Contact Us' or 'Support' section for appointment changes.\n\n" +
      "3️⃣ Contact Your Doctor's Office\n" +
      "Reach out to your doctor's office directly for any scheduling changes.\n\n" +
      "This ensures:\n" +
      "• Appointment data security\n" +
      "• Avoids double-booking\n" +
      "• Proper coordination with medical staff\n\n" +
      "Is there anything else I can help you with?"
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, restrictionMessage] }));
  };

  // Provide detailed help
  handleDetailedHelp = () => {
    const helpMessage = this.createChatBotMessage(
      "I'd be happy to help you further! Here are some common issues and solutions:\n\n" +
      "🔐 Can't sign in?\n• Make sure you have an account (use 'Sign Up' if needed)\n• Check your email and password\n• Try the 'Forgot Password' option\n\n" +
      "👨‍⚕️ Can't find a doctor?\n• Use the 'Find Doctor' feature in the chatbot\n• Browse by specialty (Cardiology, Neurology, etc.)\n• Contact our support team\n\n" +
      "📅 No available slots?\n• Try different dates or times\n• Check back later for new openings\n• Contact the doctor's office directly\n\n" +
      "Is there anything specific you'd like help with?"
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, helpMessage] }));
  };

  // Provide general help
  handleGeneralHelp = () => {
    const generalMessage = this.createChatBotMessage(
      "I'm here to help! You can ask me about:\n\n" +
      "• How to create an account\n• Finding the right doctor\n• Understanding appointment types\n• Troubleshooting login issues\n• Contact information\n\n" +
      "What would you like to know more about?"
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, generalMessage] }));
  };

  handleViewBookings = (data) => {
    const message = this.createChatBotMessage(
      "📋 View My Appointments\n\n" +
      "I'll help you access your appointment information:\n\n" +
      "1️⃣ Access Your Appointments\n" +
      "Go to the 'My Appointments' section in your dashboard.\n\n" +
      "2️⃣ View All Details\n" +
      "You can see:\n" +
      "• Doctor's name and specialization\n" +
      "• Appointment date and time\n" +
      "• Hospital or clinic location\n" +
      "• Appointment status\n\n" +
      "3️⃣ Download Records\n" +
      "You can download or print your appointment records for your records.\n\n" +
      "4️⃣ Need Changes?\n" +
      "For rescheduling or cancellations, please contact the hospital or doctor's office directly through the main website or support.\n\n" +
      "This ensures appointment data security and avoids double-booking.\n\n" +
      "If you need more help, just type your question here."
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
  };

  handleFindDoctor = (data) => {
    const message = this.createChatBotMessage(
      data.response || "I can help you find the right doctor! Choose an option below:",
      { widget: 'doctorFinder' }
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
  };

  handleShowAllDoctors = (data) => {
    const message = this.createChatBotMessage(
      data.response || "Here are all available doctors in our system:",
      { widget: 'doctorList' }
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
  };

  // Describe symptoms flow removed

  handleMedicineRecommendation = (data) => {
    const message = this.createChatBotMessage(
      data.response || "I can help you with medicine recommendations! What type of medication are you looking for?",
      { widget: 'medicineRecommendation' }
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
  };

  // When a medicine category is selected, show symptom choices for that category
  handleMedicineCategory = (category) => {
    const normalized = (category || '').toLowerCase();
    this.selectedMedicineCategory = normalized;

    // If user chose Prescription, describe the upload process instead of showing symptoms
    if (normalized === 'prescription') {
      this.handlePrescriptionUploadSteps();
      return;
    }

    const intro = this.createChatBotMessage(
      `You selected ${category}. Please choose a symptom to refine recommendations:`
    );
    const widgetMsg = this.createChatBotMessage('', { widget: 'medicineSymptoms', payload: { category: normalized } });

    this.setState(prev => ({ ...prev, messages: [...prev.messages, intro, widgetMsg] }));
  };

  // Explain how to upload a prescription step-by-step
  handlePrescriptionUploadSteps = () => {
    const steps =
      "📄 Upload Prescription — How it works\n\n" +
      "1️⃣ Prepare your prescription: Clear photo or PDF with doctor details.\n" +
      "2️⃣ Open Upload Prescription: From the menu or your dashboard.\n" +
      "3️⃣ Attach file: Choose image/PDF of the prescription.\n" +
      "4️⃣ Add notes: Add delivery info or special instructions (optional).\n" +
      "5️⃣ Submit: Our pharmacist will verify and contact you if needed.\n\n" +
      "⏱️ Processing: You’ll receive confirmation and can track your order in Orders.";

    const msg = this.createChatBotMessage(steps);
    this.setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));
  };

  // After symptom selection, provide guidance or link to category-filtered products
  handleMedicineSymptomSelect = (category, symptom) => {
    const c = (category || '').toLowerCase();
    const s = symptom;

    // Echo the user's selection as a user message in the chat
    const userMsg = this.createClientMessage(s);
    this.setState(prev => ({ ...prev, messages: [...prev.messages, userMsg] }));

    // Curated OTC suggestions by category/symptom (active ingredients, examples)
    const SUGGESTIONS = {
      'pain relief': {
        'headache': [
          'Paracetamol (Acetaminophen) 500 mg',
          'Ibuprofen 200 mg (with food)',
          'Aspirin 300 mg (adults only)'
        ],
        'muscle pain': [
          'Ibuprofen 200–400 mg',
          'Naproxen 220 mg',
          'Topical diclofenac gel'
        ],
        'back pain': [
          'Ibuprofen 200–400 mg',
          'Naproxen 220 mg',
          'Paracetamol 500 mg'
        ],
        'toothache': [
          'Ibuprofen 200–400 mg',
          'Paracetamol 500 mg',
          'Benzocaine topical gel (temporary)'
        ],
        'menstrual cramps': [
          'Ibuprofen 200–400 mg',
          'Naproxen 220 mg',
          'Mefenamic acid (if prescribed)'
        ]
      },
      'cold and flu': {
        'fever': [
          'Paracetamol 500 mg',
          'Ibuprofen 200 mg (if not contraindicated)'
        ],
        'cough': [
          'Dextromethorphan syrup',
          'Guaifenesin expectorant',
          'Honey/lemon lozenges'
        ],
        'sore throat': [
          'Benzydamine gargle/spray',
          'Menthol lozenges',
          'Paracetamol 500 mg'
        ],
        'nasal congestion': [
          'Oxymetazoline nasal spray (≤3 days)',
          'Pseudoephedrine tablets (age/contraindications apply)',
          'Saline nasal spray'
        ],
        'runny nose': [
          'Cetirizine 10 mg',
          'Loratadine 10 mg'
        ]
      },
      'vitamins': {
        'low energy': [
          'Vitamin B-complex',
          'Iron + Vitamin C (if iron-deficient)'
        ],
        'immunity support': [
          'Vitamin C 500 mg',
          'Vitamin D3 1000 IU',
          'Zinc 10–20 mg'
        ],
        'bone health': [
          'Calcium + Vitamin D3'
        ],
        'anemia': [
          'Ferrous fumarate/ferrous sulfate (check with doctor if persistent)'
        ],
        'hair & nail health': [
          'Biotin',
          'Multivitamin with minerals'
        ]
      },
      'prescription': {
        'hypertension': [
          'Consult pharmacist/doctor for prescription options (ACE inhibitors, ARBs, etc.)'
        ],
        'diabetes': [
          'Consult pharmacist/doctor for prescription options (e.g., Metformin)'
        ],
        'high cholesterol': [
          'Consult pharmacist/doctor for prescription statins as appropriate'
        ],
        'thyroid': [
          'Consult pharmacist/doctor for levothyroxine dosing and monitoring'
        ],
        'asthma': [
          'Consult pharmacist/doctor for inhaled therapies (SABA/ICS, etc.)'
        ]
      }
    };

    const symptomKey = (s || '').toLowerCase();
    const list = (SUGGESTIONS[c] && SUGGESTIONS[c][symptomKey]) || [];

    const listText = list.length
      ? list.map((item) => `• ${item}`).join('\n')
      : 'No specific OTC suggestions available. Please consult a pharmacist or doctor.';

    const guidance = this.createChatBotMessage(
      `Recommended options for ${s.toLowerCase()} (${category}):\n\n${listText}`
    );

    // Only show the recommendations message as requested
    this.setState(prev => ({ ...prev, messages: [...prev.messages, guidance] }));
  };

  handleTrackDelivery = (data) => {
    const message = this.createChatBotMessage(
      data.response || "I can help you track your delivery! Please provide your order number or tracking ID.",
      { widget: 'deliveryTracking' }
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
  };


  handleDefaultResponse = (data) => {
    const message = this.createChatBotMessage(
      data.response || "I'm here to help! Please select one of the options below or describe what you need assistance with."
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
  };

  handleErrorResponse = (errorMessage) => {
    const message = this.createChatBotMessage(
      errorMessage || "Sorry, I encountered an error. Please try again."
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
  };

  // Handle greetings
  handleGreeting = () => {
    const message = this.createChatBotMessage(
      "👋 Hello! I'm your Medicare Assistant.\nHow can I help you today?",
      { widget: 'welcomeButtons' }
    );
    this.setState(prev => ({ ...prev, messages: [...prev.messages, message] }));
  };

  // Handle button clicks
  handleButtonClick = (action) => {
    const userMessage = this.createClientMessage(action);
    this.setState(prev => ({ ...prev, messages: [...prev.messages, userMessage] }));
    
    const lower = action.toLowerCase();
    if (lower.includes('book') && lower.includes('appointment')) {
      this.handleBookAppointment({});
      return;
    }
    if (lower.includes('view') && (lower.includes('booking') || lower.includes('appointments'))) {
      this.handleViewBookings({});
      return;
    }
    if (lower.includes('show all available doctors')) {
      this.handleShowAllDoctors({});
      return;
    }
    if (lower.includes('describe symptoms') || lower.includes('symptom')) {
      this.handleDescribeSymptoms({});
      return;
    }
    if (lower.includes('find') && lower.includes('doctor')) {
      this.handleFindDoctor({});
      return;
    }
    if (lower.includes('medicine')) {
      this.handleMedicineRecommendation({});
      return;
    }
    if (lower.includes('prescription')) {
      this.handlePrescriptionUploadSteps();
      return;
    }
    if (lower.includes('track') && lower.includes('delivery')) {
      this.handleTrackDelivery({});
      return;
    }

    // Fallback to Dialogflow for anything else
    this.handleDialogflowResponse(action);
  };
}

export default ActionProvider;

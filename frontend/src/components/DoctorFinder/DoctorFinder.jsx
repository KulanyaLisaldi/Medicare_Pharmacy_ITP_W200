import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './DoctorFinder.css';

const DoctorFinder = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "👋 Hello! I'm your Medicare Assistant.\nHow can I help you today?",
            sender: 'bot',
            timestamp: new Date(),
            widget: 'welcome-buttons'
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [currentFlow, setCurrentFlow] = useState(null);
    const [showGoBack, setShowGoBack] = useState(false);
    const { user, token } = useAuth();

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    const addMessage = (text, sender = 'bot', widget = null) => {
        console.log('Adding message:', { text, sender, widget });
        const newMessage = {
            id: Date.now(),
            text,
            sender,
            timestamp: new Date(),
            widget
        };
        setMessages(prev => {
            console.log('Previous messages:', prev.length);
            const newMessages = [...prev, newMessage];
            console.log('New messages:', newMessages.length);
            return newMessages;
        });
    };

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;
        
        console.log('Sending message:', inputMessage);
        
        // Add user message
        addMessage(inputMessage, 'user');
        const message = inputMessage.toLowerCase();
        const originalMessage = inputMessage;
        setInputMessage('');
        
        // Handle doctor finder flow
        if (currentFlow === 'find-doctor') {
            handleDoctorFlow(message);
        } else {
            handleGeneralFlow(message);
        }
    };

    const handleDoctorFlow = (message) => {
        // Comprehensive symptom-to-specialist mapping
        const symptoms = {
            // Neurological symptoms
            'headache': 'Neurologist',
            'migraine': 'Neurologist',
            'seizure': 'Neurologist',
            'dizziness': 'Neurologist',
            'memory': 'Neurologist',
            'confusion': 'Neurologist',
            'numbness': 'Neurologist',
            'tingling': 'Neurologist',
            
            // Cardiovascular symptoms
            'chest pain': 'Cardiologist',
            'heart': 'Cardiologist',
            'blood pressure': 'Cardiologist',
            'breathing': 'Cardiologist',
            'palpitation': 'Cardiologist',
            'shortness of breath': 'Cardiologist',
            
            // Respiratory symptoms
            'cough': 'Pulmonologist',
            'asthma': 'Pulmonologist',
            'lung': 'Pulmonologist',
            'wheezing': 'Pulmonologist',
            'chest tightness': 'Pulmonologist',
            
            // Dermatological symptoms
            'skin': 'Dermatologist',
            'rash': 'Dermatologist',
            'acne': 'Dermatologist',
            'mole': 'Dermatologist',
            'itching': 'Dermatologist',
            'dry skin': 'Dermatologist',
            
            // Pediatric symptoms
            'child': 'Pediatrician',
            'baby': 'Pediatrician',
            'infant': 'Pediatrician',
            'toddler': 'Pediatrician',
            
            // Gynecological symptoms
            'pregnancy': 'Gynecologist',
            'menstrual': 'Gynecologist',
            'period': 'Gynecologist',
            'fertility': 'Gynecologist',
            
            // Gastrointestinal symptoms
            'stomach': 'Gastroenterologist',
            'digestion': 'Gastroenterologist',
            'nausea': 'Gastroenterologist',
            'vomiting': 'Gastroenterologist',
            'diarrhea': 'Gastroenterologist',
            'constipation': 'Gastroenterologist',
            'abdominal pain': 'Gastroenterologist',
            
            // Dental symptoms
            'tooth': 'Dentist',
            'dental': 'Dentist',
            'gum': 'Dentist',
            'jaw': 'Dentist',
            'mouth': 'Dentist',
            
            // Eye symptoms
            'eye': 'Ophthalmologist',
            'vision': 'Ophthalmologist',
            'blurred': 'Ophthalmologist',
            'glaucoma': 'Ophthalmologist',
            
            // ENT symptoms
            'ear': 'ENT Specialist',
            'nose': 'ENT Specialist',
            'throat': 'ENT Specialist',
            'hearing': 'ENT Specialist',
            'sinus': 'ENT Specialist',
            
            // Mental health
            'anxiety': 'Psychiatrist',
            'depression': 'Psychiatrist',
            'stress': 'Psychiatrist',
            'mental': 'Psychiatrist',
            
            // Orthopedic symptoms
            'bone': 'Orthopedist',
            'joint': 'Orthopedist',
            'back': 'Orthopedist',
            'spine': 'Orthopedist',
            'fracture': 'Orthopedist'
        };

        let recommendedSpecialist = null;
        for (const [symptom, specialist] of Object.entries(symptoms)) {
            if (message.includes(symptom)) {
                recommendedSpecialist = specialist;
                break;
            }
        }

        if (recommendedSpecialist) {
            addMessage(`You may need to consult a ${recommendedSpecialist}. Would you like to see available doctors now?`, 'bot', 'specialist-confirmation');
        } else {
            addMessage("I understand you're experiencing health issues. Could you please describe your symptoms in more detail so I can recommend the right specialist?", 'bot');
        }
    };

    const handleGeneralFlow = (message) => {
        console.log('Handling general flow for message:', message);
        
        if (message.includes('find') && message.includes('doctor')) {
            setCurrentFlow('find-doctor');
            addMessage("Please tell me what health issue or disease you're facing.", 'bot');
        } else if (message.includes('medicine') || message.includes('medication') || message.includes('drug') || message.includes('pill')) {
            addMessage("I can help you with medicine recommendations! What type of medication are you looking for?", 'bot');
        } else if (message.includes('track') && message.includes('delivery')) {
            addMessage("I can help you track your delivery! Please provide your order number or tracking ID.", 'bot');
        } else if (message.includes('appointment') || message.includes('book') || message.includes('schedule')) {
            addMessage("I can help you book an appointment! What type of appointment do you need?", 'bot');
        } else if (message.includes('faq') || message.includes('help') || message.includes('question')) {
            addMessage("Here are some frequently asked questions:\n\n• How do I book an appointment?\n• How can I track my delivery?\n• What medicines are available?\n• How do I find a doctor?\n\nIs there anything specific you'd like to know?", 'bot');
        } else if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            addMessage("Hello! I'm here to help you with your healthcare needs. How can I assist you today?", 'bot', 'welcome-buttons');
        } else if (message.includes('symptom') || message.includes('pain') || message.includes('hurt') || message.includes('sick') || message.includes('ill')) {
            setCurrentFlow('find-doctor');
            addMessage("I understand you're experiencing health issues. Please tell me more about your symptoms so I can recommend the right specialist.", 'bot');
        } else {
            // Always provide a helpful response
            addMessage(`I received your message: "${message}". I'm here to help! Please select one of the options above or describe what you need assistance with.`, 'bot', 'welcome-buttons');
        }
    };

    const handleButtonClick = (action) => {
        switch (action) {
            case 'find-doctor':
                setCurrentFlow('find-doctor');
                setShowGoBack(true);
                addMessage("Please tell me what health issue or disease you're facing.", 'bot');
                break;
            case 'medicine':
                setCurrentFlow('medicine');
                setShowGoBack(true);
                addMessage("I can help you with medicine recommendations! What type of medication are you looking for?", 'bot');
                break;
            case 'track-delivery':
                setCurrentFlow('track-delivery');
                setShowGoBack(true);
                addMessage("I can help you track your delivery! Please provide your order number or tracking ID.", 'bot');
                break;
            case 'appointment':
                setCurrentFlow('appointment');
                setShowGoBack(true);
                addMessage("I can help you book an appointment! What type of appointment do you need?", 'bot');
                break;
            case 'faqs':
                setCurrentFlow('faqs');
                setShowGoBack(true);
                addMessage("Here are some frequently asked questions:\n\n• How do I book an appointment?\n• How can I track my delivery?\n• What medicines are available?\n• How do I find a doctor?\n\nIs there anything specific you'd like to know?", 'bot');
                break;
            case 'go-back':
                setCurrentFlow(null);
                setShowGoBack(false);
                addMessage("👋 Hello! I'm your Medicare Assistant.\nHow can I help you today?", 'bot', 'welcome-buttons');
                break;
            case 'yes-specialist':
                addMessage("✅ Here are available specialists in your area:\n\n• Dr. Sarah Johnson - Neurologist (Available today 2:00 PM)\n• Dr. Michael Chen - Neurologist (Available tomorrow 10:00 AM)\n• Dr. Lisa Rodriguez - Neurologist (Available this weekend)\n\nWould you like to book an appointment with any of them?", 'bot', 'book-specialist');
                break;
            case 'no-specialist':
                addMessage("No problem! You can also browse all our doctors by specialty or contact us directly for assistance.", 'bot', 'welcome-buttons');
                break;
            default:
                addMessage("I'm here to help! Please select one of the options above.", 'bot', 'welcome-buttons');
        }
    };

    const renderWidget = (widget) => {
        switch (widget) {
            case 'welcome-buttons':
                return (
                    <div className="welcome-buttons-container">
                        <div className="button-grid">
                            <button className="welcome-btn" onClick={() => handleButtonClick('find-doctor')}>
                                <span className="btn-icon">🏥</span>
                                <span className="btn-text">Find Doctor</span>
                            </button>
                            <button className="welcome-btn" onClick={() => handleButtonClick('medicine')}>
                                <span className="btn-icon">💊</span>
                                <span className="btn-text">Medicine</span>
                            </button>
                            <button className="welcome-btn" onClick={() => handleButtonClick('track-delivery')}>
                                <span className="btn-icon">📦</span>
                                <span className="btn-text">Track Delivery</span>
                            </button>
                            <button className="welcome-btn" onClick={() => handleButtonClick('appointment')}>
                                <span className="btn-icon">📅</span>
                                <span className="btn-text">Appointment</span>
                            </button>
                            <button className="welcome-btn" onClick={() => handleButtonClick('faqs')}>
                                <span className="btn-icon">❓</span>
                                <span className="btn-text">FAQs</span>
                            </button>
                        </div>
                    </div>
                );
            case 'specialist-confirmation':
                return (
                    <div className="confirmation-buttons">
                        <button className="confirm-btn yes" onClick={() => handleButtonClick('yes-specialist')}>
                            Yes, show me doctors
                        </button>
                        <button className="confirm-btn no" onClick={() => handleButtonClick('no-specialist')}>
                            No, thanks
                        </button>
                    </div>
                );
            case 'book-specialist':
                return (
                    <div className="specialist-booking">
                        <button className="book-btn">Book with Dr. Sarah Johnson</button>
                        <button className="book-btn">Book with Dr. Michael Chen</button>
                        <button className="book-btn">Book with Dr. Lisa Rodriguez</button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="doctor-finder-widget">
            {isOpen && (
                <div className="doctor-finder-container">
                    <div className="doctor-finder-header">
                        <h3>🏥 Doctor Finder</h3>
                        <button 
                            className="close-btn"
                            onClick={toggleChatbot}
                        >
                            ×
                        </button>
                    </div>
                    <div className="doctor-finder-body">
                        <div className="messages-container">
                            {messages.map((message) => (
                                <div key={message.id} className={`message-item ${message.sender}`}>
                                    <div className="message-content">
                                        <div className="message-text">{message.text}</div>
                                        {message.widget && renderWidget(message.widget)}
                                        <div className="message-time">
                                            {message.timestamp.toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="message-input-container">
                            {showGoBack && (
                                <button 
                                    className="go-back-btn"
                                    onClick={() => handleButtonClick('go-back')}
                                >
                                    ⬅️ Go Back
                                </button>
                            )}
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => {
                                    console.log('Input changed:', e.target.value);
                                    setInputMessage(e.target.value);
                                }}
                                placeholder="Type your message..."
                                onKeyPress={(e) => {
                                    console.log('Key pressed:', e.key);
                                    if (e.key === 'Enter') {
                                        console.log('Enter pressed, sending message');
                                        handleSendMessage();
                                    }
                                }}
                                className="message-input"
                            />
                            <button 
                                onClick={() => {
                                    console.log('Send button clicked, inputMessage:', inputMessage);
                                    handleSendMessage();
                                }}
                                disabled={!inputMessage.trim()}
                                className="send-btn"
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <button 
                className="doctor-finder-toggle"
                onClick={toggleChatbot}
            >
                🏥
            </button>
        </div>
    );
};

export default DoctorFinder;

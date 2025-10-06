class MessageParser {
  constructor(actionProvider) {
    this.actionProvider = actionProvider;
  }

  parse(message) {
    const lowercase = message.toLowerCase();
    
    // Check if we're waiting for symptoms input - check both instance and state
    const instanceFlag = this.actionProvider?.awaitingSymptoms;
    const stateFlag = this.actionProvider?.stateRef?.current?.awaitingSymptoms;
    
    console.log('MessageParser - awaitingSymptoms:', instanceFlag);
    console.log('MessageParser - state awaitingSymptoms:', stateFlag);
    console.log('MessageParser - actionProvider exists:', !!this.actionProvider);
    console.log('MessageParser - stateRef exists:', !!this.actionProvider?.stateRef);
    
    // If either flag is true, route to symptoms input
    if (instanceFlag || stateFlag) {
      console.log('Routing to handleSymptomsInput - instance:', instanceFlag, 'state:', stateFlag);
      this.actionProvider.handleSymptomsInput(message);
      return;
    }
    
    // Additional check: if the message looks like symptoms, try to process it anyway
    const symptomKeywords = ['headache', 'dizziness', 'pain', 'fever', 'cough', 'rash', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'chest', 'heart', 'skin', 'eye', 'ear', 'nose', 'throat', 'stomach', 'back', 'joint', 'bone', 'anxiety', 'depression', 'stress', 'flu', 'infection'];
    const hasSymptomKeywords = symptomKeywords.some(keyword => lowercase.includes(keyword));
    
    if (hasSymptomKeywords) {
      console.log('Message contains symptom keywords, routing to handleSymptomsInput');
      this.actionProvider.handleSymptomsInput(message);
      return;
    }

    // Handle greetings first
    if (lowercase.includes('hi') || lowercase.includes('hello') || lowercase.includes('hey') || 
        lowercase.includes('hy') || lowercase.includes('hii') || lowercase.includes('good morning') ||
        lowercase.includes('good afternoon') || lowercase.includes('good evening') ||
        lowercase.includes('what\'s up') || lowercase.includes('whats up') || lowercase.includes('yo')) {
      this.actionProvider.handleGreeting();
    }
    // Handle button clicks and direct commands
    else if (lowercase.includes('book appointment') || lowercase.includes('book') || lowercase.includes('appointment')) {
      this.actionProvider.handleButtonClick('Book appointment');

    } else if (lowercase.includes('view booking') || lowercase.includes('my booking') || lowercase.includes('appointments')) {
      this.actionProvider.handleButtonClick('View my bookings');

    } else if (lowercase.includes('find doctor') || lowercase.includes('doctor') || lowercase.includes('specialist')) {
      this.actionProvider.handleButtonClick('Find a doctor');

    } else if (lowercase.includes('medicine') || lowercase.includes('medication') || lowercase.includes('drug')) {
      this.actionProvider.handleButtonClick('Medicine recommendation');

    } else if (lowercase.includes('track delivery') || lowercase.includes('delivery') || lowercase.includes('tracking')) {
      this.actionProvider.handleButtonClick('Track delivery');

    } else if (lowercase.includes('booking steps') || lowercase.includes('how to book') || lowercase.includes('step by step')) {
      this.actionProvider.handleBookingSteps();

    } else if (lowercase.includes('no') || lowercase.includes('nope') || lowercase.includes('not') || lowercase.includes('nothing')) {
      this.actionProvider.handleBookingHelpResponse(message);

    } else if (lowercase.includes('yes') || lowercase.includes('help') || lowercase.includes('assist')) {
      this.actionProvider.handleBookingHelpResponse(message);

    } else if (lowercase.includes('more help') || lowercase.includes('need more') || lowercase.includes('anything else')) {
      this.actionProvider.handleHelpOptions(message);

    } else if (lowercase.includes('reschedule') || lowercase.includes('cancel') || lowercase.includes('change appointment')) {
      this.actionProvider.handleRescheduleRestrictions();
      
    } else {
      // Send any other message to Dialogflow
      this.actionProvider.handleDialogflowResponse(message);
    }
  }
}

export default MessageParser;

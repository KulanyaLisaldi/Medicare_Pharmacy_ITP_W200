class MessageParser {
  constructor(actionProvider) {
    this.actionProvider = actionProvider;
  }

  parse(message) {
    const lowercase = message.toLowerCase();
    
    // Check if we're waiting for order number input
    const awaitingOrderNumber = this.actionProvider?.awaitingOrderNumber;
    const stateAwaitingOrderNumber = this.actionProvider?.stateRef?.current?.awaitingOrderNumber;
    
    console.log('MessageParser - awaitingOrderNumber:', awaitingOrderNumber);
    console.log('MessageParser - state awaitingOrderNumber:', stateAwaitingOrderNumber);
    console.log('MessageParser - actionProvider exists:', !!this.actionProvider);
    console.log('MessageParser - stateRef exists:', !!this.actionProvider?.stateRef);
    
    // If either flag is true, route to order number input
    if (awaitingOrderNumber || stateAwaitingOrderNumber) {
      console.log('Routing to handleOrderNumberInput with:', message);
      this.actionProvider.handleOrderNumberInput(message);
      return;
    }
    
    // Additional check: if the message looks like an order number, try to process it anyway
    const orderNumberPattern = /^#?[a-f0-9]{8,}$/i; // Matches order numbers like #4b7fe266 or 4b7fe266
    const looksLikeOrderNumber = orderNumberPattern.test(message.trim());
    
    if (looksLikeOrderNumber) {
      console.log('Message looks like order number, routing to handleOrderNumberInput');
      this.actionProvider.handleOrderNumberInput(message);
      return;
    }
    
    // Check if user wants to see detailed order information
    if (lowercase.includes('yes') && this.actionProvider?.stateRef?.current?.currentOrderDetails) {
      this.actionProvider.showDetailedOrderInfo();
      return;
    }
    
    if (lowercase.includes('no') && this.actionProvider?.stateRef?.current?.currentOrderDetails) {
      this.actionProvider.handleThankYouMessage();
      return;
    }
    
    // Route describe symptoms command to the selector

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

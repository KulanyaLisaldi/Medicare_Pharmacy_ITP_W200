import React, { useState } from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import config from './config.jsx';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';
import './DialogflowChatbot.css';

const DialogflowChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  if (!isOpen) {
    return (
      <div className="dialogflow-chatbot-widget">
        <button 
          className="chatbot-toggle"
          onClick={toggleChatbot}
        >
          🩺
        </button>
      </div>
    );
  }

  return (
    <div className="dialogflow-chatbot-widget">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <h3>.Medicare Assistant</h3>
          <button 
            className="close-btn"
            onClick={toggleChatbot}
          >
            ×
          </button>
        </div>
        <div className="chatbot-body">
          <Chatbot
            config={config}
            messageParser={MessageParser}
            actionProvider={ActionProvider}
          />
        </div>
      </div>
    </div>
  );
};

export default DialogflowChatbot;

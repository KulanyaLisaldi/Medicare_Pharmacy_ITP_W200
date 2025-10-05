import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

// Test script to create sample messages for testing
const createTestMessages = async () => {
    try {
        await connectDB();
        
        // Find a doctor and a patient
        const doctor = await User.findOne({ role: 'doctor' });
        const patient = await User.findOne({ role: 'patient' });
        
        if (!doctor || !patient) {
            console.log('No doctor or patient found. Please create users first.');
            return;
        }
        
        // Generate conversation ID
        const conversationId = [doctor._id.toString(), patient._id.toString()].sort().join('_');
        
        // Create sample messages
        const messages = [
            {
                senderId: patient._id,
                receiverId: doctor._id,
                message: "Hello Doctor, I have a question about my medication. Can you please help me?",
                conversationId,
                sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
                senderId: doctor._id,
                receiverId: patient._id,
                message: "Hello! Of course, I'd be happy to help you with your medication questions. What would you like to know?",
                conversationId,
                sentAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5 hours ago
            },
            {
                senderId: patient._id,
                receiverId: doctor._id,
                message: "I'm experiencing some side effects from the medication you prescribed. Should I continue taking it?",
                conversationId,
                sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
            },
            {
                senderId: patient._id,
                receiverId: doctor._id,
                message: "Also, I forgot to take my morning dose today. What should I do?",
                conversationId,
                sentAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
            }
        ];
        
        // Clear existing messages for this conversation
        await Message.deleteMany({ conversationId });
        
        // Create new messages
        const createdMessages = await Message.insertMany(messages);
        
        console.log(`Created ${createdMessages.length} test messages for conversation between ${patient.firstName} ${patient.lastName} and ${doctor.firstName} ${doctor.lastName}`);
        console.log('Conversation ID:', conversationId);
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating test messages:', error);
        process.exit(1);
    }
};

createTestMessages();

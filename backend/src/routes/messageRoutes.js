import express from 'express';
import {
    sendMessage,
    getDoctorMessages,
    getConversationMessages,
    replyToMessage,
    markMessagesAsSeen,
    getUnreadCount
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Send a message
router.post('/send', authenticateToken, sendMessage);

// Get doctor's conversations (list of patients with messages)
router.get('/doctor/conversations', authenticateToken, getDoctorMessages);

// Get messages in a specific conversation
router.get('/conversation/:conversationId', authenticateToken, getConversationMessages);

// Reply to a message
router.post('/reply', authenticateToken, replyToMessage);

// Mark messages as seen
router.patch('/conversation/:conversationId/seen', authenticateToken, markMessagesAsSeen);

// Get unread message count
router.get('/unread-count', authenticateToken, getUnreadCount);

export default router;

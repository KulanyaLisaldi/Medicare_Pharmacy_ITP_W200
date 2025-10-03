import express from 'express';
import {
    sendMessage,
    getDoctorMessages,
    getConversationMessages,
    replyToMessage,
    markMessagesAsSeen,
    getUnreadCount,
    getCustomerConversations
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMessageFile } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Send a message with optional file upload
router.post('/send', authenticateToken, uploadMessageFile.single('document'), sendMessage);

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

// Get customer conversations (for patient side)
router.get('/customer/conversations', authenticateToken, getCustomerConversations);

export default router;

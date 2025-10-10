import express from 'express';
import {
    sendMessage,
    sendContactMessageToAdmin,
    getDoctorMessages,
    getConversationMessages,
    replyToMessage,
    markMessagesAsSeen,
    getUnreadCount,
    getCustomerConversations,
    deleteMessage
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMessageFile } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Send a message with optional file upload
router.post('/send', authenticateToken, uploadMessageFile.single('document'), sendMessage);

// Send Contact Us message to admin
router.post('/contact', authenticateToken, sendContactMessageToAdmin);

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

// Delete a message
router.delete('/:messageId', authenticateToken, deleteMessage);

export default router;

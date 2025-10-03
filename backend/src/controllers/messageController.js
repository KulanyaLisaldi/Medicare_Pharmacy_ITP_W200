import Message from '../models/Message.js';
import User from '../models/User.js';

// Generate conversation ID between two users
const generateConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
};

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const { receiverId, message, appointmentId } = req.body;
        const senderId = req.userId;

        // Validate required fields
        if (!receiverId || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Receiver ID and message are required' 
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ 
                success: false, 
                message: 'Receiver not found' 
            });
        }

        // Generate conversation ID
        const conversationId = generateConversationId(senderId, receiverId);

        // Handle file upload if present
        let documentPath = null;
        if (req.file) {
            documentPath = `/uploads/messages/${req.file.filename}`;
        }

        // Create message
        const newMessage = await Message.create({
            senderId,
            receiverId,
            message: message.trim(),
            conversationId,
            appointmentId: appointmentId || null,
            documentPath: documentPath
        });

        // Populate sender information
        await newMessage.populate('senderId', 'firstName lastName email role');

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: newMessage
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

// Get messages for a doctor (conversations with patients)
export const getDoctorMessages = async (req, res) => {
    try {
        const doctorId = req.userId;
        const { page = 1, limit = 20 } = req.query;

        // Get all conversations where doctor is either sender or receiver
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: doctorId },
                        { receiverId: doctorId }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'senderId',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'receiverId',
                    foreignField: '_id',
                    as: 'receiver'
                }
            },
            {
                $unwind: '$sender'
            },
            {
                $unwind: '$receiver'
            },
            {
                $addFields: {
                    otherUser: {
                        $cond: {
                            if: { $eq: [{ $toString: '$senderId' }, { $toString: doctorId }] },
                            then: '$receiver',
                            else: '$sender'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$conversationId',
                    lastMessage: { $last: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { 
                                    $and: [
                                        { $eq: [{ $toString: '$receiverId' }, { $toString: doctorId }] },
                                        { $eq: ['$seen', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalMessages: { $sum: 1 }
                }
            },
            {
                $sort: { 'lastMessage.sentAt': -1 }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: parseInt(limit)
            }
        ]);

        res.json({
            success: true,
            data: conversations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching doctor messages:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

// Get messages in a specific conversation
export const getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const doctorId = req.userId;
        const { page = 1, limit = 50 } = req.query;

        // Verify doctor is part of this conversation
        const conversation = await Message.findOne({
            conversationId,
            $or: [
                { senderId: doctorId },
                { receiverId: doctorId }
            ]
        });

        if (!conversation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Conversation not found' 
            });
        }

        // Get messages in conversation
        const messages = await Message.find({ conversationId })
            .populate('senderId', 'firstName lastName email role')
            .populate('receiverId', 'firstName lastName email role')
            .sort({ sentAt: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Mark messages as seen for the doctor
        await Message.updateMany(
            { 
                conversationId, 
                receiverId: doctorId, 
                seen: false 
            },
            { seen: true }
        );

        res.json({
            success: true,
            data: messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching conversation messages:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

// Reply to a message (doctor reply)
export const replyToMessage = async (req, res) => {
    try {
        const { conversationId, message } = req.body;
        const doctorId = req.userId;

        if (!conversationId || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Conversation ID and message are required' 
            });
        }

        // Find the conversation to get the other participant
        const lastMessage = await Message.findOne({ conversationId })
            .sort({ sentAt: -1 });

        if (!lastMessage) {
            return res.status(404).json({ 
                success: false, 
                message: 'Conversation not found' 
            });
        }

        // Determine the receiver (the other participant)
        const receiverId = lastMessage.senderId.toString() === doctorId 
            ? lastMessage.receiverId 
            : lastMessage.senderId;

        // Create reply message
        const replyMessage = await Message.create({
            senderId: doctorId,
            receiverId,
            message: message.trim(),
            conversationId
        });

        // Populate sender information
        await replyMessage.populate('senderId', 'firstName lastName email role');

        res.status(201).json({
            success: true,
            message: 'Reply sent successfully',
            data: replyMessage
        });

    } catch (error) {
        console.error('Error replying to message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

// Mark messages as seen
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const doctorId = req.userId;

        await Message.updateMany(
            { 
                conversationId, 
                receiverId: doctorId, 
                seen: false 
            },
            { seen: true }
        );

        res.json({
            success: true,
            message: 'Messages marked as seen'
        });

    } catch (error) {
        console.error('Error marking messages as seen:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

// Get unread message count for doctor
export const getUnreadCount = async (req, res) => {
    try {
        const doctorId = req.userId;

        const unreadCount = await Message.countDocuments({
            receiverId: doctorId,
            seen: false
        });

        res.json({
            success: true,
            data: { unreadCount }
        });

    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

// Get customer conversations (for patient side)
export const getCustomerConversations = async (req, res) => {
    try {
        const customerId = req.userId;

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: customerId },
                        { receiverId: customerId }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'senderId',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'receiverId',
                    foreignField: '_id',
                    as: 'receiver'
                }
            },
            {
                $unwind: '$sender'
            },
            {
                $unwind: '$receiver'
            },
            {
                $addFields: {
                    otherUser: {
                        $cond: {
                            if: { $eq: [{ $toString: '$senderId' }, { $toString: customerId }] },
                            then: '$receiver',
                            else: '$sender'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$conversationId',
                    lastMessage: { $last: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { 
                                    $and: [
                                        { $eq: [{ $toString: '$receiverId' }, { $toString: customerId }] },
                                        { $eq: ['$seen', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalMessages: { $sum: 1 }
                }
            },
            {
                $sort: { 'lastMessage.sentAt': -1 }
            }
        ]);

        res.json(conversations);

    } catch (error) {
        console.error('Error fetching customer conversations:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

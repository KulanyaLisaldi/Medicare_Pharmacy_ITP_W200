import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

dotenv.config();

const testConversations = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB for conversation test...');

        // Find customer
        const customer = await User.findOne({ role: 'customer' });
        console.log('Customer:', customer.firstName, customer.lastName, customer._id);

        // Test customer conversations aggregation
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: customer._id },
                        { receiverId: customer._id }
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
                            if: { $eq: [{ $toString: '$senderId' }, { $toString: customer._id }] },
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
                                        { $eq: [{ $toString: '$receiverId' }, { $toString: customer._id }] },
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

        console.log('\nCustomer conversations found:', conversations.length);
        conversations.forEach((conv, i) => {
            console.log(`\nConversation ${i + 1}:`);
            console.log('- ID:', conv._id);
            console.log('- Other User:', conv.otherUser?.firstName, conv.otherUser?.lastName);
            console.log('- Last Message:', conv.lastMessage?.message);
            console.log('- Unread Count:', conv.unreadCount);
            console.log('- Total Messages:', conv.totalMessages);
        });

        // Test doctor conversations
        const doctor = await User.findOne({ role: 'doctor' });
        console.log('\nDoctor:', doctor.firstName, doctor.lastName, doctor._id);

        const doctorConversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: doctor._id },
                        { receiverId: doctor._id }
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
                            if: { $eq: [{ $toString: '$senderId' }, { $toString: doctor._id }] },
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
                                        { $eq: [{ $toString: '$receiverId' }, { $toString: doctor._id }] },
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

        console.log('\nDoctor conversations found:', doctorConversations.length);
        doctorConversations.forEach((conv, i) => {
            console.log(`\nDoctor Conversation ${i + 1}:`);
            console.log('- ID:', conv._id);
            console.log('- Other User:', conv.otherUser?.firstName, conv.otherUser?.lastName);
            console.log('- Last Message:', conv.lastMessage?.message);
            console.log('- Unread Count:', conv.unreadCount);
            console.log('- Total Messages:', conv.totalMessages);
        });

    } catch (error) {
        console.error('Error in conversation test:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
    }
};

testConversations();

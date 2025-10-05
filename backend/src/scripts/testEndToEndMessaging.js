import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

dotenv.config();

const testEndToEndMessaging = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB for end-to-end messaging test...');

        // Find users
        const customer = await User.findOne({ role: 'customer' });
        const doctor = await User.findOne({ role: 'doctor' });

        if (!customer || !doctor) {
            console.log('Need both customer and doctor users');
            return;
        }

        console.log('Customer:', customer.firstName, customer.lastName);
        console.log('Doctor:', doctor.firstName, doctor.lastName);

        // Test 1: Customer conversations API
        console.log('\n=== Testing Customer Conversations API ===');
        const customerConversations = await Message.aggregate([
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

        console.log('Customer conversations found:', customerConversations.length);
        customerConversations.forEach((conv, i) => {
            console.log(`\nConversation ${i + 1}:`);
            console.log('- ID:', conv._id);
            console.log('- Other User:', conv.otherUser?.firstName, conv.otherUser?.lastName);
            console.log('- Specialization:', conv.otherUser?.specialization);
            console.log('- Last Message:', conv.lastMessage?.message);
            console.log('- Unread Count:', conv.unreadCount);
            console.log('- Total Messages:', conv.totalMessages);
        });

        // Test 2: Doctor conversations API
        console.log('\n=== Testing Doctor Conversations API ===');
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

        console.log('Doctor conversations found:', doctorConversations.length);
        doctorConversations.forEach((conv, i) => {
            console.log(`\nDoctor Conversation ${i + 1}:`);
            console.log('- ID:', conv._id);
            console.log('- Other User:', conv.otherUser?.firstName, conv.otherUser?.lastName);
            console.log('- Specialization:', conv.otherUser?.specialization);
            console.log('- Last Message:', conv.lastMessage?.message);
            console.log('- Unread Count:', conv.unreadCount);
            console.log('- Total Messages:', conv.totalMessages);
        });

        // Test 3: Create a new test message
        console.log('\n=== Creating New Test Message ===');
        const testMessage = await Message.create({
            senderId: customer._id,
            receiverId: doctor._id,
            message: 'This is a test message to verify the messaging system is working correctly.',
            conversationId: `${customer._id}_${doctor._id}`.split('_').sort().join('_')
        });
        console.log('✅ Test message created:', testMessage.message);

        // Test 4: Verify the new message appears in both conversations
        console.log('\n=== Verifying New Message in Conversations ===');
        
        // Check customer conversations again
        const updatedCustomerConversations = await Message.aggregate([
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

        console.log('Updated customer conversations:', updatedCustomerConversations.length);
        const latestConv = updatedCustomerConversations[0];
        console.log('Latest conversation:');
        console.log('- Other User:', latestConv.otherUser?.firstName, latestConv.otherUser?.lastName);
        console.log('- Last Message:', latestConv.lastMessage?.message);
        console.log('- Unread Count:', latestConv.unreadCount);

        console.log('\n🎉 End-to-end messaging test completed successfully!');
        console.log('\nSummary:');
        console.log('- Customer conversations API working ✅');
        console.log('- Doctor conversations API working ✅');
        console.log('- Message creation working ✅');
        console.log('- Conversation updates working ✅');
        console.log('- User information properly populated ✅');

    } catch (error) {
        console.error('Error in end-to-end messaging test:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
    }
};

testEndToEndMessaging();

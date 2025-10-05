import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

dotenv.config();

const debugConversations2 = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB for debug...');

        // Find customer
        const customer = await User.findOne({ role: 'customer' });
        console.log('Customer:', customer.firstName, customer.lastName);

        // Test the exact aggregation pipeline from the controller
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
                    },
                    debugInfo: {
                        senderIdString: { $toString: '$senderId' },
                        customerIdString: { $toString: customer._id },
                        senderIdEquals: { $eq: [{ $toString: '$senderId' }, { $toString: customer._id }] },
                        receiverIdString: { $toString: '$receiverId' },
                        receiverIdEquals: { $eq: [{ $toString: '$receiverId' }, { $toString: customer._id }] }
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
            },
            {
                $limit: 1
            }
        ]);

        console.log('\nDebug conversation result:');
        console.log(JSON.stringify(conversations[0], null, 2));

    } catch (error) {
        console.error('Error in debug:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
    }
};

debugConversations2();

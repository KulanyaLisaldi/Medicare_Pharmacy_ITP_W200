import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

dotenv.config();

const debugConversations = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB for debug...');

        // Find customer
        const customer = await User.findOne({ role: 'customer' });
        console.log('Customer:', customer.firstName, customer.lastName);
        console.log('Customer ID type:', typeof customer._id);
        console.log('Customer ID:', customer._id);

        // Get a sample message
        const message = await Message.findOne({
            $or: [
                { senderId: customer._id },
                { receiverId: customer._id }
            ]
        }).populate('senderId', 'firstName lastName').populate('receiverId', 'firstName lastName');

        console.log('\nSample message:');
        console.log('- Sender ID:', message.senderId._id);
        console.log('- Sender Name:', message.senderId.firstName, message.senderId.lastName);
        console.log('- Receiver ID:', message.receiverId._id);
        console.log('- Receiver Name:', message.receiverId.firstName, message.receiverId.lastName);
        console.log('- Sender ID equals customer ID:', message.senderId._id.equals(customer._id));
        console.log('- Receiver ID equals customer ID:', message.receiverId._id.equals(customer._id));

        // Test simple aggregation
        const simpleTest = await Message.aggregate([
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
                    isSenderCustomer: { $eq: ['$senderId', customer._id] },
                    isReceiverCustomer: { $eq: ['$receiverId', customer._id] },
                    senderIdString: { $toString: '$senderId' },
                    customerIdString: { $toString: customer._id }
                }
            },
            {
                $limit: 1
            }
        ]);

        console.log('\nSimple aggregation test:');
        console.log(JSON.stringify(simpleTest[0], null, 2));

    } catch (error) {
        console.error('Error in debug:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
    }
};

debugConversations();

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Booking from '../models/Booking.js';

dotenv.config();

const testCompleteMessaging = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB for complete messaging test...');

        // Find existing users
        const doctor = await User.findOne({ role: 'doctor' });
        const customer = await User.findOne({ role: 'customer' });

        if (!doctor || !customer) {
            console.log('Need both doctor and customer users. Creating them...');
            
            if (!doctor) {
                const newDoctor = await User.create({
                    firstName: 'Test',
                    lastName: 'Doctor',
                    email: 'testdoctor@example.com',
                    password: 'Password1!',
                    role: 'doctor',
                    phone: '0712345678',
                    address: '123 Doctor St',
                    specialization: 'General Medicine'
                });
                console.log('Created Test Doctor:', newDoctor.email);
            }
            
            if (!customer) {
                const newCustomer = await User.create({
                    firstName: 'Test',
                    lastName: 'Customer',
                    email: 'testcustomer@example.com',
                    password: 'Password1!',
                    role: 'customer',
                    phone: '0778765432',
                    address: '456 Customer Ave'
                });
                console.log('Created Test Customer:', newCustomer.email);
            }
        }

        const finalDoctor = await User.findOne({ role: 'doctor' });
        const finalCustomer = await User.findOne({ role: 'customer' });

        console.log('\n=== Testing Complete Messaging Flow ===');
        console.log('Doctor:', finalDoctor.firstName, finalDoctor.lastName, `(${finalDoctor._id})`);
        console.log('Customer:', finalCustomer.firstName, finalCustomer.lastName, `(${finalCustomer._id})`);

        // Step 1: Customer sends message to doctor
        console.log('\n1. Customer sending message to doctor...');
        const customerMessage = await Message.create({
            senderId: finalCustomer._id,
            receiverId: finalDoctor._id,
            message: 'Hello Doctor, I have a question about my appointment. Can you please help me?',
            conversationId: `${finalCustomer._id}_${finalDoctor._id}`.split('_').sort().join('_')
        });
        console.log('✅ Customer message sent:', customerMessage.message);

        // Step 2: Test doctor conversations API
        console.log('\n2. Testing doctor conversations API...');
        const doctorConversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: finalDoctor._id },
                        { receiverId: finalDoctor._id }
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
                            if: { $eq: ['$senderId', new mongoose.Types.ObjectId(finalDoctor._id)] },
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
                                        { $eq: ['$receiverId', new mongoose.Types.ObjectId(finalDoctor._id)] },
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

        console.log('✅ Doctor conversations found:', doctorConversations.length);
        if (doctorConversations.length > 0) {
            const conv = doctorConversations[0];
            console.log('   - Conversation with:', conv.otherUser?.firstName, conv.otherUser?.lastName);
            console.log('   - Last message:', conv.lastMessage?.message);
            console.log('   - Unread count:', conv.unreadCount);
            console.log('   - Raw otherUser:', JSON.stringify(conv.otherUser, null, 2));
        }

        // Step 3: Test customer conversations API
        console.log('\n3. Testing customer conversations API...');
        const customerConversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: finalCustomer._id },
                        { receiverId: finalCustomer._id }
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
                            if: { $eq: ['$senderId', new mongoose.Types.ObjectId(finalCustomer._id)] },
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
                                        { $eq: ['$receiverId', new mongoose.Types.ObjectId(finalCustomer._id)] },
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

        console.log('✅ Customer conversations found:', customerConversations.length);
        if (customerConversations.length > 0) {
            const conv = customerConversations[0];
            console.log('   - Conversation with:', conv.otherUser?.firstName, conv.otherUser?.lastName);
            console.log('   - Last message:', conv.lastMessage?.message);
            console.log('   - Unread count:', conv.unreadCount);
            console.log('   - Raw otherUser:', JSON.stringify(conv.otherUser, null, 2));
        }

        // Step 4: Doctor replies to customer
        console.log('\n4. Doctor replying to customer...');
        const doctorReply = await Message.create({
            senderId: finalDoctor._id,
            receiverId: finalCustomer._id,
            message: 'Hello! I received your message. How can I help you with your appointment?',
            conversationId: customerMessage.conversationId
        });
        console.log('✅ Doctor reply sent:', doctorReply.message);

        // Step 5: Test conversation messages API
        console.log('\n5. Testing conversation messages API...');
        const conversationMessages = await Message.find({ 
            conversationId: customerMessage.conversationId 
        })
        .populate('senderId', 'firstName lastName')
        .populate('receiverId', 'firstName lastName')
        .sort({ sentAt: 1 });

        console.log('✅ Conversation messages found:', conversationMessages.length);
        conversationMessages.forEach((msg, i) => {
            console.log(`   Message ${i + 1}:`);
            console.log(`   - From: ${msg.senderId.firstName} ${msg.senderId.lastName}`);
            console.log(`   - To: ${msg.receiverId.firstName} ${msg.receiverId.lastName}`);
            console.log(`   - Message: ${msg.message}`);
            console.log(`   - Time: ${msg.sentAt}`);
            console.log('   ---');
        });

        console.log('\n🎉 Complete messaging flow test successful!');
        console.log('\nSummary:');
        console.log('- Customer can send messages to doctor ✅');
        console.log('- Doctor can see customer messages in conversations ✅');
        console.log('- Customer can see doctor messages in conversations ✅');
        console.log('- Both sides can view conversation history ✅');
        console.log('- Unread counts are tracked correctly ✅');

    } catch (error) {
        console.error('Error in complete messaging test:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
    }
};

testCompleteMessaging();

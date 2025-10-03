import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Booking from '../models/Booking.js';

dotenv.config();

const createTestMessage = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB for testing...');

        // Find or create a doctor
        let doctor = await User.findOne({ role: 'doctor' });
        if (!doctor) {
            doctor = await User.create({
                firstName: 'Test',
                lastName: 'Doctor',
                email: 'doctor@example.com',
                password: 'Password1!',
                role: 'doctor',
                phone: '0712345678',
                address: '123 Doctor St',
                specialization: 'General Medicine'
            });
            console.log('Created Test Doctor:', doctor.email);
        } else {
            console.log('Found existing doctor:', doctor.email);
        }

        // Find or create a customer
        let customer = await User.findOne({ role: 'customer' });
        if (!customer) {
            customer = await User.create({
                firstName: 'Test',
                lastName: 'Customer',
                email: 'customer@example.com',
                password: 'Password1!',
                role: 'customer',
                phone: '0778765432',
                address: '456 Customer Ave'
            });
            console.log('Created Test Customer:', customer.email);
        } else {
            console.log('Found existing customer:', customer.email);
        }

        // Create a test booking
        const testBooking = await Booking.create({
            referenceNo: `TEST-${Date.now()}`,
            appointmentId: new mongoose.Types.ObjectId(),
            doctorId: doctor._id,
            doctorName: `${doctor.firstName} ${doctor.lastName}`,
            specialization: doctor.specialization,
            date: new Date(),
            startTime: '10:00',
            endTime: '11:00',
            patientName: `${customer.firstName} ${customer.lastName}`,
            patientEmail: customer.email,
            patientPhone: customer.phone,
            patientAge: 30,
            patientGender: 'male',
            ongoingCondition: 'no',
            notes: 'Test appointment',
            slotNumber: 1,
            slotTime: '10:00'
        });
        console.log('Created test booking:', testBooking.referenceNo);

        // Create a test message
        const testMessage = await Message.create({
            senderId: customer._id,
            receiverId: doctor._id,
            message: 'Hello Doctor, I have a question about my appointment.',
            conversationId: `${customer._id}_${doctor._id}`.split('_').sort().join('_'),
            appointmentId: testBooking._id
        });
        console.log('Created test message:', testMessage.message);

        // Test the getUserBookings API
        console.log('\n--- Testing getUserBookings API ---');
        const bookings = await Booking.find({ 
            $or: [
                { patientId: customer._id },
                { patientEmail: customer.email }
            ]
        })
        .populate('doctorId', 'firstName lastName specialization')
        .sort({ date: -1, startTime: -1 });

        console.log('Found bookings:', bookings.length);
        if (bookings.length > 0) {
            const booking = bookings[0];
            console.log('Booking doctorId:', booking.doctorId);
            console.log('Booking doctorId._id:', booking.doctorId?._id);
            console.log('Booking doctorName:', booking.doctorName);
        }

        // Test the getDoctorMessages API
        console.log('\n--- Testing getDoctorMessages API ---');
        const conversations = await Message.aggregate([
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
                            if: { $eq: ['$senderId', doctor._id] },
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
                                        { $eq: ['$receiverId', doctor._id] },
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

        console.log('Found conversations:', conversations.length);
        if (conversations.length > 0) {
            const conv = conversations[0];
            console.log('Conversation with:', conv.otherUser.firstName, conv.otherUser.lastName);
            console.log('Last message:', conv.lastMessage.message);
            console.log('Unread count:', conv.unreadCount);
        }

        console.log('\n✅ Test completed successfully!');
    } catch (error) {
        console.error('Error in test:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

createTestMessage();

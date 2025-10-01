import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Admin: create channel (appointment session)
export async function createChannel(req, res) {
    try {
        const { doctorId, title, specialization, location, date, startTime, endTime, capacity, price, paymentType, mode, notes, slotDuration } = req.body;

        const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
        if (!doctor) return res.status(400).json({ message: 'Invalid doctor' });

        const session = await Appointment.create({
            doctorId,
            title: title || 'Consultation',
            specialization: specialization || doctor.specialization || '',
            location: location || '',
            date,
            startTime,
            endTime,
            capacity: capacity ?? 10,
            price: price ?? 0,
            paymentType: paymentType || 'online',
            mode: mode || 'physical',
            notes: notes || '',
            slotDuration: slotDuration || 10
        });

        // Generate time slots automatically
        session.generateTimeSlots();
        await session.save();

        // Create notification for doctor about new appointment slots
        await Notification.create({
            userId: doctorId,
            type: 'slot_creation',
            title: 'New Appointment Slots Created',
            message: `Admin has created new appointment slots for you`,
            data: {
                appointmentId: session._id,
                title: session.title,
                date: session.date,
                startTime: session.startTime,
                endTime: session.endTime,
                slotCount: session.capacity,
                location: session.location || 'MediCare Clinic',
                specialization: session.specialization
            }
        });

        return res.status(201).json({ 
            message: 'Channel created successfully', 
            session: {
                ...session.toObject(),
                timeSlots: session.timeSlots
            }
        });
    } catch (error) {
        console.error('Error in createChannel', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Public: list sessions for a doctor
export async function listDoctorChannels(req, res) {
    try {
        const { doctorId } = req.params;
        const sessions = await Appointment.find({ doctorId, isActive: true })
            .sort({ date: 1, startTime: 1 });
        
        // Calculate actual booked count for each session from Booking collection
        const sessionsWithBookedCount = await Promise.all(sessions.map(async (session) => {
            const Booking = (await import('../models/Booking.js')).default;
            const actualBookedCount = await Booking.countDocuments({ 
                appointmentId: session._id 
            });
            
            return {
                ...session.toObject(),
                bookedCount: actualBookedCount,
                timeSlots: session.timeSlots // Include time slots for frontend
            };
        }));
        
        return res.status(200).json(sessionsWithBookedCount);
    } catch (error) {
        console.error('Error in listDoctorChannels', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin: list channels and update/cancel
export async function listChannels(req, res) {
    try {
        const sessions = await Appointment.find().populate({ path: 'doctorId', select: 'firstName lastName specialization' }).sort({ date: -1, startTime: -1 });
        
        // Calculate actual booked count for each session from Booking collection
        const sessionsWithBookedCount = await Promise.all(sessions.map(async (session) => {
            const Booking = (await import('../models/Booking.js')).default;
            const actualBookedCount = await Booking.countDocuments({ 
                appointmentId: session._id 
            });
            
            return {
                ...session.toObject(),
                bookedCount: actualBookedCount,
                timeSlots: session.timeSlots // Include time slots for frontend
            };
        }));
        
        return res.status(200).json(sessionsWithBookedCount);
    } catch (error) {
        console.error('Error in listChannels', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function updateChannel(req, res) {
    try {
        const { id } = req.params;
        const { title, specialization, location, date, startTime, endTime, capacity, price, paymentType, mode, notes, isActive, rescheduleReason } = req.body;
        const update = { title, specialization, location, date, startTime, endTime, capacity, price, paymentType, mode, notes, isActive };
        
        // Handle reschedule reason
        if (rescheduleReason) {
            update.rescheduleReason = rescheduleReason;
            update.rescheduledAt = new Date();
        }
        
        Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);
        const updated = await Appointment.findByIdAndUpdate(id, update, { new: true });
        if (!updated) return res.status(404).json({ message: 'Channel not found' });
        
        // If reschedule reason is provided, also update all bookings for this appointment
        if (rescheduleReason) {
            const Booking = (await import('../models/Booking.js')).default;
            const bookingUpdate = {
                rescheduleReason: rescheduleReason,
                rescheduledAt: new Date()
            };
            
            // Also update the date and time fields if they were provided
            if (date) bookingUpdate.date = date;
            if (startTime) bookingUpdate.startTime = startTime;
            if (endTime) bookingUpdate.endTime = endTime;
            
            await Booking.updateMany(
                { appointmentId: id },
                bookingUpdate
            );
        }
        
        return res.status(200).json({ message: 'Channel updated', session: updated });
    } catch (error) {
        console.error('Error in updateChannel', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function cancelChannel(req, res) {
    try {
        const { id } = req.params;
        const session = await Appointment.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!session) return res.status(404).json({ message: 'Channel not found' });
        
        // Import Booking model
        const Booking = (await import('../models/Booking.js')).default;
        
        // Get all bookings for this channel to notify users
        const bookings = await Booking.find({ appointmentId: id }).populate('patientId', 'firstName lastName email');
        
        // TODO: send notifications to booked patients in future enhancement
        // For now, we'll just return the count of affected bookings
        return res.status(200).json({ 
            message: 'Channel canceled', 
            session,
            affectedBookings: bookings.length,
            bookings: bookings.map(booking => ({
                id: booking._id,
                patientName: booking.patientName,
                patientEmail: booking.patientEmail,
                date: booking.date,
                startTime: booking.startTime
            }))
        });
    } catch (error) {
        console.error('Error in cancelChannel', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function deleteChannel(req, res) {
    try {
        const { id } = req.params;
        
        // First, check if the channel exists
        const session = await Appointment.findById(id);
        if (!session) return res.status(404).json({ message: 'Channel not found' });
        
        // Import Booking model
        const Booking = (await import('../models/Booking.js')).default;
        
        // Delete all bookings associated with this channel
        const deletedBookings = await Booking.deleteMany({ appointmentId: id });
        
        // Delete the channel itself
        await Appointment.findByIdAndDelete(id);
        
        return res.status(200).json({ 
            message: 'Channel and associated bookings deleted successfully',
            deletedBookingsCount: deletedBookings.deletedCount
        });
    } catch (error) {
        console.error('Error in deleteChannel', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}



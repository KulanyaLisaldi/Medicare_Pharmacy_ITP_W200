import Appointment from "../models/Appointment.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

// Public: create a booking for an appointment session
export async function createBooking(req, res) {
    try {
        const { 
            appointmentId, 
            patientName, 
            patientEmail, 
            patientPhone, 
            patientNIC,
            patientAge,
            patientGender,
            patientAddress,
            ongoingCondition,
            notes, 
            channel, 
            paymentStatus 
        } = req.body;

        const session = await Appointment.findById(appointmentId);
        if (!session || !session.isActive) return res.status(400).json({ message: 'Invalid or inactive session' });
        if (session.bookedCount >= session.capacity) return res.status(400).json({ message: 'Session is full' });

        const doctor = await User.findById(session.doctorId).select('firstName lastName specialization');

        // Get next available slot and assign appointment number
        const nextSlot = session.getNextAvailableSlot();
        if (!nextSlot) {
            return res.status(400).json({ message: 'No available slots' });
        }

        // Book the slot
        const bookedSlot = session.bookSlot(nextSlot.slotNumber, null);
        if (!bookedSlot) {
            return res.status(400).json({ message: 'Failed to book slot' });
        }

        // Generate appointment number based on slot number
        const appointmentNumber = `APT-${nextSlot.slotNumber.toString().padStart(3, '0')}`;

        const booking = await Booking.create({ 
            appointmentId,
            doctorId: session.doctorId,
            doctorName: doctor ? `${doctor.firstName} ${doctor.lastName}` : '',
            specialization: doctor?.specialization || '',
            date: session.date,
            startTime: bookedSlot.time, // Use the specific slot time
            endTime: bookedSlot.time, // Will be calculated based on slot duration
            patientName, 
            patientEmail, 
            patientPhone, 
            patientNIC,
            patientAge,
            patientGender,
            patientAddress,
            ongoingCondition,
            notes,
            status: 'pending',
            paymentStatus: paymentStatus || 'pending',
            channel: channel || 'online',
            slotNumber: bookedSlot.slotNumber
        });

        // Update the slot with booking reference
        bookedSlot.patientId = booking._id;
        await session.save();

        return res.status(201).json({ 
            message: 'Booked successfully', 
            booking: { ...booking.toObject(), appointmentNumber }
        });
    } catch (error) {
        console.error('Error in createBooking', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin: list bookings with optional timeframe/status filters
export async function listBookings(req, res) {
    try {
        const { from, to, status } = req.query;
        const query = {};
        if (status) query.status = status;
        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = new Date(from);
            if (to) query.date.$lte = new Date(to);
        }
        const bookings = await Booking.find(query).sort({ date: 1, startTime: 1 });
        return res.status(200).json(bookings);
    } catch (error) {
        console.error('Error in listBookings', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin: stats for today/week/month + status breakdown + upcoming
export async function bookingStats(_req, res) {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [today, week, month, statusAgg, upcoming] = await Promise.all([
            Booking.countDocuments({ createdAt: { $gte: startOfDay } }),
            Booking.countDocuments({ createdAt: { $gte: startOfWeek } }),
            Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Booking.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Booking.find({ date: { $gte: startOfDay } }).sort({ date: 1, startTime: 1 }).limit(5)
        ]);

        const statusCounts = statusAgg.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});
        return res.status(200).json({ today, week, month, statusCounts, upcoming });
    } catch (error) {
        console.error('Error in bookingStats', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// User: get their own bookings
export async function getUserBookings(req, res) {
    try {
        const userId = req.userId;
        console.log('getUserBookings - userId:', userId);
        
        if (!userId) {
            return res.status(401).json({ message: 'User ID not found in request' });
        }
        
        // Get user details to match by email as well
        const user = await User.findById(userId).select('email');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('getUserBookings - user email:', user.email);
        
        const bookings = await Booking.find({ 
            $or: [
                { patientId: userId },
                { patientEmail: user.email }
            ]
        })
        .populate('appointmentId', 'title specialization location mode')
        .sort({ date: -1, startTime: -1 });
        
        console.log('getUserBookings - found bookings:', bookings.length);
        
        return res.status(200).json(bookings);
    } catch (error) {
        console.error('Error in getUserBookings', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// User: cancel their own booking
export async function cancelUserBooking(req, res) {
    try {
        const { id } = req.params;
        const userId = req.userId;
        
        // Get user details to match by email as well
        const user = await User.findById(userId).select('email');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const booking = await Booking.findOne({ 
            _id: id,
            $or: [
                { patientId: userId },
                { patientEmail: user.email }
            ]
        });
        
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        // Check if booking can be cancelled (not completed, not already cancelled)
        if (booking.status === 'completed') {
            return res.status(400).json({ message: 'Cannot cancel completed appointment' });
        }
        
        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Appointment already cancelled' });
        }
        
        // Update booking status
        booking.status = 'cancelled';
        await booking.save();
        
        // Update appointment slot availability
        const appointment = await Appointment.findById(booking.appointmentId);
        if (appointment) {
            appointment.bookedCount = Math.max(0, appointment.bookedCount - 1);
            if (appointment.status === 'fully_booked') {
                appointment.status = 'active';
            }
            await appointment.save();
        }
        
        return res.status(200).json({ message: 'Appointment cancelled successfully', booking });
    } catch (error) {
        console.error('Error in cancelUserBooking', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin: reschedule booking (change doctor, date, time)
export async function rescheduleBooking(req, res) {
    try {
        const { id } = req.params;
        const { doctorId, date, startTime, endTime, status } = req.body;
        const update = {};
        if (doctorId) update.doctorId = doctorId;
        if (date) update.date = date;
        if (startTime) update.startTime = startTime;
        if (endTime) update.endTime = endTime;
        if (status) update.status = status;
        const updated = await Booking.findByIdAndUpdate(id, update, { new: true });
        if (!updated) return res.status(404).json({ message: 'Booking not found' });
        return res.status(200).json({ message: 'Updated', booking: updated });
    } catch (error) {
        console.error('Error in rescheduleBooking', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}



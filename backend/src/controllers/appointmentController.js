import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

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
        return res.status(200).json(sessions);
    } catch (error) {
        console.error('Error in listDoctorChannels', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin: list channels and update/cancel
export async function listChannels(req, res) {
    try {
        const sessions = await Appointment.find().populate({ path: 'doctorId', select: 'firstName lastName specialization' }).sort({ date: -1, startTime: -1 });
        return res.status(200).json(sessions);
    } catch (error) {
        console.error('Error in listChannels', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function updateChannel(req, res) {
    try {
        const { id } = req.params;
        const { title, specialization, location, date, startTime, endTime, capacity, price, paymentType, mode, notes, isActive } = req.body;
        const update = { title, specialization, location, date, startTime, endTime, capacity, price, paymentType, mode, notes, isActive };
        Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);
        const updated = await Appointment.findByIdAndUpdate(id, update, { new: true });
        if (!updated) return res.status(404).json({ message: 'Channel not found' });
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
        // TODO: send notifications to booked patients in future enhancement
        return res.status(200).json({ message: 'Channel canceled', session });
    } catch (error) {
        console.error('Error in cancelChannel', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function deleteChannel(req, res) {
    try {
        const { id } = req.params;
        const session = await Appointment.findByIdAndDelete(id);
        if (!session) return res.status(404).json({ message: 'Channel not found' });
        return res.status(200).json({ message: 'Channel deleted' });
    } catch (error) {
        console.error('Error in deleteChannel', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}



import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // Alternative field name
    role: { type: String, enum: ['customer','doctor','pharmacist','delivery_agent','admin'], index: true },
    type: { type: String, default: 'general' }, // notification type for categorization
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String, default: '' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    // Order-related fields
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    // Handover-related fields
    handoverReason: { type: String, default: '' },
    handoverDetails: { type: String, default: '' },
    // Appointment-related fields
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;



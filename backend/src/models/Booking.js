import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    referenceNo: { 
        type: String, unique: 
        true, required: true },

    appointmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Appointment', required: true },

    // snapshot of appointment data
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', required: true },

    doctorName: { 
        type: String, 
        default: '' },

    specialization: { 
        type: String, 
        default: '' },

    date: { 
        type: Date, 
        required: true },

    startTime: { 
        type: String, 
        required: true },

    endTime: { 
        type: String, 
        required: true },

    // patient info
    patientName: { 
        type: String, 
        required: true },

    patientEmail: { 
        type: String, 
        required: true },

    patientPhone: { 
        type: String, 
        required: true },

    patientAge: { 
        type: Number, 
        required: true },

    patientGender: { 
        type: String, enum: ['male', 'female', 'other'], 
        required: true },

    ongoingCondition: { 
        type: String, enum: ['yes', 'no'], 
        required: true },

    notes: { 
        type: String, 
        default: '' },

    documents: [{ 
        filename: String, 
        originalName: String, 
        path: String, 
        uploadedAt: { type: Date, default: Date.now }
    }],

    // statuses
    paymentStatus: { 
        type: String, enum: ['paid', 'cod', 'pending'], 
        default: 'pending' },

    channel: { 
        type: String, enum: ['online', 'walk_in', 'phone'], 
        default: 'online' },

    slotNumber: { 
        type: Number, 
        default: null }, // Slot number in the appointment session

    slotTime: { 
        type: String, 
        default: null }, // Actual time of the booked slot
    
    // reschedule fields
    rescheduleReason: { type: String, default: '' },
    rescheduledAt: { type: Date, default: null }
}, { timestamps: true });

bookingSchema.pre('validate', function(next) {
    if (!this.referenceNo) {
        const rand = Math.floor(Math.random() * 1e6).toString().padStart(6, '0');
        const ymd = new Date().toISOString().slice(0,10).replace(/-/g, '');
        this.referenceNo = `BK-${ymd}-${rand}`;
    }
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;



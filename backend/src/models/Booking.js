import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    referenceNo: { type: String, unique: true, required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    // snapshot of appointment data
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String, default: '' },
    specialization: { type: String, default: '' },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    // patient info
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    patientPhone: { type: String, required: true },
    patientNIC: { type: String, required: true },
    patientAge: { type: Number, required: true },
    patientGender: { type: String, enum: ['male', 'female', 'other'], required: true },
    patientAddress: { type: String, required: true },
    ongoingCondition: { type: String, enum: ['yes', 'no'], required: true },
    notes: { type: String, default: '' },

    // statuses
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'], default: 'pending' },
    paymentStatus: { type: String, enum: ['paid', 'cod', 'pending'], default: 'pending' },
    channel: { type: String, enum: ['online', 'walk_in', 'phone'], default: 'online' },
    slotNumber: { type: Number, default: null } // Slot number in the appointment session
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



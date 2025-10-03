import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    seen: {
        type: Boolean,
        default: false
    },
    // Optional: Add conversation thread support
    conversationId: {
        type: String,
        required: true
    },
    // Optional: Message type (text, image, file, etc.)
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    // Optional: Reference to appointment if message is related to one
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: false
    },
    // Optional: Document attachment path
    documentPath: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// Index for efficient querying
messageSchema.index({ conversationId: 1, sentAt: 1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ receiverId: 1, seen: 1 });

export default mongoose.model('Message', messageSchema);

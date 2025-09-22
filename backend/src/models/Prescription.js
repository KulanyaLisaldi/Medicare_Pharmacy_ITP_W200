import mongoose from 'mongoose';

const PrescriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    prescriptionFile: {
        type: String, // File path or URL
        required: true
    },
    originalFileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'online'],
        default: 'cod'
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['uploaded', 'under_review', 'verified', 'order_list_sent', 'approved', 'preparing', 'ready_for_delivery', 'delivered', 'rejected', 'cancelled'],
        default: 'uploaded'
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    pharmacistNotes: {
        type: String,
        trim: true,
        default: ''
    },
    prescriptionNumber: {
        type: String,
        unique: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    approvedAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    preparingAt: {
        type: Date
    },
    readyForDeliveryAt: {
        type: Date
    },
    orderList: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        productName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        totalPrice: {
            type: Number,
            required: true
        }
    }],
    orderListSentAt: {
        type: Date
    },
    customerConfirmedAt: {
        type: Date
    }
}, { timestamps: true });

// Generate prescription number before saving
PrescriptionSchema.pre('save', function(next) {
    if (this.isNew && !this.prescriptionNumber) {
        const timestamp = Date.now().toString().slice(-6);
        this.prescriptionNumber = `PRES-${timestamp}`;
    }
    next();
});

// Index for efficient queries
PrescriptionSchema.index({ user: 1, status: 1 });
PrescriptionSchema.index({ status: 1 });

export default mongoose.model('Prescription', PrescriptionSchema);

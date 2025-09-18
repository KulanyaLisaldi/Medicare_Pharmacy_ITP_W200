import mongoose from 'mongoose';

const DeliveryAssignmentSchema = new mongoose.Schema({
    order: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order', 
        required: true,
        index: true 
    },
    deliveryAgent: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true 
    },
    status: { 
        type: String, 
        enum: ['available', 'assigned', 'accepted', 'rejected', 'picked_up', 'delivered', 'failed'], 
        default: 'available' 
    },
    assignedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    failureReason: { type: String, default: '' },
    deliveryNotes: { type: String, default: '' },
    distance: { type: Number, default: 0 }, // in kilometers
    estimatedDeliveryTime: { type: Date, default: null },
    actualDeliveryTime: { type: Date, default: null }
}, { timestamps: true });

// Index for efficient queries
DeliveryAssignmentSchema.index({ order: 1, status: 1 });
DeliveryAssignmentSchema.index({ deliveryAgent: 1, status: 1 });

export default mongoose.model('DeliveryAssignment', DeliveryAssignmentSchema);

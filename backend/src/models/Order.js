import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
    outOfStock: { type: Boolean, default: false },
    alternativeSuggestion: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [OrderItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
    deliveryType: { type: String, enum: ['pickup', 'home_delivery'], default: 'home_delivery' },
    status: { type: String, enum: ['pending', 'approved', 'processing', 'ready', 'out_for_delivery', 'picked_up', 'delivered', 'completed', 'canceled', 'failed'], default: 'pending' },
    paymentStatus: { type: String, enum: ['paid', 'cod_pending', 'refunded'], default: 'cod_pending' },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      notes: { type: String },
    },
    pharmacistNotes: { type: String, default: '' },
    failureReason: { type: String, default: '' },
    deliveryTimeSlot: { type: String, default: '' },
    assignedDeliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deliveryAssignment: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAssignment', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Order', OrderSchema);



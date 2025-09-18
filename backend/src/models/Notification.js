import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    role: { type: String, enum: ['customer','doctor','pharmacist','delivery_agent','admin'], index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String, default: '' }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;



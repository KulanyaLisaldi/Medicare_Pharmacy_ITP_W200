import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Object, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false } });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;



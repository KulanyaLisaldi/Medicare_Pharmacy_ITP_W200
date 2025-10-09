import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['customer', 'doctor', 'pharmacist', 'delivery_agent', 'admin'],
        default: 'customer'
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    profileImage: {
        type: String,
        default: ''
    },
    // Additional fields for different roles
    specialization: {
        type: String,
        default: '' // For doctors
    },
    licenseNumber: {
        type: String,
        default: '' // For doctors and pharmacists
    },
    experience: {
        type: Number,
        default: 0 // For doctors and pharmacists
    },
    vehicleNumber: {
        type: String,
        default: '' // For delivery agents
    },
    // Additional fields for doctors
    practicingGovernmentHospital: {
        type: String,
        default: '' // For doctors
    },
    achievements: {
        type: String,
        default: '' // For doctors
    },
    membership: {
        type: String,
        default: '' // For doctors
    },
    registrationNumber: {
        type: String,
        default: '' // For all staff members
    },
    otherSpecialization: {
        type: String,
        default: '' // For doctors
    },
    experienceYears: {
        type: Number,
        default: 0 // For doctors
    },
    specialNote: {
        type: String,
        default: '' // For doctors
    },
    // Email verification and password reset
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        default: null
    },
    verificationExpires: {
        type: Date,
        default: null
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    provider: {
        type: String,
        enum: [null, 'google', 'facebook'],
        default: null
    },
    providerId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without password)
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

const User = mongoose.model("User", userSchema);

export default User;
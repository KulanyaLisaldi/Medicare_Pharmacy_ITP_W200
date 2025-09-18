import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail, sendWelcomeEmail, sendStaffWelcomeEmail } from "../utils/mailer.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import AuditLog from "../models/AuditLog.js";

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '7d'
    });
};

// Refresh JWT Token (simple re-issue based on a valid current token)
export async function refreshToken(req, res) {
    try {
        // `authenticateToken` middleware has set req.userId if the token is valid
        const newToken = generateToken(req.userId);
        res.status(200).json({ token: newToken });
    } catch (error) {
        console.error("Error in refreshToken controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Logout (stateless JWT) - client should discard token
export async function logoutUser(_req, res) {
    try {
        return res.status(200).json({ message: "Logged out" });
    } catch (error) {
        console.error("Error in logoutUser controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// User Registration (Customer self-registration)
export async function registerCustomer(req, res) {
    try {
        const { firstName, lastName, email, password, address, phone } = req.body;

        // Check if user already exists (email or phone)
        const existingUser = await User.findOne({ $or: [ { email }, { phone } ] });
        if (existingUser) {
            const conflictField = existingUser.email === email ? 'email' : 'phone';
            return res.status(400).json({ message: `User with this ${conflictField} already exists` });
        }

        // Additional password policy enforcement (defense-in-depth)
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!]).{8,}$/;
        if (!strongPassword.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special (@,#,$,%,!)' });
        }

        // Create new customer
        const user = new User({
            firstName,
            lastName,
            email,
            password,
            address,
            phone,
            role: 'customer'
        });

        // Generate email verification token
        user.verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
        const savedUser = await user.save();

        // Send verification email
        try {
            await sendVerificationEmail(savedUser.email, `${firstName} ${lastName}`, user.verificationToken);
        } catch (e) {
            console.error('Error sending verification email', e);
        }

        res.status(201).json({
            message: "Account created successfully! Please check your email and click the verification link to activate your account.",
            user: savedUser.getPublicProfile(),
            requiresVerification: true
        });

    } catch (error) {
        console.error("Error in registerCustomer controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Admin creates staff members (doctors, pharmacists, delivery agents)
export async function createStaffMember(req, res) {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            password, 
            address, 
            phone, 
            role, 
            specialization, 
            licenseNumber, 
            experience, 
            vehicleNumber,
            practicingGovernmentHospital,
            achievements,
            membership,
            registrationNumber,
            otherSpecialization,
            experienceYears,
            specialNote
        } = req.body;

        // Check if user already exists (email or phone)
        const existingUser = await User.findOne({ $or: [ { email }, { phone } ] });
        if (existingUser) {
            const conflictField = existingUser.email === email ? 'email' : 'phone';
            return res.status(400).json({ message: `User with this ${conflictField} already exists` });
        }

        // Additional password policy enforcement (defense-in-depth)
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!]).{8,}$/;
        if (!strongPassword.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special (@,#,$,%,!)' });
        }

        // Validate role
        const validRoles = ['doctor', 'pharmacist', 'delivery_agent'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        // Create staff member
        const user = new User({
            firstName,
            lastName,
            email,
            password,
            address,
            phone,
            role,
            specialization: role === 'doctor' ? specialization : '',
            licenseNumber: ['doctor', 'pharmacist'].includes(role) ? licenseNumber : '',
            experience: ['doctor', 'pharmacist'].includes(role) ? (experience || experienceYears || 0) : 0,
            vehicleNumber: role === 'delivery_agent' ? vehicleNumber : '',
            // Additional fields for doctors
            practicingGovernmentHospital: role === 'doctor' ? practicingGovernmentHospital : '',
            achievements: role === 'doctor' ? achievements : '',
            membership: role === 'doctor' ? membership : '',
            registrationNumber: registrationNumber || '',
            otherSpecialization: role === 'doctor' ? otherSpecialization : '',
            experienceYears: role === 'doctor' ? experienceYears : 0,
            specialNote: role === 'doctor' ? specialNote : ''
        });

        // Generate email verification token
        user.verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
        
        const savedUser = await user.save();

        // Send verification email with better error handling
        let emailSent = false;
        try {
            await sendVerificationEmail(savedUser.email, `${firstName} ${lastName}`, user.verificationToken);
            emailSent = true;
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
        }

        // Create audit log for staff creation
        try {
            await AuditLog.create({ 
                userId: req.userId, 
                action: 'create_staff', 
                ip: req.ip, 
                userAgent: req.headers['user-agent'],
                metadata: { 
                    createdUserId: savedUser._id,
                    role: role,
                    email: email,
                    emailSent: emailSent
                }
            });
        } catch (auditError) {
            console.error('Warning: Could not create audit log:', auditError.message);
        }

        if (emailSent) {
            res.status(201).json({
                message: `${role} account created successfully! Verification email has been sent to ${email}.`,
                user: savedUser.getPublicProfile(),
                requiresVerification: true,
                emailSent: true
            });
        } else {
            // Account created but email failed - still return success but warn about email
            res.status(201).json({
                message: `${role} account created successfully! However, the verification email could not be sent to ${email}. Please contact the user directly or try resending the verification email.`,
                user: savedUser.getPublicProfile(),
                requiresVerification: true,
                emailSent: false,
                warning: "Verification email failed to send"
            });
        }

    } catch (error) {
        console.error("❌ Error in createStaffMember controller:", error);
        res.status(500).json({ message: "Internal server error while creating staff member" });
    }
};

// User Login
export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: "Account is deactivated" });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Enforce email verification
        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in" });
        }

        // Generate token
        const token = generateToken(user._id);

        await AuditLog.create({ userId: user._id, action: 'login', ip: req.ip, userAgent: req.headers['user-agent'] });
        res.status(200).json({
            message: "Login successful",
            user: user.getPublicProfile(),
            token
        });

    } catch (error) {
        console.error("Error in loginUser controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all users (Admin only)
export async function getAllUsers(req, res) {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        console.error("Error in getAllUsers controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get users by role
export async function getUsersByRole(req, res) {
    try {
        const { role } = req.params;
        const users = await User.find({ role }).select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        console.error("Error in getUsersByRole controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get user by ID
export async function getUserById(req, res) {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error in getUserById controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update user profile
export async function updateUserProfile(req, res) {
    try {
        const { firstName, lastName, address, phone, specialization, licenseNumber, experience, vehicleNumber } = req.body;
        const userId = req.params.id;

        const updateData = { firstName, lastName, address, phone };
        
        // Add role-specific fields
        if (specialization !== undefined) updateData.specialization = specialization;
        if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
        if (experience !== undefined) updateData.experience = experience;
        if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        await AuditLog.create({ userId: req.userId, action: 'profile_update', ip: req.ip, userAgent: req.headers['user-agent'], metadata: { fields: Object.keys(updateData) } });
        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error in updateUserProfile controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Admin updates any user
export async function adminUpdateUser(req, res) {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            address, 
            phone, 
            role, 
            isActive, 
            specialization, 
            licenseNumber, 
            experience, 
            vehicleNumber,
            practicingGovernmentHospital,
            achievements,
            membership,
            registrationNumber,
            otherSpecialization,
            experienceYears,
            specialNote
        } = req.body;
        const userId = req.params.id;

        const updateData = { firstName, lastName, email, address, phone, role, isActive };
        
        // Add role-specific fields
        if (specialization !== undefined) updateData.specialization = specialization;
        if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
        if (experience !== undefined) updateData.experience = experience;
        if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber;
        
        // Add doctor-specific fields
        if (practicingGovernmentHospital !== undefined) updateData.practicingGovernmentHospital = practicingGovernmentHospital;
        if (achievements !== undefined) updateData.achievements = achievements;
        if (membership !== undefined) updateData.membership = membership;
        if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
        if (otherSpecialization !== undefined) updateData.otherSpecialization = otherSpecialization;
        if (experienceYears !== undefined) updateData.experienceYears = experienceYears;
        if (specialNote !== undefined) updateData.specialNote = specialNote;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error in adminUpdateUser controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete user (Admin only)
export async function deleteUser(req, res) {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error in deleteUser controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Deactivate/Activate user (Admin only)
export async function toggleUserStatus(req, res) {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error("Error in toggleUserStatus controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get current user profile
export async function getCurrentUserProfile(req, res) {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error in getCurrentUserProfile controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Verify Email
export async function verifyEmail(req, res) {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ message: 'Verification token required' });

        // First, try to find user with valid verification token
        let user = await User.findOne({ verificationToken: token, verificationExpires: { $gt: new Date() } });
        
        // If not found, check if user is already verified (token was used before)
        if (!user) {
            user = await User.findOne({ verificationToken: token });
            if (user && user.isVerified) {
                return res.status(200).json({ 
                    message: 'Email already verified! You can now login to your account.',
                    alreadyVerified: true 
                });
            }
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.verificationToken = null;
        user.verificationExpires = null;
        await user.save();

        // Send welcome email after successful verification
        try {
            // For staff members, send the detailed staff welcome email
            if (['doctor', 'pharmacist', 'delivery_agent'].includes(user.role)) {
                const additionalInfo = {
                    specialization: user.specialization || '',
                    experienceYears: user.experienceYears || '',
                    practicingGovernmentHospital: user.practicingGovernmentHospital || '',
                    licenseNumber: user.licenseNumber || '',
                    experience: user.experience || '',
                    vehicleNumber: user.vehicleNumber || '',
                    registrationNumber: user.registrationNumber || ''
                };
                
                await sendStaffWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`, user.role, additionalInfo);
            } else {
                // For customers, send the regular welcome email
                await sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`, user.role);
            }
        } catch (e) {
            console.error('Error sending welcome email', e);
        }

        return res.status(200).json({ 
            message: 'Email verified successfully! Welcome email sent. You can now log in to your account.',
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Error in verifyEmail controller', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Resend verification email
export async function resendVerificationEmail(req, res) {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });
        const user = await User.findOne({ email });
        // Do not reveal user existence
        if (!user) return res.status(200).json({ message: 'If that email exists, a verification link was sent' });
        if (user.isVerified) return res.status(200).json({ message: 'Email already verified' });

        user.verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
        await user.save();
        try {
            await sendVerificationEmail(user.email, `${user.firstName} ${user.lastName}`, user.verificationToken);
        } catch (e) {
            console.error('Error sending verification email', e);
        }
        return res.status(200).json({ message: 'Verification email sent if the account exists' });
    } catch (error) {
        console.error('Error in resendVerificationEmail', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Public: List doctors (only public-safe fields)
export async function publicListDoctors(_req, res) {
    try {
        const doctors = await User.find({ role: 'doctor', isActive: true })
            .select('-password -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires -providerId');
        return res.status(200).json(doctors);
    } catch (error) {
        console.error('Error in publicListDoctors', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Public: Get doctor by id (only public-safe fields)
export async function publicGetDoctorById(req, res) {
    try {
        const { id } = req.params;
        const doctor = await User.findOne({ _id: id, role: 'doctor', isActive: true })
            .select('-password -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires -providerId');
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        return res.status(200).json(doctor);
    } catch (error) {
        console.error('Error in publicGetDoctorById', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Request password reset (send email with token)
export async function requestPasswordReset(req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            // Do not reveal user presence
            return res.status(200).json({ message: 'If that email exists, a reset link was sent' });
        }
        user.resetPasswordToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
        await user.save();
        try {
            await sendPasswordResetEmail(user.email, `${user.firstName} ${user.lastName}`, user.resetPasswordToken);
        } catch (e) {
            console.error('Error sending reset email', e);
        }
        return res.status(200).json({ message: 'If that email exists, a reset link was sent' });
    } catch (error) {
        console.error('Error in requestPasswordReset', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Reset password (using token)
export async function resetPassword(req, res) {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
        if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

        user.password = password; // will be hashed by pre-save hook
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        return res.status(200).json({ message: 'Password has been reset' });
    } catch (error) {
        console.error('Error in resetPassword', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Change password (authenticated user)
export async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const ok = await user.comparePassword(currentPassword);
        if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });

        user.password = newPassword; // pre-save hook hashes
        await user.save();
        await AuditLog.create({ userId: user._id, action: 'password_change', ip: req.ip, userAgent: req.headers['user-agent'] });
        return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error in changePassword', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin resend verification email to staff member
export async function adminResendVerificationEmail(req, res) {
    try {
        const { userId } = req.params;
        
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is already verified
        if (user.isVerified) {
            return res.status(400).json({ message: 'User is already verified' });
        }

        // Generate new verification token
        user.verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
        await user.save();

        console.log(`🔄 Admin resending verification email to: ${user.email}`);

        // Send verification email
        try {
            await sendVerificationEmail(user.email, `${user.firstName} ${user.lastName}`, user.verificationToken);
            
            // Create audit log
            await AuditLog.create({ 
                userId: req.userId, 
                action: 'admin_resend_verification', 
                ip: req.ip, 
                userAgent: req.headers['user-agent'],
                metadata: { 
                    targetUserId: user._id,
                    targetEmail: user.email,
                    targetRole: user.role
                }
            });

            console.log(`✅ Verification email resent successfully to: ${user.email}`);
            
            res.status(200).json({ 
                message: `Verification email has been resent to ${user.email}`,
                emailSent: true
            });
        } catch (emailError) {
            console.error('❌ Error sending verification email:', emailError);
            
            res.status(500).json({ 
                message: 'Failed to send verification email',
                error: emailError.message,
                emailSent: false
            });
        }

    } catch (error) {
        console.error('❌ Error in adminResendVerificationEmail:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Check if user has specific role
export const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (!user.isActive) {
                return res.status(403).json({ message: 'Account is deactivated' });
            }

            if (!roles.includes(user.role)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    };
};

// Admin only middleware
export const requireAdmin = requireRole(['admin']);

// Staff only middleware (doctors, pharmacists, delivery agents)
export const requireStaff = requireRole(['doctor', 'pharmacist', 'delivery_agent', 'admin']);

// Pharmacist or Admin middleware
export const requirePharmacist = requireRole(['pharmacist', 'admin']);

// Delivery Agent or Admin middleware
export const requireDeliveryAgent = requireRole(['delivery_agent', 'admin']);

// Customer only middleware
export const requireCustomer = requireRole(['customer']);

// Check if user can access their own resource or is admin
export const requireOwnershipOrAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        // Admin can access any resource
        if (user.role === 'admin') {
            req.user = user;
            return next();
        }

        // Users can only access their own resources
        if (req.params.id === req.userId) {
            req.user = user;
            return next();
        }

        return res.status(403).json({ message: 'Access denied' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

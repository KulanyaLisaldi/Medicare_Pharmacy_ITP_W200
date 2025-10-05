import express from 'express';
import { createBooking, listBookings, bookingStats, rescheduleBooking, getUserBookings, cancelUserBooking, deleteBooking, getDoctorStats, getDoctorBookings, getDoctorNotifications, markNotificationRead } from '../controllers/bookingController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { uploadBookingFiles } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public booking endpoint with file upload support
router.post('/', uploadBookingFiles.array('documents', 5), createBooking);

// User endpoints (authenticated users)
router.get('/user', authenticateToken, getUserBookings);
router.patch('/:id/cancel', authenticateToken, cancelUserBooking);

// Doctor endpoints (authenticated doctors)
router.get('/doctor/stats', authenticateToken, getDoctorStats);
router.get('/doctor/bookings', authenticateToken, getDoctorBookings);
router.get('/doctor/notifications', authenticateToken, getDoctorNotifications);
router.patch('/notifications/:notificationId/read', authenticateToken, markNotificationRead);

// Admin
router.use(authenticateToken, requireAdmin);
router.get('/', listBookings);
router.get('/stats', bookingStats);
router.patch('/:id', rescheduleBooking);
router.delete('/:id', deleteBooking);

export default router;



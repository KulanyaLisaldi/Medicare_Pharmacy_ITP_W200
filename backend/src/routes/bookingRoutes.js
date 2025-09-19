import express from 'express';
import { createBooking, listBookings, bookingStats, rescheduleBooking, getUserBookings, cancelUserBooking, deleteBooking } from '../controllers/bookingController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public booking endpoint
router.post('/', createBooking);

// User endpoints (authenticated users)
router.get('/user', authenticateToken, getUserBookings);
router.patch('/:id/cancel', authenticateToken, cancelUserBooking);

// Admin
router.use(authenticateToken, requireAdmin);
router.get('/', listBookings);
router.get('/stats', bookingStats);
router.patch('/:id', rescheduleBooking);
router.delete('/:id', deleteBooking);

export default router;



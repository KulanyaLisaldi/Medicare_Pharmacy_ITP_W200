import express from 'express';
import { createChannel, listDoctorChannels, listChannels, updateChannel, cancelChannel, deleteChannel } from '../controllers/appointmentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public
router.get('/doctor/:doctorId', listDoctorChannels);

// Admin
router.use(authenticateToken, requireAdmin);
router.post('/', createChannel);
router.get('/', listChannels);
router.patch('/:id', updateChannel);
router.post('/:id/cancel', cancelChannel);
router.delete('/:id', deleteChannel);

export default router;



import express from 'express';
import { trackOrder, testConnection } from '../controllers/orderTrackingController.js';

const router = express.Router();

// Test database connection
router.get('/test', testConnection);

// Track order by order number (public endpoint)
router.post('/track', trackOrder);

export default router;

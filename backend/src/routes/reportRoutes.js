import express from 'express';
import { 
    getPharmacyReports, 
    getStockAlerts, 
    getOrderAnalytics, 
    getInventoryHealth 
} from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get comprehensive pharmacy reports
router.get('/pharmacy', getPharmacyReports);

// Get stock alerts
router.get('/stock-alerts', getStockAlerts);

// Get order analytics
router.get('/order-analytics', getOrderAnalytics);

// Get inventory health
router.get('/inventory-health', getInventoryHealth);

export default router;

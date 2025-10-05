import express from 'express';
import { uploadPrescription, createPrescriptionOrder, getPrescriptionOrders, getCustomerPrescriptionOrders, sendProductListToCustomer, confirmPrescriptionOrder, fixPrescriptionFilePaths } from '../controllers/prescriptionController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Upload prescription file
router.post('/upload', authenticateToken, upload.single('prescriptionFile'), uploadPrescription);

// Create prescription order
router.post('/create-order', authenticateToken, createPrescriptionOrder);

// Get prescription orders for pharmacist
router.get('/pharmacist/orders', authenticateToken, getPrescriptionOrders);

// Get prescription orders for customer
router.get('/customer/orders', authenticateToken, getCustomerPrescriptionOrders);

// Send product list to customer for prescription order
router.post('/:orderId/order-list', authenticateToken, sendProductListToCustomer);

// Customer confirms or rejects prescription order
router.post('/:orderId/confirm', authenticateToken, confirmPrescriptionOrder);

// Fix prescription file paths for existing orders
router.post('/fix-file-paths', authenticateToken, fixPrescriptionFilePaths);

export default router;

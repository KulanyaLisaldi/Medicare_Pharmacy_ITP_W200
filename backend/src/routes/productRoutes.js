import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { listProducts, createProduct, updateProduct, deleteProduct, getProduct, uploadProductImage, checkLowStockAndSendReorderEmails, getReorderEmailLogs } from '../controllers/productController.js';
import { uploadProductImage as uploadMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public listing
router.get('/', listProducts);
router.get('/:id', getProduct);
// Authenticated modifications (pharmacist/admin)
router.post('/', authenticateToken, createProduct);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);
router.post('/upload-image', authenticateToken, uploadMiddleware.single('image'), uploadProductImage);

// Automated Reorder System Endpoints
router.post('/reorder/check', authenticateToken, checkLowStockAndSendReorderEmails);
router.get('/reorder/logs', authenticateToken, getReorderEmailLogs);

export default router;



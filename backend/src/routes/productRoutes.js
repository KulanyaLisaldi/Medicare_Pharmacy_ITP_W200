import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { listProducts, createProduct, updateProduct, deleteProduct, getProduct, uploadProductImage, triggerLowStockReorder, listReorderEmailLogs } from '../controllers/productController.js';
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
// Manual trigger for low-stock reorder emails (pharmacist/admin)
router.post('/reorder/check', authenticateToken, triggerLowStockReorder);
// List reorder email logs (pharmacist/admin)
router.get('/reorder/logs', authenticateToken, listReorderEmailLogs);

export default router;



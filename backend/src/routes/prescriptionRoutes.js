import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  createPrescription, 
  getUserPrescriptions, 
  getPrescriptionById, 
  updatePrescriptionStatus, 
  getAllPrescriptions, 
  downloadPrescriptionFile,
  getProductsForOrderList,
  createOrderList,
  confirmOrderList,
  updatePrescriptionWorkflow,
  upload
} from '../controllers/prescriptionController.js';

const router = express.Router();

// User routes (authenticated)
router.use(authenticateToken);

// Create prescription order
router.post('/', upload.single('prescriptionFile'), createPrescription);

// Get user's prescriptions
router.get('/user', getUserPrescriptions);

// Order list management (specific routes first)
router.get('/products', getProductsForOrderList);

// Admin/Pharmacist routes
router.get('/admin/all', getAllPrescriptions);

// Get prescription by ID
router.get('/:id', getPrescriptionById);

// Download prescription file
router.get('/:id/download', downloadPrescriptionFile);

// Update prescription status
router.patch('/:id/status', updatePrescriptionStatus);

// Update prescription workflow (for pharmacist)
router.patch('/:id/workflow', updatePrescriptionWorkflow);

// Order list management
router.post('/:prescriptionId/order-list', createOrderList);

// Customer order list confirmation
router.post('/:prescriptionId/confirm-order', confirmOrderList);

export default router;

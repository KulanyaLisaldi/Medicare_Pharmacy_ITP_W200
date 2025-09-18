import express from 'express';
import { authenticateToken, requireDeliveryAgent } from '../middleware/auth.js';
import { 
  getAvailableOrders, 
  getAssignedOrders, 
  acceptOrder, 
  rejectOrder, 
  updateDeliveryStatus, 
  getOrderDetails 
} from '../controllers/deliveryController.js';

const router = express.Router();

// All routes require delivery agent authentication
router.use(authenticateToken);
router.use(requireDeliveryAgent);

// Get available orders for assignment
router.get('/available', getAvailableOrders);

// Get assigned orders for the delivery agent
router.get('/assigned', getAssignedOrders);

// Accept an order assignment
router.post('/orders/:orderId/accept', acceptOrder);

// Reject an order assignment
router.post('/orders/:orderId/reject', rejectOrder);

// Update delivery status
router.patch('/assignments/:assignmentId/status', updateDeliveryStatus);

// Get order details
router.get('/orders/:orderId/details', getOrderDetails);

export default router;

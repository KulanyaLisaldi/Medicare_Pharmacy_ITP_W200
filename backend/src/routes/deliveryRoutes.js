import express from 'express';
import { authenticateToken, requireDeliveryAgent } from '../middleware/auth.js';
import { 
  getAvailableOrders, 
  getAssignedOrders, 
  acceptOrder, 
  rejectOrder, 
  updateDeliveryStatus, 
  getOrderDetails,
  getDeliveryStats,
  getRecentDeliveries,
  handoverOrder,
  acceptHandoverOrder,
  getAvailableDeliveryAgents,
  getDeliveryNotifications,
  markNotificationAsRead,
  deleteAssignment,
  getCompletedDeliveries
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

// Get delivery statistics for dashboard
router.get('/stats', getDeliveryStats);

// Get recent deliveries for dashboard
router.get('/recent', getRecentDeliveries);

// Handover an order to another delivery agent
router.post('/assignments/:assignmentId/handover', handoverOrder);

// Accept a handover order
router.post('/orders/:orderId/accept-handover', acceptHandoverOrder);

// Get available delivery agents for handover
router.get('/agents/available', getAvailableDeliveryAgents);

// Get notifications for delivery agent
router.get('/notifications', getDeliveryNotifications);

// Mark notification as read
router.patch('/notifications/:notificationId/read', markNotificationAsRead);

// Delete assignment (before picked up)
router.delete('/assignments/:assignmentId', deleteAssignment);

// Get completed delivery history
router.get('/completed', getCompletedDeliveries);

export default router;

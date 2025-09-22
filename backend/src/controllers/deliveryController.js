import DeliveryAssignment from '../models/DeliveryAssignment.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

// Get available orders for delivery agents
export const getAvailableOrders = async (req, res) => {
  try {
    const deliveryAgentId = req.userId;
    
    // Get orders that are ready for delivery and not yet assigned
    const availableOrders = await Order.find({
      status: 'out_for_delivery',
      deliveryType: 'home_delivery',
      assignedDeliveryAgent: null
    })
    .populate('user', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

    // Add distance calculation (mock for now - in real app, use geolocation)
    const ordersWithDistance = availableOrders.map(order => ({
      ...order.toObject(),
      distance: Math.random() * 10 + 1 // Mock distance 1-11 km
    }));

    return res.status(200).json(ordersWithDistance);
  } catch (err) {
    console.error('getAvailableOrders error:', err);
    return res.status(500).json({ message: 'Failed to fetch available orders' });
  }
};

// Get assigned orders for a specific delivery agent
export const getAssignedOrders = async (req, res) => {
  try {
    const deliveryAgentId = req.userId;
    
    const assignments = await DeliveryAssignment.find({
      deliveryAgent: deliveryAgentId,
      status: { $in: ['assigned', 'accepted', 'picked_up', 'delivered', 'failed'] }
    })
    .populate({
      path: 'order',
      populate: {
        path: 'user',
        select: 'firstName lastName email phone'
      }
    })
    .sort({ createdAt: -1 });

    return res.status(200).json(assignments);
  } catch (err) {
    console.error('getAssignedOrders error:', err);
    return res.status(500).json({ message: 'Failed to fetch assigned orders' });
  }
};

// Accept an order assignment
export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryAgentId = req.userId;

    // Check if order is still available
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.assignedDeliveryAgent) {
      return res.status(400).json({ message: 'Order is already assigned to another agent' });
    }

    if (order.status !== 'out_for_delivery') {
      return res.status(400).json({ message: 'Order is not ready for delivery' });
    }

    // Create delivery assignment
    const assignment = await DeliveryAssignment.create({
      order: orderId,
      deliveryAgent: deliveryAgentId,
      status: 'assigned',
      assignedAt: new Date(),
      acceptedAt: new Date()
    });

    // Update order with assigned agent
    order.assignedDeliveryAgent = deliveryAgentId;
    order.deliveryAssignment = assignment._id;
    await order.save();

    // Populate the response
    const populatedAssignment = await DeliveryAssignment.findById(assignment._id)
      .populate({
        path: 'order',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone'
        }
      })
      .populate('deliveryAgent', 'firstName lastName phone');

    return res.status(200).json({
      message: 'Order accepted successfully',
      assignment: populatedAssignment
    });
  } catch (err) {
    console.error('acceptOrder error:', err);
    return res.status(500).json({ message: 'Failed to accept order' });
  }
};

// Reject an order assignment
export const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryAgentId = req.userId;

    // Check if there's an existing assignment for this order and agent
    const assignment = await DeliveryAssignment.findOne({
      order: orderId,
      deliveryAgent: deliveryAgentId,
      status: 'assigned'
    });

    if (assignment) {
      assignment.status = 'rejected';
      assignment.failedAt = new Date();
      await assignment.save();
    }

    return res.status(200).json({ message: 'Order rejected successfully' });
  } catch (err) {
    console.error('rejectOrder error:', err);
    return res.status(500).json({ message: 'Failed to reject order' });
  }
};

// Update delivery status
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { status, deliveryNotes, failureReason } = req.body;
    const deliveryAgentId = req.userId;

    const assignment = await DeliveryAssignment.findOne({
      _id: assignmentId,
      deliveryAgent: deliveryAgentId
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Update assignment status
    assignment.status = status;
    if (deliveryNotes) assignment.deliveryNotes = deliveryNotes;
    if (failureReason) assignment.failureReason = failureReason;

    // Set timestamps based on status
    const now = new Date();
    switch (status) {
      case 'picked_up':
        assignment.pickedUpAt = now;
        break;
      case 'delivered':
        assignment.deliveredAt = now;
        assignment.actualDeliveryTime = now;
        break;
      case 'failed':
        assignment.failedAt = now;
        break;
    }

    await assignment.save();

    // Update order status
    const order = await Order.findById(assignment.order);
    if (order) {
      order.status = status;
      if (status === 'delivered') {
        order.status = 'completed';
      }
      await order.save();
    }

    // Populate the response
    const populatedAssignment = await DeliveryAssignment.findById(assignment._id)
      .populate({
        path: 'order',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone'
        }
      })
      .populate('deliveryAgent', 'firstName lastName phone');

    return res.status(200).json({
      message: 'Delivery status updated successfully',
      assignment: populatedAssignment
    });
  } catch (err) {
    console.error('updateDeliveryStatus error:', err);
    return res.status(500).json({ message: 'Failed to update delivery status' });
  }
};

// Get order details for delivery
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryAgentId = req.userId;

    const assignment = await DeliveryAssignment.findOne({
      order: orderId,
      deliveryAgent: deliveryAgentId
    })
    .populate({
      path: 'order',
      populate: {
        path: 'user',
        select: 'firstName lastName email phone'
      }
    })
    .populate('deliveryAgent', 'firstName lastName phone');

    if (!assignment) {
      return res.status(404).json({ message: 'Order assignment not found' });
    }

    // Fetch detailed product information for each item
    const Product = (await import('../models/Product.js')).default;
    
    // Process both items (regular orders) and orderList (prescription orders)
    const itemsToProcess = assignment.order.items || assignment.order.orderList || [];
    
    // For prescription orders, the items already have the correct structure
    // No need to fetch additional product details since they're already populated
    let itemsWithDetails = itemsToProcess;
    
    // Only fetch additional details for regular orders that need product enhancement
    if (assignment.order.orderType === 'product' && itemsToProcess.length > 0) {
      itemsWithDetails = await Promise.all(
        itemsToProcess.map(async (item) => {
          if (item.productId) {
            try {
              const product = await Product.findById(item.productId);
              if (product) {
                const enhancedItem = {
                  ...item.toObject(),
                  dosageForm: product.dosageForm,
                  strength: product.strength,
                  brand: product.brand,
                  description: product.description,
                  prescriptionRequired: product.prescriptionRequired
                };
                return enhancedItem;
              }
            } catch (error) {
              console.error('Error fetching product details:', error);
            }
          }
          return item;
        })
      );
    }

    // Update the assignment with detailed items
    const assignmentWithDetails = {
      ...assignment.toObject(),
      order: {
        ...assignment.order.toObject(),
        items: itemsWithDetails,
        orderList: itemsWithDetails // Also populate orderList for prescription orders
      }
    };

    // Force assign the items to ensure they're not empty
    if (assignment.order.orderType === 'prescription') {
      assignmentWithDetails.order.orderList = itemsWithDetails;
      assignmentWithDetails.order.items = itemsWithDetails;
    } else {
      assignmentWithDetails.order.items = itemsWithDetails;
      assignmentWithDetails.order.orderList = itemsWithDetails;
    }

    // Final check - ensure we have data
    if (itemsWithDetails.length === 0 && itemsToProcess.length > 0) {
      assignmentWithDetails.order.items = itemsToProcess;
      assignmentWithDetails.order.orderList = itemsToProcess;
    }
    return res.status(200).json(assignmentWithDetails);
  } catch (err) {
    console.error('getOrderDetails error:', err);
    return res.status(500).json({ message: 'Failed to fetch order details' });
  }
};

// Get delivery statistics for dashboard
export const getDeliveryStats = async (req, res) => {
  try {
    const deliveryAgentId = req.userId;
    
    // Get active deliveries count (accepted orders with picked_up status)
    const activeDeliveriesCount = await DeliveryAssignment.countDocuments({
      deliveryAgent: deliveryAgentId,
      status: 'picked_up'
    });

    // Get completed deliveries today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedTodayCount = await DeliveryAssignment.countDocuments({
      deliveryAgent: deliveryAgentId,
      status: 'delivered',
      deliveredAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Get pending assignments (assigned but not picked up yet)
    const pendingCount = await DeliveryAssignment.countDocuments({
      deliveryAgent: deliveryAgentId,
      status: { $in: ['assigned', 'accepted'] }
    });

    // Calculate today's earnings (mock calculation - you might want to implement actual earnings logic)
    const todayEarnings = completedTodayCount * 15; // Assuming Rs.15 per delivery

    return res.status(200).json({
      activeDeliveries: activeDeliveriesCount,
      completedToday: completedTodayCount,
      pending: pendingCount,
      todayEarnings: todayEarnings
    });
  } catch (err) {
    console.error('getDeliveryStats error:', err);
    return res.status(500).json({ message: 'Failed to fetch delivery statistics' });
  }
};

// Get recent assigned deliveries for dashboard
export const getRecentDeliveries = async (req, res) => {
  try {
    const deliveryAgentId = req.userId;
    
    // Get recent assignments (last 10) with populated order and user data
    const recentDeliveries = await DeliveryAssignment.find({
      deliveryAgent: deliveryAgentId,
      status: { $in: ['assigned', 'accepted', 'picked_up', 'delivered', 'failed'] }
    })
    .populate({
      path: 'order',
      populate: {
        path: 'user',
        select: 'firstName lastName phone'
      }
    })
    .sort({ createdAt: -1 })
    .limit(10);

    // Format the response with relevant information
    const formattedDeliveries = recentDeliveries.map(assignment => ({
      _id: assignment._id,
      orderId: assignment.order?._id,
      customerName: `${assignment.order?.user?.firstName || ''} ${assignment.order?.user?.lastName || ''}`.trim(),
      address: assignment.order?.customer?.address || 'N/A',
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      pickedUpAt: assignment.pickedUpAt,
      deliveredAt: assignment.deliveredAt,
      createdAt: assignment.createdAt
    }));

    return res.status(200).json(formattedDeliveries);
  } catch (err) {
    console.error('getRecentDeliveries error:', err);
    return res.status(500).json({ message: 'Failed to fetch recent deliveries' });
  }
};

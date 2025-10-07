import DeliveryAssignment from '../models/DeliveryAssignment.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { emitToTrackingRoom } from '../utils/socketHandlers.js';

// Get available orders for delivery agents
export const getAvailableOrders = async (req, res) => {
  try {
    const deliveryAgentId = req.userId;
    
    // Get orders that are ready for delivery and not yet assigned
    // Include both new orders and handed-over orders
    const availableOrders = await Order.find({
      status: 'out_for_delivery',
      deliveryType: 'home_delivery',
      assignedDeliveryAgent: null
    })
    .populate('user', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

    // Add distance calculation and handover information
    const ordersWithDistance = availableOrders.map(order => ({
      ...order.toObject(),
      distance: Math.random() * 10 + 1, // Mock distance 1-11 km
      isHandover: !!order.handoverReason, // Check if this is a handover order
      handoverReason: order.handoverReason,
      handoverDetails: order.handoverDetails,
      handoverAt: order.handoverAt
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

    // Check if there's already an assignment for this order
    let assignment = await DeliveryAssignment.findOne({ order: orderId });

    if (assignment) {
      // Update existing assignment
      assignment.deliveryAgent = deliveryAgentId;
      assignment.status = 'assigned';
      assignment.assignedAt = new Date();
      assignment.acceptedAt = new Date();
      await assignment.save();
    } else {
      // Create new delivery assignment
      assignment = await DeliveryAssignment.create({
        order: orderId,
        deliveryAgent: deliveryAgentId,
        status: 'assigned',
        assignedAt: new Date(),
        acceptedAt: new Date()
      });
    }

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

// Handover an order to a specific delivery agent
export const handoverOrder = async (req, res) => {
  try {
    console.log('=== HANDOVER BACKEND START ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request user:', req.userId);
    
    const { assignmentId } = req.params;
    const { reason, details, targetAgentId } = req.body;
    const currentAgentId = req.userId;

    console.log('Handover request:', { assignmentId, reason, details, targetAgentId, currentAgentId });

    // Validate target agent
    if (!targetAgentId) {
      return res.status(400).json({ message: 'Target delivery agent is required' });
    }

    // Verify target agent exists and is a delivery agent
    const targetAgent = await User.findOne({
      _id: targetAgentId,
      role: 'delivery_agent',
      isActive: true
    });

    if (!targetAgent) {
      return res.status(404).json({ message: 'Target delivery agent not found or inactive' });
    }

    // Find the current assignment
    const currentAssignment = await DeliveryAssignment.findOne({
      _id: assignmentId,
      deliveryAgent: currentAgentId
    }).populate('order');

    console.log('Found current assignment:', currentAssignment);

    if (!currentAssignment) {
      console.log('Assignment not found');
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Update current assignment with handover details
    console.log('Updating current assignment...');
    currentAssignment.status = 'handed_over';
    currentAssignment.handoverReason = reason;
    currentAssignment.handoverDetails = details;
    currentAssignment.handoverAt = new Date();
    currentAssignment.handoverBy = currentAgentId;
    await currentAssignment.save();
    console.log('Current assignment updated successfully');

    // Update existing assignment to target agent
    console.log('Updating assignment to target agent...');
    currentAssignment.deliveryAgent = targetAgentId;
    currentAssignment.status = 'assigned';
    currentAssignment.assignedAt = new Date();
    currentAssignment.handoverReason = reason;
    currentAssignment.handoverDetails = details;
    currentAssignment.handoverAt = new Date();
    currentAssignment.handoverBy = currentAgentId;
    currentAssignment.isHandover = true;
    await currentAssignment.save();
    console.log('Assignment updated to target agent successfully');

    // Update order with updated assignment
    console.log('Updating order...');
    const order = await Order.findById(currentAssignment.order._id);
    if (order) {
      order.assignedDeliveryAgent = targetAgentId;
      order.deliveryAssignment = currentAssignment._id; // Use the updated assignment ID
      order.status = 'assigned'; // Keep it assigned to the new agent
      order.handoverReason = reason;
      order.handoverDetails = details;
      order.handoverAt = new Date();
      await order.save();
      console.log('Order updated successfully');
    } else {
      console.log('Order not found');
    }

    // Get current agent information for notification
    const currentAgent = await User.findById(currentAgentId);
    
    // Create notification for target agent
    console.log('Creating notification for target agent...');
    const handoverMessage = `Order #${order._id.toString().slice(-8)} has been handed over to you by ${currentAgent.firstName} ${currentAgent.lastName}.

📋 Handover Details:
• Reason: ${reason}
• Additional Notes: ${details || 'No additional notes provided'}

Please continue the delivery process.`;
    
    const notification = new Notification({
      user: targetAgentId,
      userId: targetAgentId, // Also set userId for compatibility
      role: 'delivery_agent',
      title: '🚨 Order Handover Assignment',
      message: handoverMessage,
      type: 'handover',
      priority: 'high',
      orderId: order._id,
      handoverReason: reason,
      handoverDetails: details
    });
    await notification.save();
    console.log('Notification created successfully');

    console.log('=== HANDOVER BACKEND SUCCESS ===');
    return res.status(200).json({
      message: 'Order handed over successfully',
      handoverDetails: {
        reason,
        details,
        handedOverAt: currentAssignment.handoverAt,
        targetAgent: {
          id: targetAgent._id,
          name: `${targetAgent.firstName} ${targetAgent.lastName}`
        }
      }
    });
  } catch (err) {
    console.error('=== HANDOVER BACKEND ERROR ===');
    console.error('handoverOrder error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ message: 'Failed to handover order' });
  }
};

// Update delivery agent's current location
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, assignmentId } = req.body;
    const deliveryAgentId = req.userId;

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    // Update user's current location
    const updatedUser = await User.findByIdAndUpdate(
      deliveryAgentId,
      {
        'currentLocation.latitude': latitude,
        'currentLocation.longitude': longitude,
        'currentLocation.accuracy': accuracy || null,
        'currentLocation.lastUpdated': new Date(),
        'currentLocation.isOnline': true
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Delivery agent not found' });
    }

    // Emit real-time location update via WebSocket if assignmentId is provided
    if (assignmentId && req.io) {
      try {
        const assignment = await DeliveryAssignment.findById(assignmentId).populate('order');
        if (assignment) {
          emitToTrackingRoom(req.io, assignment.order._id, 'location_updated', {
            deliveryAgentId,
            deliveryAgentName: `${updatedUser.firstName} ${updatedUser.lastName}`,
            location: {
              latitude,
              longitude,
              accuracy,
              lastUpdated: new Date()
            },
            orderId: assignment.order._id
          });
        }
      } catch (error) {
        console.error('Error emitting location update:', error);
      }
    }

    return res.status(200).json({
      message: 'Location updated successfully',
      location: {
        latitude: updatedUser.currentLocation.latitude,
        longitude: updatedUser.currentLocation.longitude,
        accuracy: updatedUser.currentLocation.accuracy,
        lastUpdated: updatedUser.currentLocation.lastUpdated
      }
    });
  } catch (err) {
    console.error('updateLocation error:', err);
    return res.status(500).json({ message: 'Failed to update location' });
  }
};

// Get tracking information for an order
export const getOrderTracking = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const deliveryAgentId = req.userId;

    // Find the assignment
    const assignment = await DeliveryAssignment.findOne({
      _id: assignmentId,
      deliveryAgent: deliveryAgentId
    }).populate({
      path: 'order',
      populate: {
        path: 'user',
        select: 'firstName lastName phone'
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Get delivery agent's current location
    const deliveryAgent = await User.findById(deliveryAgentId, 'currentLocation firstName lastName');

    // Get order details with delivery coordinates
    const order = assignment.order;

    return res.status(200).json({
      assignment: {
        _id: assignment._id,
        status: assignment.status,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          customer: {
            name: order.customer.name,
            phone: order.customer.phone,
            address: order.customer.address
          },
          deliveryCoordinates: order.deliveryCoordinates
        },
        deliveryAgent: {
          _id: deliveryAgent._id,
          name: `${deliveryAgent.firstName} ${deliveryAgent.lastName}`,
          currentLocation: deliveryAgent.currentLocation
        }
      }
    });
  } catch (err) {
    console.error('getOrderTracking error:', err);
    return res.status(500).json({ message: 'Failed to get tracking information' });
  }
};

// Get live tracking for customer (public endpoint)
export const getLiveTracking = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order and its assignment
    const order = await Order.findById(orderId).populate('assignedDeliveryAgent', 'firstName lastName currentLocation');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.assignedDeliveryAgent) {
      return res.status(404).json({ message: 'No delivery agent assigned' });
    }

    const deliveryAgent = order.assignedDeliveryAgent;

    return res.status(200).json({
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        customer: {
          name: order.customer.name,
          address: order.customer.address
        },
        deliveryCoordinates: order.deliveryCoordinates
      },
      deliveryAgent: {
        name: `${deliveryAgent.firstName} ${deliveryAgent.lastName}`,
        currentLocation: deliveryAgent.currentLocation
      }
    });
  } catch (err) {
    console.error('getLiveTracking error:', err);
    return res.status(500).json({ message: 'Failed to get live tracking' });
  }
};

// Set delivery agent online/offline status
export const setOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const deliveryAgentId = req.userId;

    const updatedUser = await User.findByIdAndUpdate(
      deliveryAgentId,
      { 'currentLocation.isOnline': isOnline },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Delivery agent not found' });
    }

    return res.status(200).json({
      message: 'Online status updated successfully',
      isOnline: updatedUser.currentLocation.isOnline
    });
  } catch (err) {
    console.error('setOnlineStatus error:', err);
    return res.status(500).json({ message: 'Failed to update online status' });
  }
};

// Get all available delivery agents for handover selection
export const getAvailableDeliveryAgents = async (req, res) => {
  try {
    console.log('=== GET AVAILABLE DELIVERY AGENTS START ===');
    
    // Find all delivery agents except the current one
    const currentAgentId = req.userId;
    console.log('Current agent ID:', currentAgentId);
    
    const agents = await User.find({
      role: 'delivery_agent',
      _id: { $ne: currentAgentId },
      isActive: true
    }).select('_id firstName lastName phone email isActive');
    
    console.log('Found available agents:', agents.length);
    console.log('Available agents:', agents);
    
    return res.status(200).json(agents);
  } catch (err) {
    console.error('getAvailableDeliveryAgents error:', err);
    return res.status(500).json({ message: 'Failed to fetch available delivery agents' });
  }
};

// Get notifications for delivery agent
export const getDeliveryNotifications = async (req, res) => {
  try {
    console.log('=== GET DELIVERY NOTIFICATIONS START ===');
    
    const deliveryAgentId = req.userId;
    console.log('Delivery agent ID:', deliveryAgentId);
    
    // Find notifications for this delivery agent
    const notifications = await Notification.find({
      $or: [
        { user: deliveryAgentId },
        { userId: deliveryAgentId }
      ]
    })
    .populate('orderId', 'customer total status')
    .sort({ createdAt: -1 })
    .limit(50); // Limit to last 50 notifications
    
    console.log('Found notifications:', notifications.length);
    console.log('Notifications:', notifications);
    
    return res.status(200).json(notifications);
  } catch (err) {
    console.error('getDeliveryNotifications error:', err);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    console.log('=== MARK NOTIFICATION AS READ START ===');
    
    const { notificationId } = req.params;
    const deliveryAgentId = req.userId;
    
    console.log('Notification ID:', notificationId);
    console.log('Delivery agent ID:', deliveryAgentId);
    
    // Find and update the notification
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId,
        $or: [
          { user: deliveryAgentId },
          { userId: deliveryAgentId }
        ]
      },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    console.log('Notification marked as read:', notification._id);
    
    return res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (err) {
    console.error('markNotificationAsRead error:', err);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

// Accept a handover order
export const acceptHandoverOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryAgentId = req.userId;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.assignedDeliveryAgent) {
      return res.status(400).json({ message: 'Order is already assigned to another agent' });
    }

    if (order.status !== 'out_for_delivery') {
      return res.status(400).json({ message: 'Order is not available for handover' });
    }

    // Find existing assignment that was handed over
    const existingAssignment = await DeliveryAssignment.findOne({
      order: orderId,
      status: 'handed_over'
    });

    if (existingAssignment) {
      // Update the existing assignment instead of creating a new one
      existingAssignment.deliveryAgent = deliveryAgentId;
      existingAssignment.status = 'assigned';
      existingAssignment.assignedAt = new Date();
      existingAssignment.acceptedAt = new Date();
      existingAssignment.handoverAcceptedAt = new Date();
      await existingAssignment.save();

      // Update order with new agent
      order.assignedDeliveryAgent = deliveryAgentId;
      order.deliveryAssignment = existingAssignment._id;
      await order.save();

      // Populate the response
      const populatedAssignment = await DeliveryAssignment.findById(existingAssignment._id)
        .populate({
          path: 'order',
          populate: {
            path: 'user',
            select: 'firstName lastName email phone'
          }
        })
        .populate('deliveryAgent', 'firstName lastName phone');

      return res.status(200).json({
        message: 'Handover order accepted successfully',
        assignment: populatedAssignment
      });
    } else {
      // If no existing assignment found, create a new one
      const assignment = await DeliveryAssignment.create({
        order: orderId,
        deliveryAgent: deliveryAgentId,
        status: 'assigned',
        assignedAt: new Date(),
        acceptedAt: new Date(),
        isHandover: true,
        handoverAcceptedAt: new Date()
      });

      // Update order with new agent
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
        message: 'Handover order accepted successfully',
        assignment: populatedAssignment
      });
    }
  } catch (err) {
    console.error('acceptHandoverOrder error:', err);
    return res.status(500).json({ message: 'Failed to accept handover order' });
  }
};

// Delete assigned order (before picked up)
export const deleteAssignment = async (req, res) => {
  try {
    console.log('=== DELETE ASSIGNMENT START ===');
    const { assignmentId } = req.params;
    const deliveryAgentId = req.userId;

    console.log('Assignment ID:', assignmentId);
    console.log('Delivery Agent ID:', deliveryAgentId);

    // Find the assignment
    const assignment = await DeliveryAssignment.findOne({
      _id: assignmentId,
      deliveryAgent: deliveryAgentId
    }).populate('order');

    if (!assignment) {
      console.log('Assignment not found');
      return res.status(404).json({ message: 'Assignment not found' });
    }

    console.log('Found assignment:', assignment._id);
    console.log('Assignment status:', assignment.status);
    console.log('Order status:', assignment.order.status);

    // Check if assignment can be deleted (only before picked up)
    if (assignment.status === 'picked_up' || assignment.status === 'delivered' || assignment.status === 'failed') {
      console.log('Cannot delete assignment - already picked up or completed');
      return res.status(400).json({ 
        message: 'Cannot delete assignment. Order has already been picked up or completed.' 
      });
    }

    // Update order status to make it available again
    const order = await Order.findById(assignment.order._id);
    if (order) {
      order.assignedDeliveryAgent = null;
      order.deliveryAssignment = null;
      order.status = 'out_for_delivery'; // Keep it as out for delivery
      await order.save();
      console.log('Order updated - made available for reassignment');
    }

    // Delete the assignment
    await DeliveryAssignment.findByIdAndDelete(assignmentId);
    console.log('Assignment deleted successfully');

    return res.status(200).json({
      message: 'Assignment deleted successfully. Order is now available for other delivery agents.',
      orderId: assignment.order._id
    });

  } catch (err) {
    console.error('=== DELETE ASSIGNMENT ERROR ===');
    console.error('deleteAssignment error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ message: 'Failed to delete assignment' });
  }
};

// Get completed delivery history for delivery agent
export const getCompletedDeliveries = async (req, res) => {
  try {
    const deliveryAgentId = req.userId;
    const { page = 1, limit = 20, status = 'all', startDate, endDate } = req.query;
    
    // Build query based on status filter
    let statusFilter = {};
    if (status === 'delivered') {
      statusFilter = { status: 'delivered' };
    } else if (status === 'failed') {
      statusFilter = { status: 'failed' };
    } else if (status === 'completed') {
      statusFilter = { status: { $in: ['delivered', 'failed'] } };
    } else {
      // Default: get all completed deliveries (delivered and failed)
      statusFilter = { status: { $in: ['delivered', 'failed'] } };
    }

    // Build date filter based on delivery completion dates
    let dateFilter = {};
    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) {
        dateQuery.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to endDate to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        dateQuery.$lt = endDateObj;
      }
      
      // Filter by deliveredAt or failedAt dates
      dateFilter = {
        $or: [
          { deliveredAt: dateQuery },
          { failedAt: dateQuery }
        ]
      };
    }

    // Get completed assignments with pagination
    const assignments = await DeliveryAssignment.find({
      deliveryAgent: deliveryAgentId,
      ...statusFilter,
      ...dateFilter
    })
    .populate({
      path: 'order',
      populate: {
        path: 'user',
        select: 'firstName lastName email phone'
      }
    })
    .sort({ deliveredAt: -1, failedAt: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Get total count for pagination
    const totalCount = await DeliveryAssignment.countDocuments({
      deliveryAgent: deliveryAgentId,
      ...statusFilter,
      ...dateFilter
    });

    // Format the response with detailed information
    const formattedDeliveries = assignments.map(assignment => ({
      _id: assignment._id,
      orderId: assignment.order?._id,
      orderNumber: `#${assignment.order?._id?.toString().slice(-8)}`,
      customerName: `${assignment.order?.user?.firstName || ''} ${assignment.order?.user?.lastName || ''}`.trim(),
      customerPhone: assignment.order?.user?.phone,
      address: assignment.order?.customer?.address || 'N/A',
      status: assignment.status,
      totalAmount: assignment.order?.total || 0,
      paymentMethod: assignment.order?.paymentMethod,
      deliveryType: assignment.order?.deliveryType,
      orderType: assignment.order?.orderType,
      items: assignment.order?.items || assignment.order?.orderList || [],
      assignedAt: assignment.assignedAt,
      pickedUpAt: assignment.pickedUpAt,
      deliveredAt: assignment.deliveredAt,
      failedAt: assignment.failedAt,
      failureReason: assignment.failureReason,
      deliveryNotes: assignment.deliveryNotes,
      distance: assignment.distance,
      estimatedDeliveryTime: assignment.estimatedDeliveryTime,
      actualDeliveryTime: assignment.actualDeliveryTime,
      handoverReason: assignment.handoverReason,
      handoverDetails: assignment.handoverDetails,
      isHandover: assignment.isHandover,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt
    }));

    return res.status(200).json({
      deliveries: formattedDeliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error('getCompletedDeliveries error:', err);
    return res.status(500).json({ message: 'Failed to fetch completed deliveries' });
  }
};

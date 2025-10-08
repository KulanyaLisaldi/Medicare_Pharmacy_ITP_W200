import Order from '../models/Order.js';
import User from '../models/User.js';

// Test database connection
const testConnection = async (req, res) => {
  try {
    const count = await Order.countDocuments();
    const orders = await Order.find({}).limit(5).select('_id status').lean();
    res.json({
      success: true,
      message: 'Database connected',
      orderCount: count,
      sampleOrders: orders
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

// Track order by order number
const trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.body;
    console.log('Order tracking request:', { orderNumber });

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required'
      });
    }

    // Clean the order number (remove # if present)
    const cleanOrderNumber = orderNumber.replace('#', '');
    console.log('Cleaned order number:', cleanOrderNumber);
    
    // Try to find order by MongoDB _id (the order ID shown in frontend)
    let order = null;
    
    // First try exact match
    try {
      order = await Order.findById(cleanOrderNumber)
        .populate('user', 'name email phone')
        .lean();
    } catch (error) {
      console.log('Error finding by ID:', error.message);
    }
    
    // If not found, try to find by partial ID match
    if (!order) {
      console.log('Trying partial match...');
      // Convert to ObjectId and try to find orders that start with this ID
      const mongoose = await import('mongoose');
      try {
        // Try to find orders where the _id contains the partial string
        const allOrders = await Order.find({}).select('_id status').lean();
        console.log('All order IDs:', allOrders.map(o => o._id.toString()));
        
        const matchingOrder = allOrders.find(o => 
          o._id.toString().toLowerCase().includes(cleanOrderNumber.toLowerCase())
        );
        
        if (matchingOrder) {
          order = await Order.findById(matchingOrder._id)
            .populate('user', 'name email phone')
            .lean();
        }
      } catch (error) {
        console.log('Error in partial match:', error.message);
      }
    }
    
    console.log('Found order:', order ? 'Yes' : 'No');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found. Please check your order number.'
      });
    }

    // Format order data for display
    const orderDetails = {
      orderNumber: `#${order._id}`,
      status: order.status,
      orderDate: order.createdAt,
      totalAmount: order.total,
      customer: {
        name: order.customer?.name || order.user?.name || 'N/A',
        email: order.user?.email || 'N/A',
        phone: order.customer?.phone || order.user?.phone || 'N/A'
      },
      products: (order.items || order.orderList || []).map(item => ({
        name: item.name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price || 0,
        total: item.lineTotal || (item.price * item.quantity) || 0
      })),
      deliveryAddress: order.customer?.address || 'Not specified',
      paymentMethod: order.paymentMethod || 'Not specified',
      notes: order.customer?.notes || order.pharmacistNotes || 'No additional notes'
    };

    // Determine status message
    let statusMessage = '';
    switch (order.status) {
      case 'pending':
        statusMessage = 'Your order is being processed. We will contact you soon.';
        break;
      case 'approved':
        statusMessage = 'Your order has been approved and is being prepared.';
        break;
      case 'processing':
        statusMessage = 'Your order is being processed by our pharmacy team.';
        break;
      case 'ready':
        statusMessage = 'Your order is ready for pickup or delivery.';
        break;
      case 'out_for_delivery':
        statusMessage = 'Your order is out for delivery. You will receive it soon.';
        break;
      case 'assigned':
        statusMessage = 'Your order has been assigned to a delivery agent.';
        break;
      case 'picked_up':
        statusMessage = 'Your order has been picked up and is on its way.';
        break;
      case 'delivered':
        statusMessage = 'Your order has been delivered successfully.';
        break;
      case 'completed':
        statusMessage = 'Your order has been completed.';
        break;
      case 'canceled':
        statusMessage = 'Your order has been cancelled.';
        break;
      case 'failed':
        statusMessage = 'Your order delivery failed. Please contact support.';
        break;
      default:
        statusMessage = 'Order status is being updated.';
    }

    res.json({
      success: true,
      data: {
        order: orderDetails,
        statusMessage,
        estimatedDelivery: order.estimatedDelivery || 'Will be updated soon'
      }
    });

  } catch (error) {
    console.error('Order tracking error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error tracking order. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { trackOrder, testConnection };

import Order from '../models/Order.js';

// Upload prescription file
export const uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No prescription file uploaded' });
    }

    const prescriptionNumber = `PRES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      message: 'Prescription uploaded successfully',
      prescriptionNumber,
      fileName: req.file.filename,
      filePath: req.file.path
    });
  } catch (error) {
    console.error('Upload prescription error:', error);
    res.status(500).json({ message: 'Failed to upload prescription' });
  }
};

// Create prescription order
export const createPrescriptionOrder = async (req, res) => {
  try {
    const {
      prescriptionFile,
      prescriptionDetails,
      customer,
      paymentMethod,
      deliveryType,
      total
    } = req.body;

    // Generate prescription number
    const prescriptionNumber = `PRES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const order = new Order({
    user: req.userId,
    orderType: 'prescription',
    prescriptionFile: prescriptionFile, // Use the prescriptionFile from request body
    prescriptionDetails: {
      ...prescriptionDetails,
      prescriptionNumber
    },
    customer,
    paymentMethod,
    deliveryType,
    total: total || 0, // Will be calculated by pharmacist
    status: 'pending'
  });

    await order.save();

    res.status(201).json({
      message: 'Prescription order created successfully',
      order: order
    });
  } catch (error) {
    console.error('Create prescription order error:', error);
    res.status(500).json({ message: 'Failed to create prescription order' });
  }
};

// Get prescription orders for pharmacist
export const getPrescriptionOrders = async (req, res) => {
  try {
    const orders = await Order.find({ orderType: 'prescription' })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get prescription orders error:', error);
    res.status(500).json({ message: 'Failed to fetch prescription orders' });
  }
};

// Get prescription orders for customer
export const getCustomerPrescriptionOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      orderType: 'prescription',
      user: req.userId 
    })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get customer prescription orders error:', error);
    res.status(500).json({ message: 'Failed to fetch prescription orders' });
  }
};

// Send product list to customer for prescription order
export const sendProductListToCustomer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderList } = req.body;

    if (!orderList || !Array.isArray(orderList) || orderList.length === 0) {
      return res.status(400).json({ message: 'Product list is required' });
    }

    // Calculate total amount
    const totalAmount = orderList.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

    // Update the order with the product list and total (keep status as pending until customer confirms)
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          orderList: orderList,
          total: totalAmount,
          status: 'pending', // Keep as pending until customer confirms
          confirmationStatus: 'pending'
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }


    res.json({
      message: 'Product list sent to customer successfully',
      order: order
    });
  } catch (error) {
    console.error('Send product list error:', error);
    res.status(500).json({ message: 'Failed to send product list' });
  }
};

// Customer confirms prescription order and reduce stock
export const confirmPrescriptionOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body; // 'confirm' or 'reject'

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderType !== 'prescription') {
      return res.status(400).json({ message: 'This is not a prescription order' });
    }

    if (action === 'confirm') {
      // Import Product model
      const Product = (await import('../models/Product.js')).default;
      
      // Reduce stock for each product in the order list
      for (const item of order.orderList) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stockQuantity: -item.quantity } }
        );
      }

      // Update order status
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          status: 'approved',
          confirmationStatus: 'confirmed'
        }
      });

      res.json({
        message: 'Order confirmed successfully. Stock has been reduced.',
        order: await Order.findById(orderId)
      });
    } else if (action === 'reject') {
      // Update order status to rejected
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          status: 'canceled',
          confirmationStatus: 'rejected'
        }
      });

      res.json({
        message: 'Order rejected successfully.',
        order: await Order.findById(orderId)
      });
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "confirm" or "reject"' });
    }
  } catch (error) {
    console.error('Confirm prescription order error:', error);
    res.status(500).json({ message: 'Failed to process order confirmation' });
  }
};

// Fix prescription file paths for existing orders
export const fixPrescriptionFilePaths = async (req, res) => {
  try {
    const orders = await Order.find({ 
      orderType: 'prescription',
      prescriptionFile: { $regex: '^uploads/prescriptions/' }
    });

    let fixedCount = 0;
    for (const order of orders) {
      // Extract just the filename from the full path
      const filename = order.prescriptionFile.split('/').pop();
      
      await Order.findByIdAndUpdate(order._id, {
        $set: { prescriptionFile: filename }
      });
      
      fixedCount++;
    }

    res.json({
      message: `Fixed ${fixedCount} prescription file paths`,
      fixedCount
    });
  } catch (error) {
    console.error('Fix prescription file paths error:', error);
    res.status(500).json({ message: 'Failed to fix prescription file paths' });
  }
};

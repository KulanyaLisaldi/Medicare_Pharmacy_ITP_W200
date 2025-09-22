import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/prescriptions';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `prescription-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Create prescription order
export const createPrescription = async (req, res) => {
  try {
    const { patientName, phone, address, paymentMethod, notes } = req.body;
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'Prescription file is required' });
    }

    const prescription = await Prescription.create({
      user: userId,
      patientName,
      phone,
      address,
      prescriptionFile: req.file.path,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      paymentMethod: paymentMethod || 'cod',
      notes: notes || '',
      status: 'uploaded'
    });

    // Populate user details
    await prescription.populate('user', 'firstName lastName email');

    return res.status(201).json({
      message: 'Prescription uploaded successfully',
      prescription: {
        _id: prescription._id,
        prescriptionNumber: prescription.prescriptionNumber,
        patientName: prescription.patientName,
        phone: prescription.phone,
        address: prescription.address,
        status: prescription.status,
        totalAmount: prescription.totalAmount,
        createdAt: prescription.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return res.status(500).json({ message: 'Failed to upload prescription' });
  }
};

// Get user's prescriptions
export const getUserPrescriptions = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const prescriptions = await Prescription.find(query)
      .sort({ createdAt: -1 })
      .select('-prescriptionFile'); // Exclude file path for security

    return res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
};

// Get prescription by ID
export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const prescription = await Prescription.findOne({
      _id: id,
      user: userId
    }).populate('user', 'firstName lastName email');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    return res.status(200).json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return res.status(500).json({ message: 'Failed to fetch prescription' });
  }
};

// Update prescription status (for admin/pharmacist)
export const updatePrescriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pharmacistNotes, totalAmount } = req.body;
    const userId = req.userId;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Update status and related fields
    prescription.status = status;
    if (pharmacistNotes) prescription.pharmacistNotes = pharmacistNotes;
    if (totalAmount !== undefined) prescription.totalAmount = totalAmount;

    // Set timestamps based on status
    const now = new Date();
    switch (status) {
      case 'under_review':
        prescription.reviewedBy = userId;
        prescription.reviewedAt = now;
        break;
      case 'approved':
        prescription.approvedAt = now;
        break;
      case 'delivered':
        prescription.deliveredAt = now;
        break;
    }

    await prescription.save();

    return res.status(200).json({
      message: 'Prescription status updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    return res.status(500).json({ message: 'Failed to update prescription' });
  }
};

// Get all prescriptions (for admin/pharmacist)
export const getAllPrescriptions = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const prescriptions = await Prescription.find(query)
      .populate('user', 'firstName lastName email phone')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    return res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Error fetching all prescriptions:', error);
    return res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
};

// Download prescription file
export const downloadPrescriptionFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // First try to find prescription for the current user (for customers)
    let prescription = await Prescription.findOne({
      _id: id,
      user: userId
    });

    // If not found and user is pharmacist/admin, allow access to any prescription
    if (!prescription) {
      const user = await User.findById(userId);
      if (user && (user.role === 'pharmacist' || user.role === 'admin')) {
        prescription = await Prescription.findById(id);
      }
    }

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const filePath = prescription.prescriptionFile;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath, prescription.originalFileName);
  } catch (error) {
    console.error('Error downloading prescription file:', error);
    return res.status(500).json({ message: 'Failed to download file' });
  }
};

// Get all products for order list creation
export const getProductsForOrderList = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .select('name description price category stock')
      .sort({ name: 1 });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// Create order list for prescription
export const createOrderList = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { orderList } = req.body;

    if (!orderList || !Array.isArray(orderList) || orderList.length === 0) {
      return res.status(400).json({ message: 'Order list is required and must not be empty' });
    }

    // Validate order list items
    for (const item of orderList) {
      if (!item.productId || !item.productName || !item.quantity || !item.unitPrice) {
        return res.status(400).json({ message: 'All order list items must have productId, productName, quantity, and unitPrice' });
      }
    }

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Update prescription with order list
    prescription.orderList = orderList;
    prescription.orderListSentAt = new Date();
    prescription.status = 'order_list_sent';

    await prescription.save();

    res.json({ message: 'Order list created successfully', prescription });
  } catch (error) {
    console.error('Error creating order list:', error);
    return res.status(500).json({ message: 'Failed to create order list' });
  }
};

// Customer confirms order list
export const confirmOrderList = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const userId = req.userId;

    const prescription = await Prescription.findOne({ _id: prescriptionId, user: userId });
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (prescription.status !== 'order_list_sent') {
      return res.status(400).json({ message: 'Order list has not been sent for this prescription' });
    }

    // Check stock availability and reduce stock
    for (const item of prescription.orderList) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productName} not found` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.productName}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }
      
      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculate total amount
    const totalAmount = prescription.orderList.reduce((sum, item) => sum + item.totalPrice, 0);

    prescription.status = 'approved';
    prescription.totalAmount = totalAmount;
    prescription.customerConfirmedAt = new Date();

    await prescription.save();

    res.json({ message: 'Order list confirmed successfully and stock updated', prescription });
  } catch (error) {
    console.error('Error confirming order list:', error);
    return res.status(500).json({ message: 'Failed to confirm order list' });
  }
};

// Update prescription status for pharmacist workflow
export const updatePrescriptionWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Validate status transition
    const validTransitions = {
      'approved': ['preparing'],
      'preparing': ['ready_for_delivery'],
      'ready_for_delivery': ['delivered']
    };

    if (!validTransitions[prescription.status] || !validTransitions[prescription.status].includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${prescription.status} to ${status}` 
      });
    }

    // Update status and set timestamps
    prescription.status = status;
    const now = new Date();
    
    switch (status) {
      case 'preparing':
        prescription.preparingAt = now;
        break;
      case 'ready_for_delivery':
        prescription.readyForDeliveryAt = now;
        break;
      case 'delivered':
        prescription.deliveredAt = now;
        break;
    }

    await prescription.save();

    res.json({
      message: `Prescription status updated to ${status}`,
      prescription
    });
  } catch (error) {
    console.error('Error updating prescription workflow:', error);
    return res.status(500).json({ message: 'Failed to update prescription status' });
  }
};

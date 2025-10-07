import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, index: true },

    category: { 
        type: String, 
        default: '' },

    subcategory: { 
        type: String, 
        default: '' },

    brand: { 
        type: String, 
        default: '' },

    dosageForm: { 
        type: String, 
        default: '' }, // e.g., tablet, syrup

    strength: { 
        type: String, 
        default: '' },   // e.g., 500mg

    packSize: { 
        type: String, 
        default: '' },   // e.g., 10 tablets

    batchNumber: { 
        type: String, 
        default: '' },

    manufacturingDate: { 
        type: Date, 
        default: null },

    expiryDate: { 
        type: Date, 
        default: null },

    description: { 
        type: String, 
        default: '' },

    price: { 
        type: Number, 
        default: 0 }, // unit price

    stock: { 
        type: Number, 
        default: 0 }, // quantity in stock

    reservedStock: { 
        type: Number, 
        default: 0 }, // temporarily reserved quantity

    prescriptionRequired: { 
        type: Boolean, 
        default: false },

    tags: { 
        type: [String], 
        default: [] }, // e.g., Children, Pregnancy Safe, Sugar-Free

    image: {
        type: String,
        default: ''
    }, // Product image URL

    // Supplier contact email for automated reorders
    supplierEmail: {
        type: String,
        default: ''
    },

    // Threshold at or below which a reorder should be triggered
    reorderLevel: {
        type: Number,
        default: 0
    },

    isActive: { 
        type: Boolean, 
        default: true }
        
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;



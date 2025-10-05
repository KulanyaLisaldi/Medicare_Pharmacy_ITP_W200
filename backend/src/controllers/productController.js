import Product from "../models/Product.js";

export async function getProduct(req, res) {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        return res.status(200).json(product);
    } catch (error) {
        console.error('Error in getProduct', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function listProducts(req, res) {
    try {
        const { q } = req.query;
        const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
        const products = await Product.find(filter).sort({ createdAt: -1 });
        return res.status(200).json(products);
    } catch (error) {
        console.error('Error in listProducts', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function createProduct(req, res) {
    try {
        const product = await Product.create(req.body);
        return res.status(201).json({ message: 'Product created', product });
    } catch (error) {
        console.error('Error in createProduct', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Product not found' });
        return res.status(200).json({ message: 'Product updated', product: updated });
    } catch (error) {
        console.error('Error in updateProduct', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        const deleted = await Product.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Product not found' });
        return res.status(200).json({ message: 'Product deleted' });
    } catch (error) {
        console.error('Error in deleteProduct', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function uploadProductImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        
        const imageUrl = `http://localhost:5001/uploads/products/${req.file.filename}`;
        
        return res.status(200).json({ 
            message: 'Image uploaded successfully', 
            imageUrl 
        });
    } catch (error) {
        console.error('Error in uploadProductImage', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}



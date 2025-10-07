import Product from "../models/Product.js";
import { sendReorderEmail } from "../utils/mailer.js";
import AuditLog from "../models/AuditLog.js";

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

// Manual trigger: checks low-stock products grouped by supplierEmail and sends emails
export async function triggerLowStockReorder(req, res) {
    try {
        // Use a safe two-step filter: fetch candidates and filter in JS
        const candidates = await Product.find({ reorderLevel: { $gt: 0 } })
        const eligible = candidates.filter(p => (p.stock ?? 0) <= (p.reorderLevel ?? 0))

        // Group by supplierEmail
        const groups = new Map()
        for (const p of eligible) {
            const key = (p.supplierEmail || '').trim().toLowerCase()
            if (!key) continue
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key).push(p)
        }

        const results = []
        for (const [email, products] of groups.entries()) {
            try {
                await sendReorderEmail(email, {
                    items: products.map(p => ({
                        name: p.name,
                        stock: p.stock,
                        reorderLevel: p.reorderLevel,
                        packSize: p.packSize
                    }))
                })
                try {
                    await AuditLog.create({
                        userId: req.user?.id || null,
                        action: 'reorder_email_sent',
                        metadata: {
                            supplierEmail: email,
                            items: products.map(p => ({ id: p._id, name: p.name, stock: p.stock, reorderLevel: p.reorderLevel, packSize: p.packSize }))
                        }
                    })
                } catch (e) {
                    console.error('Failed to log reorder email:', e.message)
                }
                results.push({ email, count: products.length })
            } catch (sendErr) {
                console.error('Failed to send reorder email to', email, sendErr.message)
            }
        }

        return res.status(200).json({ message: 'Reorder check completed', results, totalSuppliersNotified: results.length })
    } catch (error) {
        console.error('Error in triggerLowStockReorder', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

export async function listReorderEmailLogs(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
        const logs = await AuditLog.find({ action: 'reorder_email_sent' })
            .sort({ createdAt: -1 })
            .limit(limit)
        return res.status(200).json(logs)
    } catch (error) {
        console.error('Error in listReorderEmailLogs', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}



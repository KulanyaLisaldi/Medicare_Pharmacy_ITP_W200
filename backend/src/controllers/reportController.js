import Product from '../models/Product.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

// Get comprehensive pharmacy reports
export const getPharmacyReports = async (req, res) => {
    try {
        const { reportType = 'all', startDate, endDate } = req.query;
        
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        // Parse date range if provided
        let dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the entire end date
            dateFilter = {
                createdAt: {
                    $gte: start,
                    $lte: end
                }
            };
        }

        // Get all products
        const products = await Product.find({ isActive: true }).select('name description stock expiryDate price category');
        
        // Get orders based on date filter
        const orders = await Order.find(dateFilter).select('status total createdAt orderType');

        // Analyze stock levels
        const lowStockProducts = products.filter(p => (p.stock || 0) <= 10 && (p.stock || 0) > 0);
        const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
        const expiredProducts = products.filter(p => p.expiryDate && new Date(p.expiryDate) < now);
        const nearExpiryProducts = products.filter(p => 
            p.expiryDate && 
            new Date(p.expiryDate) > now && 
            new Date(p.expiryDate) <= thirtyDaysFromNow
        );

        // Analyze orders
        const orderStats = {
            total: orders.length,
            fulfilled: orders.filter(o => ['delivered', 'completed'].includes(o.status)).length,
            pending: orders.filter(o => ['pending', 'approved', 'processing', 'ready', 'out_for_delivery', 'assigned', 'picked_up'].includes(o.status)).length,
            canceled: orders.filter(o => o.status === 'canceled').length,
            failed: orders.filter(o => o.status === 'failed').length
        };

        // Calculate fulfillment rate
        const fulfillmentRate = orderStats.total > 0 
            ? Math.round((orderStats.fulfilled / orderStats.total) * 100) 
            : 0;

        // Get recent orders (last 7 days)
        const recentOrders = orders.filter(o => new Date(o.createdAt) >= sevenDaysAgo);
        
        // Get order trends (last 30 days)
        const orderTrends = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));
            
            const dayOrders = orders.filter(o => 
                new Date(o.createdAt) >= dayStart && new Date(o.createdAt) < dayEnd
            );
            
            orderTrends.push({
                date: dayStart.toISOString().split('T')[0],
                count: dayOrders.length,
                revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
            });
        }

        // Get top selling products
        const productSales = {};
        orders.forEach(order => {
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    if (productSales[item.name]) {
                        productSales[item.name] += item.quantity;
                    } else {
                        productSales[item.name] = item.quantity;
                    }
                });
            }
        });

        const topSellingProducts = Object.entries(productSales)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        // Calculate revenue metrics
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const averageOrderValue = orderStats.total > 0 ? totalRevenue / orderStats.total : 0;
        const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        // Get category-wise stock analysis
        const categoryAnalysis = {};
        products.forEach(product => {
            const category = product.category || 'Uncategorized';
            if (!categoryAnalysis[category]) {
                categoryAnalysis[category] = {
                    total: 0,
                    lowStock: 0,
                    outOfStock: 0,
                    expired: 0,
                    nearExpiry: 0
                };
            }
            
            categoryAnalysis[category].total++;
            
            if ((product.stock || 0) === 0) {
                categoryAnalysis[category].outOfStock++;
            } else if ((product.stock || 0) <= 10) {
                categoryAnalysis[category].lowStock++;
            }
            
            if (product.expiryDate) {
                if (new Date(product.expiryDate) < now) {
                    categoryAnalysis[category].expired++;
                } else if (new Date(product.expiryDate) <= thirtyDaysFromNow) {
                    categoryAnalysis[category].nearExpiry++;
                }
            }
        });

        // Filter data based on report type
        let filteredData = {
            lowStockProducts,
            outOfStockProducts,
            expiredProducts,
            nearExpiryProducts,
            orderStats,
            orderTrends,
            topSellingProducts,
            categoryAnalysis
        };

        // Apply report type filtering
        if (reportType === 'stock') {
            filteredData = {
                lowStockProducts,
                outOfStockProducts,
                expiredProducts,
                nearExpiryProducts,
                categoryAnalysis
            };
        } else if (reportType === 'orders') {
            filteredData = {
                orderStats,
                orderTrends,
                topSellingProducts
            };
        } else if (reportType === 'revenue') {
            filteredData = {
                orderStats,
                orderTrends,
                topSellingProducts
            };
        }

        const reportData = {
            filters: {
                reportType,
                startDate: startDate || null,
                endDate: endDate || null,
                dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'
            },
            summary: {
                totalProducts: products.length,
                lowStockCount: lowStockProducts.length,
                outOfStockCount: outOfStockProducts.length,
                expiredCount: expiredProducts.length,
                nearExpiryCount: nearExpiryProducts.length,
                totalOrders: orderStats.total,
                fulfillmentRate,
                totalRevenue,
                averageOrderValue,
                recentRevenue
            },
            stockAnalysis: {
                lowStockProducts: filteredData.lowStockProducts ? filteredData.lowStockProducts.map(p => ({
                    _id: p._id,
                    name: p.name,
                    description: p.description,
                    stock: p.stock,
                    category: p.category,
                    price: p.price
                })) : [],
                outOfStockProducts: filteredData.outOfStockProducts ? filteredData.outOfStockProducts.map(p => ({
                    _id: p._id,
                    name: p.name,
                    description: p.description,
                    stock: p.stock,
                    category: p.category,
                    price: p.price
                })) : [],
                expiredProducts: filteredData.expiredProducts ? filteredData.expiredProducts.map(p => ({
                    _id: p._id,
                    name: p.name,
                    description: p.description,
                    expiryDate: p.expiryDate,
                    stock: p.stock,
                    category: p.category
                })) : [],
                nearExpiryProducts: filteredData.nearExpiryProducts ? filteredData.nearExpiryProducts.map(p => ({
                    _id: p._id,
                    name: p.name,
                    description: p.description,
                    expiryDate: p.expiryDate,
                    stock: p.stock,
                    category: p.category
                })) : []
            },
            orderAnalysis: {
                orderStats: filteredData.orderStats || orderStats,
                recentOrders: recentOrders.length,
                orderTrends: filteredData.orderTrends || [],
                topSellingProducts: filteredData.topSellingProducts || []
            },
            categoryAnalysis: filteredData.categoryAnalysis ? Object.entries(filteredData.categoryAnalysis).map(([category, data]) => ({
                category,
                ...data
            })) : [],
            generatedAt: now.toISOString()
        };

        res.status(200).json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error('Error in getPharmacyReports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate pharmacy reports',
            error: error.message
        });
    }
};

// Get stock alerts
export const getStockAlerts = async (req, res) => {
    try {
        const { threshold = 10 } = req.query;
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        const products = await Product.find({ isActive: true });

        const alerts = {
            lowStock: products.filter(p => (p.stock || 0) <= threshold && (p.stock || 0) > 0),
            outOfStock: products.filter(p => (p.stock || 0) === 0),
            expired: products.filter(p => p.expiryDate && new Date(p.expiryDate) < now),
            nearExpiry: products.filter(p => 
                p.expiryDate && 
                new Date(p.expiryDate) > now && 
                new Date(p.expiryDate) <= thirtyDaysFromNow
            )
        };

        res.status(200).json({
            success: true,
            data: alerts
        });

    } catch (error) {
        console.error('Error in getStockAlerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stock alerts',
            error: error.message
        });
    }
};

// Get order analytics
export const getOrderAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const days = parseInt(period);
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        const analytics = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
            averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length : 0,
            statusBreakdown: {
                pending: orders.filter(o => ['pending', 'approved'].includes(o.status)).length,
                processing: orders.filter(o => ['processing', 'ready'].includes(o.status)).length,
                delivered: orders.filter(o => ['delivered', 'completed'].includes(o.status)).length,
                canceled: orders.filter(o => o.status === 'canceled').length,
                failed: orders.filter(o => o.status === 'failed').length
            },
            orderTypes: {
                product: orders.filter(o => o.orderType === 'product').length,
                prescription: orders.filter(o => o.orderType === 'prescription').length
            },
            deliveryTypes: {
                pickup: orders.filter(o => o.deliveryType === 'pickup').length,
                home_delivery: orders.filter(o => o.deliveryType === 'home_delivery').length
            }
        };

        res.status(200).json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Error in getOrderAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order analytics',
            error: error.message
        });
    }
};

// Get inventory health report
export const getInventoryHealth = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true });
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        const health = {
            totalProducts: products.length,
            stockLevels: {
                healthy: products.filter(p => (p.stock || 0) > 20).length,
                low: products.filter(p => (p.stock || 0) <= 20 && (p.stock || 0) > 0).length,
                out: products.filter(p => (p.stock || 0) === 0).length
            },
            expiryStatus: {
                expired: products.filter(p => p.expiryDate && new Date(p.expiryDate) < now).length,
                nearExpiry: products.filter(p => 
                    p.expiryDate && 
                    new Date(p.expiryDate) > now && 
                    new Date(p.expiryDate) <= thirtyDaysFromNow
                ).length,
                healthy: products.filter(p => 
                    !p.expiryDate || 
                    new Date(p.expiryDate) > thirtyDaysFromNow
                ).length
            },
            totalValue: products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0),
            categories: {}
        };

        // Category analysis
        products.forEach(product => {
            const category = product.category || 'Uncategorized';
            if (!health.categories[category]) {
                health.categories[category] = {
                    total: 0,
                    healthy: 0,
                    low: 0,
                    out: 0,
                    expired: 0,
                    nearExpiry: 0
                };
            }
            
            health.categories[category].total++;
            
            if ((product.stock || 0) === 0) {
                health.categories[category].out++;
            } else if ((product.stock || 0) <= 20) {
                health.categories[category].low++;
            } else {
                health.categories[category].healthy++;
            }
            
            if (product.expiryDate) {
                if (new Date(product.expiryDate) < now) {
                    health.categories[category].expired++;
                } else if (new Date(product.expiryDate) <= thirtyDaysFromNow) {
                    health.categories[category].nearExpiry++;
                }
            }
        });

        res.status(200).json({
            success: true,
            data: health
        });

    } catch (error) {
        console.error('Error in getInventoryHealth:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get inventory health',
            error: error.message
        });
    }
};

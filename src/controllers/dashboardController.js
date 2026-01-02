const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ProductVariant = require('../models/productVariantModel');
const Customer = require('../models/customerModel');
const Category = require('../models/categoryModel');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;

        // Basic counts
        const categoryCount = await Category.countDocuments({ tenantId, isActive: true });
        const productCount = await Product.countDocuments({ tenantId, isActive: true });
        const variantCount = await ProductVariant.countDocuments({ tenantId, isActive: true });
        const customerCount = await Customer.countDocuments({ tenantId, isActive: true });
        const orderCount = await Order.countDocuments({ tenantId });

        // Calculate total revenue
        const orders = await Order.find({ tenantId });
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
        const totalPaid = orders.reduce((acc, order) => acc + order.paidAmount, 0);
        const totalOutstanding = totalRevenue - totalPaid;

        // Order status breakdown
        const ordersByStatus = await Order.aggregate([
            { $match: { tenantId } },
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
        ]);

        // Payment status breakdown
        const ordersByPayment = await Order.aggregate([
            { $match: { tenantId } },
            { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
        ]);

        // Total stock value
        const variants = await ProductVariant.find({ tenantId, isActive: true });
        const totalStockValue = variants.reduce(
            (acc, variant) => acc + variant.finalPrice * variant.stockQty,
            0
        );

        // Low stock variants (less than 5)
        const lowStockCount = await ProductVariant.countDocuments({
            tenantId,
            isActive: true,
            stockQty: { $lt: 5 },
        });

        const stats = {
            counts: {
                categories: categoryCount,
                products: productCount,
                variants: variantCount,
                customers: customerCount,
                orders: orderCount,
            },
            revenue: {
                total: Math.round(totalRevenue * 100) / 100,
                paid: Math.round(totalPaid * 100) / 100,
                outstanding: Math.round(totalOutstanding * 100) / 100,
            },
            inventory: {
                totalStockValue: Math.round(totalStockValue * 100) / 100,
                lowStockItems: lowStockCount,
            },
            ordersByStatus: ordersByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            ordersByPayment: ordersByPayment.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        };

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats };

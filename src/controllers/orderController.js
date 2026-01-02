const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const ProductVariant = require('../models/productVariantModel');
const Customer = require('../models/customerModel');

// @desc    Get all orders (Tenant scoped)
// @route   GET /api/orders
// @access  Private (Admin/User)
const getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ tenantId: req.user.tenantId })
            .populate('customerId', 'name mobile shopName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single order by ID with items
// @route   GET /api/orders/:id
// @access  Private (Admin/User)
const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId', 'name mobile email shopName gstNumber address');

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Check tenant ownership
        if (order.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to access this order');
        }

        // Get order items
        const orderItems = await OrderItem.find({ orderId: order._id })
            .populate({
                path: 'variantId',
                select: 'sku purity grossWeight netWeight finalPrice',
                populate: {
                    path: 'productId',
                    select: 'name designCode metalType',
                },
            });

        res.json({
            success: true,
            data: {
                order,
                items: orderItems,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new order with items (using transaction)
// @route   POST /api/orders
// @access  Private/Admin
const createOrder = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerId, items, paidAmount, notes } = req.body;

        // Validate input
        if (!customerId || !items || items.length === 0) {
            res.status(400);
            throw new Error('Please provide customer and order items');
        }

        // Verify customer exists and belongs to tenant
        const customer = await Customer.findOne({
            _id: customerId,
            tenantId: req.user.tenantId,
        }).session(session);

        if (!customer) {
            res.status(404);
            throw new Error('Customer not found');
        }

        // Generate unique order number
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        let totalAmount = 0;
        const orderItemsData = [];

        // Validate variants and calculate total
        for (const item of items) {
            const { variantId, quantity } = item;

            if (!variantId || !quantity || quantity <= 0) {
                res.status(400);
                throw new Error('Invalid item data');
            }

            // Get variant details
            const variant = await ProductVariant.findOne({
                _id: variantId,
                tenantId: req.user.tenantId,
                isActive: true,
            }).session(session);

            if (!variant) {
                res.status(404);
                throw new Error(`Variant ${variantId} not found`);
            }

            // Check stock availability
            if (variant.stockQty < quantity) {
                res.status(400);
                throw new Error(`Insufficient stock for variant ${variant.sku}`);
            }

            // Deduct stock
            variant.stockQty -= quantity;
            await variant.save({ session });

            // Calculate item total
            const itemTotal = variant.finalPrice * quantity;
            totalAmount += itemTotal;

            orderItemsData.push({
                tenantId: req.user.tenantId,
                variantId: variant._id,
                quantity,
                grossWeight: variant.grossWeight,
                netWeight: variant.netWeight,
                pricePerUnit: variant.finalPrice,
                totalPrice: itemTotal,
            });
        }

        // Create order
        const order = await Order.create(
            [
                {
                    tenantId: req.user.tenantId,
                    orderNumber,
                    customerId,
                    orderDate: new Date(),
                    totalAmount,
                    paidAmount: paidAmount || 0,
                    paymentStatus:
                        paidAmount >= totalAmount
                            ? 'Paid'
                            : paidAmount > 0
                            ? 'Partial'
                            : 'Pending',
                    orderStatus: 'Placed',
                    notes,
                },
            ],
            { session }
        );

        // Create order items
        const orderItemsWithOrderId = orderItemsData.map((item) => ({
            ...item,
            orderId: order[0]._id,
        }));

        await OrderItem.insertMany(orderItemsWithOrderId, { session });

        // Update customer outstanding amount
        const outstandingAmount = totalAmount - (paidAmount || 0);
        customer.outstandingAmount += outstandingAmount;
        await customer.save({ session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        // Fetch complete order with items
        const createdOrder = await Order.findById(order[0]._id).populate(
            'customerId',
            'name mobile shopName'
        );

        const createdItems = await OrderItem.find({ orderId: order[0]._id }).populate({
            path: 'variantId',
            select: 'sku purity',
            populate: {
                path: 'productId',
                select: 'name designCode',
            },
        });

        res.status(201).json({
            success: true,
            data: {
                order: createdOrder,
                items: createdItems,
            },
        });
    } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private/Admin
const updateOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Check tenant ownership
        if (order.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to access this order');
        }

        // Update fields
        order.orderStatus = req.body.orderStatus || order.orderStatus;
        order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
        order.paidAmount = req.body.paidAmount !== undefined ? req.body.paidAmount : order.paidAmount;
        order.notes = req.body.notes !== undefined ? req.body.notes : order.notes;

        const updatedOrder = await order.save();

        res.json({
            success: true,
            data: updatedOrder,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete order (soft delete by cancelling)
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(req.params.id).session(session);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Check tenant ownership
        if (order.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to delete this order');
        }

        // Check if already cancelled
        if (order.orderStatus === 'Cancelled') {
            res.status(400);
            throw new Error('Order is already cancelled');
        }

        // Get order items to restore stock
        const orderItems = await OrderItem.find({ orderId: order._id }).session(session);

        // Restore stock for each item
        for (const item of orderItems) {
            const variant = await ProductVariant.findById(item.variantId).session(session);
            if (variant) {
                variant.stockQty += item.quantity;
                await variant.save({ session });
            }
        }

        // Update customer outstanding
        const customer = await Customer.findById(order.customerId).session(session);
        if (customer) {
            const outstandingAmount = order.totalAmount - order.paidAmount;
            customer.outstandingAmount -= outstandingAmount;
            await customer.save({ session });
        }

        // Mark order as cancelled
        order.orderStatus = 'Cancelled';
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

module.exports = {
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
};

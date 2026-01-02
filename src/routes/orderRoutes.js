const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
} = require('../controllers/orderController');

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private (Admin/User)
router.get('/', protect, getOrders);

// @route   GET /api/orders/:id
// @desc    Get single order with items
// @access  Private (Admin/User)
router.get('/:id', protect, getOrderById);

// @route   POST /api/orders
// @desc    Create order with items (uses transaction)
// @access  Private/Admin
router.post('/', protect, admin, createOrder);

// @route   PUT /api/orders/:id
// @desc    Update order
// @access  Private/Admin
router.put('/:id', protect, admin, updateOrder);

// @route   DELETE /api/orders/:id
// @desc    Cancel order and restore stock
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteOrder);

module.exports = router;

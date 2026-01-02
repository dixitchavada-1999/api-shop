const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} = require('../controllers/customerController');

// @route   GET /api/customers
// @desc    Get all customers
// @access  Private (Admin/User)
router.get('/', protect, getCustomers);

// @route   GET /api/customers/:id
// @desc    Get single customer
// @access  Private (Admin/User)
router.get('/:id', protect, getCustomerById);

// @route   POST /api/customers
// @desc    Create customer
// @access  Private/Admin
router.post('/', protect, admin, createCustomer);

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private/Admin
router.put('/:id', protect, admin, updateCustomer);

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteCustomer);

module.exports = router;


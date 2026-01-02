const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');

// @route   GET /api/products
// @desc    Get all products
// @access  Private (Admin/User)
router.get('/', protect, getProducts);

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private (Admin/User)
router.get('/:id', protect, getProductById);

// @route   POST /api/products
// @desc    Create product
// @access  Private/Admin
router.post('/', protect, admin, createProduct);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/:id', protect, admin, updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;

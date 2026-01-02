const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
    getVariants,
    getVariantById,
    createVariant,
    updateVariant,
    deleteVariant,
    updateStock,
} = require('../controllers/productVariantController');

// @route   GET /api/variants
// @desc    Get all product variants (can filter by productId)
// @access  Private (Admin/User)
router.get('/', protect, getVariants);

// @route   GET /api/variants/:id
// @desc    Get single variant
// @access  Private (Admin/User)
router.get('/:id', protect, getVariantById);

// @route   POST /api/variants
// @desc    Create product variant
// @access  Private/Admin
router.post('/', protect, admin, createVariant);

// @route   PUT /api/variants/:id
// @desc    Update product variant
// @access  Private/Admin
router.put('/:id', protect, admin, updateVariant);

// @route   PATCH /api/variants/:id/stock
// @desc    Update variant stock
// @access  Private/Admin
router.patch('/:id/stock', protect, admin, updateStock);

// @route   DELETE /api/variants/:id
// @desc    Delete product variant
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteVariant);

module.exports = router;


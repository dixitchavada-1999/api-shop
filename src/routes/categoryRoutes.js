const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/categoryController');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private (Admin/User)
router.get('/', protect, getCategories);

// @route   POST /api/categories
// @desc    Create category
// @access  Private/Admin
router.post('/', protect, admin, createCategory);

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private/Admin
router.put('/:id', protect, admin, updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;

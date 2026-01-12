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
const { uploadMultiple } = require('../controllers/uploadController');

// Wrapper to handle multer errors
const handleMulterUpload = (req, res, next) => {
    uploadMultiple(req, res, (err) => {
        if (err) {
            // Multer errors will be caught by error handler
            return next(err);
        }
        next();
    });
};

// @route   GET /api/products
// @desc    Get all products
// @access  Private (Admin/User)
router.get('/', protect, getProducts);

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private (Admin/User)
router.get('/:id', protect, getProductById);

// @route   POST /api/products
// @desc    Create product (supports both file uploads and URL strings)
// @access  Private/Admin
// @note    Can send images as files (field name: "images") or as URLs in body (imageUrl/imageUrls)
router.post('/', protect, admin, handleMulterUpload, createProduct);

// @route   PUT /api/products/:id
// @desc    Update product (supports both file uploads and URL strings)
// @access  Private/Admin
// @note    Can send images as files (field name: "images") or as URLs in body (imageUrl/imageUrls)
router.put('/:id', protect, admin, handleMulterUpload, updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;

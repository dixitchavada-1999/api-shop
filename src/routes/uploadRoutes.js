const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { uploadImage, uploadSingle } = require('../controllers/uploadController');

// @route   POST /api/upload/image
// @desc    Upload image file
// @access  Private
router.post('/image', protect, uploadSingle, uploadImage);

module.exports = router;


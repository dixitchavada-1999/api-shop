const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

// @route   GET /api/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin/User)
router.get('/', protect, getDashboardStats);

module.exports = router;

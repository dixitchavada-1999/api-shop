const express = require('express');
const router = express.Router();
const {
    registerAdmin,
    loginUser,
    autoLogin,
    logout,
    refreshAccessToken,
    updatePassword,
    forgotPassword,
    resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', registerAdmin);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/auth/auto-login
// @desc    Auto-login with device ID
// @access  Public
router.post('/auto-login', autoLogin);

// @route   POST /api/auth/logout
// @desc    Logout user (clear device ID)
// @access  Public
router.post('/logout', logout);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', refreshAccessToken);

// @route   POST /api/auth/update-password
// @desc    Update password
// @access  Private (requires authentication)
router.post('/update-password', protect, updatePassword);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', resetPassword);

module.exports = router;

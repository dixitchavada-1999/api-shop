const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// @desc    Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token (exclude password)
            req.user = await User.findById(decoded.id).select('-password');

            // Check if user still exists
            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            // Check if user is active
            if (!req.user.isActive) {
                res.status(403);
                throw new Error('Your account has been deactivated');
            }

            next();
        } catch (error) {
            console.error('Auth error:', error.message);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token provided');
    }
};

// @desc    Admin only middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403);
        throw new Error('Access denied: Admin only');
    }
};

// @desc    User or Admin middleware (both can access)
const userOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'USER')) {
        next();
    } else {
        res.status(403);
        throw new Error('Access denied');
    }
};

module.exports = { protect, admin, userOrAdmin };

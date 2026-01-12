const mongoose = require('mongoose');
const User = require('../models/userModel');
const { generateTokens, generateAccessToken } = require('../utils/generateToken');
const jwt = require('jsonwebtoken');

/**
 * Transform user object to match frontend format
 */
const transformUserResponse = (user) => {
    return {
        id: user._id.toString(),
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        userName: user.userName || user.email.split('@')[0],
        mobileNumber: user.mobileNumber || '',
        roleId: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerAdmin = async (req, res, next) => {
    try {
        const { 
            name,  // Backward compatibility
            firstName, 
            lastName, 
            email, 
            userName,
            password, 
            mobileNumber,
            deviceId 
        } = req.body;

        // Check database connection first
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database connection unavailable. Please check server configuration.',
                data: null,
                errors: [],
            });
        }

        // Validate input - accept either name OR firstName+lastName
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
                data: null,
                errors: [],
            });
        }

        if (!name && (!firstName || !lastName)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name or firstName and lastName',
                data: null,
                errors: [],
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address',
                data: null,
                errors: [],
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long',
                data: null,
                errors: [],
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ 
            $or: [
                { email },
                ...(userName ? [{ userName }] : [])
            ]
        });
        
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: userExists.email === email 
                    ? 'Email already registered' 
                    : 'Username already taken',
                data: null,
                errors: [],
            });
        }

        // Generate a new tenantId for this admin
        const tenantId = new mongoose.Types.ObjectId();

        // Generate tokens
        const tempId = new mongoose.Types.ObjectId();
        const tokens = generateTokens(tempId, 'ADMIN', tenantId);

        // Create admin user
        const user = await User.create({
            _id: tempId,
            tenantId,
            name: name || `${firstName} ${lastName}`,
            firstName: firstName || name?.split(' ')[0],
            lastName: lastName || name?.split(' ').slice(1).join(' '),
            userName: userName || email.split('@')[0],
            email,
            mobileNumber,
            password,
            role: 'ADMIN',
            isActive: true,
            deviceId,
            refreshToken: tokens.refreshToken,
        });

        if (user) {
            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: transformUserResponse(user),
                    tokens: tokens,
                },
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle MongoDB duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`,
                data: null,
                errors: [],
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                msg: err.message,
                param: err.path,
            }));
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                data: null,
                errors: errors,
            });
        }

        // Handle database connection errors
        if (error.name === 'MongoServerError' || error.message.includes('Mongo')) {
            return res.status(503).json({
                success: false,
                message: 'Database connection error. Please try again later.',
                data: null,
                errors: [],
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'Registration failed',
            data: null,
            errors: [],
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { email, userName, password, deviceId } = req.body;

        // Validate input
        if ((!email && !userName) || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email/username and password',
                data: null,
                errors: [],
            });
        }

        // Find user by email or userName
        const user = await User.findOne({ 
            $or: [
                ...(email ? [{ email }] : []),
                ...(userName ? [{ userName }] : [])
            ]
        });

        // Check if user exists and password matches
        if (user && (await user.matchPassword(password))) {
            // Check if user is active
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been deactivated',
                    data: null,
                    errors: [],
                });
            }

            // Generate tokens
            const tokens = generateTokens(user._id, user.role, user.tenantId);

            // Update user with deviceId and refreshToken
            if (deviceId) {
                user.deviceId = deviceId;
            }
            user.refreshToken = tokens.refreshToken;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: transformUserResponse(user),
                    tokens: tokens,
                },
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Invalid email/username or password',
                data: null,
                errors: [],
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Login failed',
            data: null,
            errors: [],
        });
    }
};

// @desc    Auto-login with device ID
// @route   POST /api/auth/auto-login
// @access  Public
const autoLogin = async (req, res, next) => {
    try {
        const { deviceId } = req.body;

        if (!deviceId) {
            return res.status(400).json({
                success: false,
                message: 'Device ID is required',
                data: null,
                errors: [],
            });
        }

        // Find user by deviceId
        const user = await User.findOne({ deviceId, isActive: true });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'No active session found for this device',
                data: null,
                errors: [],
            });
        }

        // Generate new tokens
        const tokens = generateTokens(user._id, user.role, user.tenantId);

        // Update refresh token
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Auto-login successful',
            data: {
                user: transformUserResponse(user),
                tokens: tokens,
            },
        });
    } catch (error) {
        console.error('Auto-login error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Auto-login failed',
            data: null,
            errors: [],
        });
    }
};

// @desc    Logout user (clear device ID)
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
    try {
        const { refreshToken, userId } = req.body;

        // Try to find user by refreshToken or userId
        const query = {};
        if (refreshToken) query.refreshToken = refreshToken;
        if (userId) query._id = userId;

        if (Object.keys(query).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token or user ID is required',
                data: null,
                errors: [],
            });
        }

        const user = await User.findOne(query);

        if (user) {
            // Clear deviceId and refreshToken
            user.deviceId = undefined;
            user.refreshToken = undefined;
            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Logout successful',
            data: {},
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Logout failed',
            data: null,
            errors: [],
        });
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
                data: null,
                errors: [],
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // Find user
        const user = await User.findOne({ 
            _id: decoded.id, 
            refreshToken: refreshToken,
            isActive: true 
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
                data: null,
                errors: [],
            });
        }

        // Generate new access token
        const accessToken = generateAccessToken(user._id, user.role, user.tenantId);

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: accessToken,
            },
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
                data: null,
                errors: [],
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Refresh token failed',
            data: null,
            errors: [],
        });
    }
};

// @desc    Update password (requires authentication)
// @route   POST /api/auth/update-password
// @access  Private
const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user?.id; // From auth middleware

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password',
                data: null,
                errors: [],
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: null,
                errors: [],
            });
        }

        // Verify current password
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
                data: null,
                errors: [],
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully',
            data: {},
        });
    } catch (error) {
        console.error('Update password error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Password update failed',
            data: null,
            errors: [],
        });
    }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email',
                data: null,
                errors: [],
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: null,
                errors: [],
            });
        }

        // TODO: In production, implement:
        // 1. Generate reset token
        // 2. Save token to database with expiry
        // 3. Send email with reset link

        return res.status(200).json({
            success: true,
            message: 'Password reset instructions sent to email (Mock)',
            data: {},
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Forgot password failed',
            data: null,
            errors: [],
        });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide token and new password',
                data: null,
                errors: [],
            });
        }

        // TODO: In production, implement:
        // 1. Verify reset token
        // 2. Check token expiry
        // 3. Update user password
        // 4. Invalidate token

        return res.status(200).json({
            success: true,
            message: 'Password has been reset successfully (Mock)',
            data: {},
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Reset password failed',
            data: null,
            errors: [],
        });
    }
};

module.exports = {
    registerAdmin,
    loginUser,
    autoLogin,
    logout,
    refreshAccessToken,
    updatePassword,
    forgotPassword,
    resetPassword,
};

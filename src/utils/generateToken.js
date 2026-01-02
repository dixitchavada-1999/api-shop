const jwt = require('jsonwebtoken');

/**
 * Generate Access Token (short-lived)
 */
const generateAccessToken = (id, role, tenantId) => {
    return jwt.sign(
        { id, role, tenantId }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' } // 7 days
    );
};

/**
 * Generate Refresh Token (long-lived)
 */
const generateRefreshToken = (id) => {
    return jwt.sign(
        { id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '30d' } // 30 days
    );
};

/**
 * Generate both Access and Refresh tokens
 */
const generateTokens = (id, role, tenantId) => {
    return {
        accessToken: generateAccessToken(id, role, tenantId),
        refreshToken: generateRefreshToken(id),
    };
};

// Keep backward compatibility
const generateToken = (id, role, tenantId) => {
    return generateAccessToken(id, role, tenantId);
};

module.exports = generateToken;
module.exports.generateTokens = generateTokens;
module.exports.generateAccessToken = generateAccessToken;
module.exports.generateRefreshToken = generateRefreshToken;

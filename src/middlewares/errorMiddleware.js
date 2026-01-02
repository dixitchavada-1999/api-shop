/**
 * Custom error handler middleware
 * Formats all errors to match frontend expectations
 */
const errorHandler = (err, req, res, next) => {
    // Get status code (default to 500 if not set)
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    
    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        status: statusCode,
        path: req.path,
        method: req.method,
    });
    
    // Format response to match frontend expectations
    res.status(statusCode).json({
        success: false,
        message: err.message || 'An error occurred',
        data: null,
        errors: err.errors || [],
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            fullError: err 
        }),
    });
};

/**
 * Not found handler
 */
const notFound = (req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };

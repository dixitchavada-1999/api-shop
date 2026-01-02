const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Serve static files from uploads directory
// Files are saved in src/uploads/ (same level as controllers)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/variants', require('./routes/productVariantRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Basic route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Jewelry B2B API is running',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            categories: '/api/categories',
            products: '/api/products',
            variants: '/api/variants',
            customers: '/api/customers',
            orders: '/api/orders',
            dashboard: '/api/dashboard',
        },
    });
});

// 404 handler (must be before error handler)
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;

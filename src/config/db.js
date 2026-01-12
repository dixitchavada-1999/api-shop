const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI is not defined!');
            console.error('');
            console.error('📋 To fix this:');
            console.error('   1. If running locally: Create a .env file with MONGO_URI');
            console.error('   2. If deploying to Railway:');
            console.error('      - Go to your Railway project dashboard');
            console.error('      - Click on "Variables" tab');
            console.error('      - Add MONGO_URI with your MongoDB Atlas connection string');
            console.error('      - Example: mongodb+srv://user:pass@cluster.mongodb.net/dbname');
            console.error('');
            console.error('💡 Get MongoDB Atlas connection string from: https://www.mongodb.com/cloud/atlas');
            throw new Error("MONGO_URI not defined. Please set it in Railway Environment Variables or .env file");
        }
        console.log('✅ MONGO_URI found');
        console.log('📊 NODE_ENV:', process.env.NODE_ENV || 'development');

        if (process.env.NODE_ENV === 'production' && (process.env.MONGO_URI.includes('localhost') || process.env.MONGO_URI.includes('127.0.0.1'))) {
            console.error("FATAL ERROR: You are trying to connect to a local MongoDB instance in production.");
            console.error("Please set MONGO_URI in your Railway/Render Environment Variables to your MongoDB Atlas connection string.");
            console.error("Example: mongodb+srv://username:password@cluster.mongodb.net/database");
            throw new Error("Invalid MONGO_URI for production environment");
        }

        const connectionOptions = {
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
            socketTimeoutMS: 45000, // 45 seconds socket timeout
        };

        await mongoose.connect(process.env.MONGO_URI, connectionOptions);

        console.log("✅ MongoDB Connected Successfully");
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.error('⚠️ Server will continue to run, but database operations will fail.');
        console.error('⚠️ Please check your MONGO_URI and MongoDB Atlas network settings.');
        // Don't exit - let the server start and return errors via API
        // This prevents 502 errors and allows health checks to work
    }
};

module.exports = connectDB;

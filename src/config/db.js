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
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;

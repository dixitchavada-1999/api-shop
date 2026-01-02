const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not defined");
        }

        if (process.env.NODE_ENV === 'production' && (process.env.MONGO_URI.includes('localhost') || process.env.MONGO_URI.includes('127.0.0.1'))) {
            console.error("FATAL ERROR: You are trying to connect to a local MongoDB instance in production. Please set MONGO_URI in your Render Environment Variables to your MongoDB Atlas connection string.");
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

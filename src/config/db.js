const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || process.env.MONGO_URI_LOCAL || process.env.MONGO_URI_DEV;

        if (!mongoURI) {
            throw new Error('MongoDB URI is not defined in environment variables');
        }

        const conn = await mongoose.connect(mongoURI, {
            // These options are no longer needed in Mongoose 6+, but won't hurt
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;

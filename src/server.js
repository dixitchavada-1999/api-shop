require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

app.listen(PORT, () => {
    console.log(`Mongo URL: ${process.env.MONGO_URI}`);
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

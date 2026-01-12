const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

// Validate Cloudinary credentials
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    console.error('⚠️  Cloudinary credentials are missing!');
    console.error('Please set the following environment variables in your .env file:');
    console.error('  - CLOUDINARY_CLOUD_NAME');
    console.error('  - CLOUDINARY_API_KEY');
    console.error('  - CLOUDINARY_API_SECRET');
    console.error('\nGet your credentials from: https://cloudinary.com/console');
    
    // Don't throw error here, but log warning
    // This allows the app to start but uploads will fail with clear error
}

// Validate that credentials are not placeholder values
if (cloudName && (cloudName === 'your_cloud_name' || cloudName.includes('your_'))) {
    console.warn('⚠️  Cloudinary cloud_name appears to be a placeholder value');
}

if (apiKey && (apiKey === 'your_api_key' || apiKey.includes('your_'))) {
    console.warn('⚠️  Cloudinary API key appears to be a placeholder value');
    throw new Error('Invalid Cloudinary API key. Please set CLOUDINARY_API_KEY in your .env file with your actual Cloudinary API key from https://cloudinary.com/console');
}

if (apiSecret && (apiSecret === 'your_api_secret' || apiSecret.includes('your_'))) {
    console.warn('⚠️  Cloudinary API secret appears to be a placeholder value');
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});

// Configure Multer Storage for Cloudinary
let storage;
try {
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'jewelry-app/products', // Folder name in Cloudinary
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            transformation: [{ width: 1000, margin: 0, crop: 'limit' }], // Resize large images
        },
    });
} catch (error) {
    console.error('❌ Failed to configure Cloudinary storage:', error.message);
    throw error;
}

module.exports = {
    cloudinary,
    storage,
};

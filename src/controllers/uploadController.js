const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use Cloudinary in production, local storage in development
let useCloudinary = process.env.NODE_ENV === 'production' && 
                    process.env.CLOUDINARY_CLOUD_NAME && 
                    process.env.CLOUDINARY_API_KEY && 
                    process.env.CLOUDINARY_API_SECRET;

let storage;
let upload;

if (useCloudinary) {
  // Use Cloudinary storage for production (Railway/Render)
  try {
    const { storage: cloudinaryStorage } = require('../config/cloudinary');
    storage = cloudinaryStorage;
  } catch (error) {
    console.error('⚠️  Cloudinary not configured, falling back to local storage');
    // Fallback to local storage if Cloudinary fails
    useCloudinary = false;
  }
}

if (!useCloudinary) {
  // Use local disk storage for development
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  });
}

upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  },
});

// @desc    Upload image (Cloudinary in production, local in development)
// @route   POST /api/upload/image
// @access  Private
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    let imageUrl;

    if (useCloudinary && req.file.path) {
      // Cloudinary returns the URL in req.file.path
      imageUrl = req.file.path;
    } else if (req.file.filename) {
      // Local storage - file is saved locally
      if (process.env.NODE_ENV === 'production') {
        // In production, warn that local storage won't persist
        console.warn('⚠️  Using local storage in production. Files will be lost on restart.');
        console.warn('⚠️  Please configure Cloudinary for persistent file storage.');
      }
      // Generate URL path for the uploaded file
      imageUrl = `/uploads/${req.file.filename}`;
    } else {
      res.status(500);
      throw new Error('Failed to upload image.');
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl,
        filename: req.file.filename || req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Middleware for single image upload
const uploadSingle = upload.single('image');

// Middleware for multiple image uploads
const uploadMultiple = upload.array('images', 10); // Max 10 images

module.exports = {
  uploadImage,
  uploadSingle,
  uploadMultiple,
};


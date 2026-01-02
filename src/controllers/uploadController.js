const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

// @desc    Upload image
// @route   POST /api/upload/image
// @access  Private
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    // Get server URL - prefer IP address for mobile devices
    const protocol = req.protocol || 'http';
    
    // Try to get IP from request headers (for mobile devices)
    // Check X-Forwarded-Host or use host header
    let host = req.get('host');
    
    // If host is localhost, try to get IP from environment or use request IP
    if (host && host.includes('localhost')) {
      // Try environment variable first
      if (process.env.SERVER_HOST) {
        host = process.env.SERVER_HOST;
      } else {
        // Get IP from request
        const forwardedHost = req.get('x-forwarded-host');
        if (forwardedHost) {
          host = forwardedHost;
        } else {
          // Use request IP if available
          const clientIp = req.ip || req.connection?.remoteAddress;
          if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1') {
            // Extract IP from connection
            const serverAddress = req.connection?.localAddress;
            if (serverAddress && !serverAddress.includes('127.0.0.1')) {
              host = `${serverAddress.split(':')[0]}:3000`;
            }
          }
        }
      }
    }
    
    // Fallback: use environment variable or default
    if (!host || host.includes('localhost')) {
      host = process.env.SERVER_HOST || '10.205.211.191:3000';
    }
    
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl,
        filename: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Middleware for single image upload
const uploadSingle = upload.single('image');

module.exports = {
  uploadImage,
  uploadSingle,
};


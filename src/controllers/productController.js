const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

// @desc    Get all products (Tenant scoped)
// @route   GET /api/products
// @access  Private (Admin/User)
const getProducts = async (req, res, next) => {
    try {
        const products = await Product.find({
            tenantId: req.user.tenantId,
            isActive: true,
        }).populate('categoryId', 'name description');

        res.json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private (Admin/User)
const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('categoryId', 'name description');

        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        // Check tenant ownership
        if (product.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to access this product');
        }

        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
    try {
        // Parse JSON fields if they come as strings (common with multipart/form-data)
        let { name, categoryId, designCode, description, metalType, imageUrl, imageUrls } = req.body;
        
        // Parse JSON strings if needed
        if (typeof imageUrls === 'string') {
            try {
                imageUrls = JSON.parse(imageUrls);
            } catch (e) {
                imageUrls = undefined;
            }
        }

        // Validate required fields
        if (!name || !categoryId || !metalType) {
            res.status(400);
            throw new Error('Please provide all required fields');
        }

        // Verify category exists and belongs to tenant
        const category = await Category.findOne({
            _id: categoryId,
            tenantId: req.user.tenantId,
        });

        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }

        // Handle uploaded files first (from multer)
        let uploadedImageUrls = [];
        if (req.files && req.files.length > 0) {
            // For local storage, convert filename to URL path
            uploadedImageUrls = req.files.map(file => `/uploads/${file.filename}`);
        } else if (req.file) {
            uploadedImageUrls = [`/uploads/${req.file.filename}`];
        }

        // Handle both uploaded files and URL strings
        // Priority: uploaded files > imageUrls array > single imageUrl
        let finalImageUrls = [];
        if (uploadedImageUrls.length > 0) {
            finalImageUrls = uploadedImageUrls;
        } else if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
            finalImageUrls = imageUrls;
        } else if (imageUrl) {
            finalImageUrls = [imageUrl];
        }

        const product = await Product.create({
            tenantId: req.user.tenantId,
            categoryId,
            name,
            designCode,
            description,
            metalType,
            imageUrl: finalImageUrls.length > 0 ? finalImageUrls[0] : undefined, // Keep for backward compatibility
            imageUrls: finalImageUrls,
            isActive: true,
        });

        const populatedProduct = await Product.findById(product._id).populate('categoryId', 'name description');

        res.status(201).json({
            success: true,
            data: populatedProduct,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        // Check tenant ownership
        if (product.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this product');
        }

        // If categoryId is being updated, verify it exists and belongs to tenant
        if (req.body.categoryId && req.body.categoryId !== product.categoryId.toString()) {
            const category = await Category.findOne({
                _id: req.body.categoryId,
                tenantId: req.user.tenantId,
            });

            if (!category) {
                res.status(404);
                throw new Error('Category not found');
            }
        }

        // Parse JSON fields if they come as strings (common with multipart/form-data)
        let { imageUrl, imageUrls } = req.body;
        if (typeof imageUrls === 'string') {
            try {
                imageUrls = JSON.parse(imageUrls);
            } catch (e) {
                imageUrls = undefined;
            }
        }

        product.name = req.body.name || product.name;
        product.categoryId = req.body.categoryId || product.categoryId;
        product.designCode = req.body.designCode !== undefined ? req.body.designCode : product.designCode;
        product.description = req.body.description !== undefined ? req.body.description : product.description;
        product.metalType = req.body.metalType || product.metalType;
        
        // Handle uploaded files first (from multer)
        let uploadedImageUrls = [];
        if (req.files && req.files.length > 0) {
            // For local storage, convert filename to URL path
            uploadedImageUrls = req.files.map(file => `/uploads/${file.filename}`);
        } else if (req.file) {
            uploadedImageUrls = [`/uploads/${req.file.filename}`];
        }

        // Handle image updates: uploaded files > imageUrls array > single imageUrl
        if (uploadedImageUrls.length > 0) {
            // If files were uploaded, use them
            product.imageUrls = uploadedImageUrls;
            product.imageUrl = uploadedImageUrls[0];
        } else if (imageUrls !== undefined && Array.isArray(imageUrls)) {
            // If imageUrls array is provided, use it
            product.imageUrls = imageUrls;
            product.imageUrl = imageUrls.length > 0 ? imageUrls[0] : undefined;
        } else if (imageUrl !== undefined) {
            // If single imageUrl is provided, convert to array
            product.imageUrl = imageUrl;
            product.imageUrls = imageUrl ? [imageUrl] : [];
        }
        // If none provided, keep existing images
        
        product.isActive = req.body.isActive !== undefined ? req.body.isActive : product.isActive;

        const updatedProduct = await product.save();
        const populatedProduct = await Product.findById(updatedProduct._id).populate('categoryId', 'name description');

        res.json({
            success: true,
            data: populatedProduct,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        // Check tenant ownership
        if (product.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to delete this product');
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: 'Product removed successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};

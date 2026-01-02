const ProductVariant = require('../models/productVariantModel');
const Product = require('../models/productModel');

// @desc    Get all product variants (Tenant scoped)
// @route   GET /api/variants
// @access  Private (Admin/User)
const getVariants = async (req, res, next) => {
    try {
        const { productId } = req.query;
        const filter = {
            tenantId: req.user.tenantId,
            isActive: true,
        };

        if (productId) {
            filter.productId = productId;
        }

        const variants = await ProductVariant.find(filter)
            .populate('productId', 'name designCode metalType');

        res.json({
            success: true,
            count: variants.length,
            data: variants,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single variant by ID
// @route   GET /api/variants/:id
// @access  Private (Admin/User)
const getVariantById = async (req, res, next) => {
    try {
        const variant = await ProductVariant.findById(req.params.id)
            .populate('productId', 'name designCode metalType');

        if (!variant) {
            res.status(404);
            throw new Error('Product variant not found');
        }

        // Check tenant ownership
        if (variant.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to access this variant');
        }

        res.json({
            success: true,
            data: variant,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create product variant
// @route   POST /api/variants
// @access  Private/Admin
const createVariant = async (req, res, next) => {
    try {
        const {
            productId,
            sku,
            purity,
            grossWeight,
            netWeight,
            stoneWeight,
            metalRate,
            makingChargeType,
            makingChargeValue,
            wastagePercentage,
            stonePrice,
            gstPercentage,
            stockQty,
            attributes,
            images,
        } = req.body;

        // Validate required fields
        if (!productId || !sku || !purity || !grossWeight || !netWeight || !metalRate || !makingChargeType || makingChargeValue === undefined || stockQty === undefined) {
            res.status(400);
            throw new Error('Please provide all required fields');
        }

        // Verify product exists and belongs to tenant
        const product = await Product.findOne({
            _id: productId,
            tenantId: req.user.tenantId,
        });

        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        // Check if SKU already exists
        const existingVariant = await ProductVariant.findOne({ sku });
        if (existingVariant) {
            res.status(400);
            throw new Error('SKU already exists');
        }

        const variant = await ProductVariant.create({
            tenantId: req.user.tenantId,
            productId,
            sku,
            purity,
            grossWeight,
            netWeight,
            stoneWeight: stoneWeight || 0,
            metalRate,
            makingChargeType,
            makingChargeValue,
            wastagePercentage: wastagePercentage || 0,
            stonePrice: stonePrice || 0,
            gstPercentage: gstPercentage || 3,
            stockQty,
            attributes: attributes || {},
            images: images || [],
            isActive: true,
        });

        const populatedVariant = await ProductVariant.findById(variant._id)
            .populate('productId', 'name designCode metalType');

        res.status(201).json({
            success: true,
            data: populatedVariant,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product variant
// @route   PUT /api/variants/:id
// @access  Private/Admin
const updateVariant = async (req, res, next) => {
    try {
        const variant = await ProductVariant.findById(req.params.id);

        if (!variant) {
            res.status(404);
            throw new Error('Product variant not found');
        }

        // Check tenant ownership
        if (variant.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this variant');
        }

        // Check if SKU is being updated and if it already exists
        if (req.body.sku && req.body.sku !== variant.sku) {
            const existingVariant = await ProductVariant.findOne({ sku: req.body.sku });
            if (existingVariant) {
                res.status(400);
                throw new Error('SKU already exists');
            }
        }

        // Update fields
        variant.sku = req.body.sku || variant.sku;
        variant.purity = req.body.purity || variant.purity;
        variant.grossWeight = req.body.grossWeight !== undefined ? req.body.grossWeight : variant.grossWeight;
        variant.netWeight = req.body.netWeight !== undefined ? req.body.netWeight : variant.netWeight;
        variant.stoneWeight = req.body.stoneWeight !== undefined ? req.body.stoneWeight : variant.stoneWeight;
        variant.metalRate = req.body.metalRate !== undefined ? req.body.metalRate : variant.metalRate;
        variant.makingChargeType = req.body.makingChargeType || variant.makingChargeType;
        variant.makingChargeValue = req.body.makingChargeValue !== undefined ? req.body.makingChargeValue : variant.makingChargeValue;
        variant.wastagePercentage = req.body.wastagePercentage !== undefined ? req.body.wastagePercentage : variant.wastagePercentage;
        variant.stonePrice = req.body.stonePrice !== undefined ? req.body.stonePrice : variant.stonePrice;
        variant.gstPercentage = req.body.gstPercentage !== undefined ? req.body.gstPercentage : variant.gstPercentage;
        variant.stockQty = req.body.stockQty !== undefined ? req.body.stockQty : variant.stockQty;
        variant.attributes = req.body.attributes !== undefined ? req.body.attributes : variant.attributes;
        variant.images = req.body.images !== undefined ? req.body.images : variant.images;
        variant.isActive = req.body.isActive !== undefined ? req.body.isActive : variant.isActive;

        const updatedVariant = await variant.save();
        const populatedVariant = await ProductVariant.findById(updatedVariant._id)
            .populate('productId', 'name designCode metalType');

        res.json({
            success: true,
            data: populatedVariant,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product variant
// @route   DELETE /api/variants/:id
// @access  Private/Admin
const deleteVariant = async (req, res, next) => {
    try {
        const variant = await ProductVariant.findById(req.params.id);

        if (!variant) {
            res.status(404);
            throw new Error('Product variant not found');
        }

        // Check tenant ownership
        if (variant.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to delete this variant');
        }

        await variant.deleteOne();

        res.json({
            success: true,
            message: 'Product variant removed successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update variant stock
// @route   PATCH /api/variants/:id/stock
// @access  Private/Admin
const updateStock = async (req, res, next) => {
    try {
        const { stockQty } = req.body;

        if (stockQty === undefined) {
            res.status(400);
            throw new Error('Please provide stock quantity');
        }

        const variant = await ProductVariant.findById(req.params.id);

        if (!variant) {
            res.status(404);
            throw new Error('Product variant not found');
        }

        // Check tenant ownership
        if (variant.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this variant');
        }

        variant.stockQty = stockQty;
        await variant.save();

        res.json({
            success: true,
            data: variant,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVariants,
    getVariantById,
    createVariant,
    updateVariant,
    deleteVariant,
    updateStock,
};


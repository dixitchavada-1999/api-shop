const Category = require('../models/categoryModel');

// @desc    Get all categories (Tenant scoped)
// @route   GET /api/categories
// @access  Private (Admin/User)
const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({
            tenantId: req.user.tenantId,
            isActive: true,
        });

        res.json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
    try {
        const { name, description, imageUrl } = req.body;

        if (!name) {
            res.status(400);
            throw new Error('Please provide category name');
        }

        const category = await Category.create({
            tenantId: req.user.tenantId,
            name,
            description,
            imageUrl,
            isActive: true,
        });

        res.status(201).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }

        // Check tenant ownership
        if (category.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this category');
        }

        category.name = req.body.name || category.name;
        category.description = req.body.description !== undefined ? req.body.description : category.description;
        category.imageUrl = req.body.imageUrl !== undefined ? req.body.imageUrl : category.imageUrl;
        category.isActive = req.body.isActive !== undefined ? req.body.isActive : category.isActive;

        const updatedCategory = await category.save();

        res.json({
            success: true,
            data: updatedCategory,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }

        // Check tenant ownership
        if (category.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to delete this category');
        }

        await category.deleteOne();

        res.json({
            success: true,
            message: 'Category removed successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};

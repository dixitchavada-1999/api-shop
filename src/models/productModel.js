const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        designCode: {
            type: String,
            unique: true,
            sparse: true,
        },
        description: {
            type: String,
        },
        metalType: {
            type: String,
            enum: ['Gold', 'Silver', 'Platinum'],
            required: true,
        },
        imageUrl: {
            type: String,
        },
        imageUrls: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Product', productSchema);

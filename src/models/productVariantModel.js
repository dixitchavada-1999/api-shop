const mongoose = require('mongoose');

const productVariantSchema = mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        sku: {
            type: String,
            required: true,
            unique: true,
        },
        purity: {
            type: String,
            enum: ['22K', '18K', '14K', '925'],
            required: true,
        },
        grossWeight: {
            type: Number,
            required: true,
        },
        netWeight: {
            type: Number,
            required: true,
        },
        stoneWeight: {
            type: Number,
            default: 0,
        },
        metalRate: {
            type: Number,
            required: true,
        },
        makingChargeType: {
            type: String,
            enum: ['PerGram', 'Fixed'],
            required: true,
        },
        makingChargeValue: {
            type: Number,
            required: true,
        },
        wastagePercentage: {
            type: Number,
            default: 0,
        },
        stonePrice: {
            type: Number,
            default: 0,
        },
        gstPercentage: {
            type: Number,
            default: 3,
        },
        finalPrice: {
            type: Number,
            required: true,
        },
        stockQty: {
            type: Number,
            required: true,
            default: 0,
        },
        attributes: {
            type: Object,
            default: {},
        },
        images: [{
            type: String,
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Calculate final price before saving
productVariantSchema.pre('save', function (next) {
    const variant = this;
    
    // Calculate base price
    let basePrice = variant.netWeight * variant.metalRate;
    
    // Add wastage
    const wastageAmount = (basePrice * variant.wastagePercentage) / 100;
    basePrice += wastageAmount;
    
    // Add making charges
    let makingCharge = 0;
    if (variant.makingChargeType === 'PerGram') {
        makingCharge = variant.netWeight * variant.makingChargeValue;
    } else {
        makingCharge = variant.makingChargeValue;
    }
    basePrice += makingCharge;
    
    // Add stone price
    basePrice += variant.stonePrice;
    
    // Add GST
    const gstAmount = (basePrice * variant.gstPercentage) / 100;
    const finalPrice = basePrice + gstAmount;
    
    variant.finalPrice = Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
    
    next();
});

module.exports = mongoose.model('ProductVariant', productVariantSchema);


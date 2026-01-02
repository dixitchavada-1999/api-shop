const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductVariant',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
        },
        grossWeight: {
            type: Number,
            required: true,
        },
        netWeight: {
            type: Number,
            required: true,
        },
        pricePerUnit: {
            type: Number,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('OrderItem', orderItemSchema);


const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
        orderDate: {
            type: Date,
            default: Date.now,
        },
        totalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Partial', 'Paid'],
            default: 'Pending',
        },
        orderStatus: {
            type: String,
            enum: ['Placed', 'Processing', 'Completed', 'Cancelled'],
            default: 'Placed',
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Order', orderSchema);

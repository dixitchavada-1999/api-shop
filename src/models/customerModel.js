const mongoose = require('mongoose');

const customerSchema = mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        mobile: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
        },
        shopName: {
            type: String,
        },
        gstNumber: {
            type: String,
            uppercase: true,
            trim: true,
        },
        address: {
            line1: { type: String },
            city: { type: String },
            state: { type: String },
            pincode: { type: String },
        },
        outstandingAmount: {
            type: Number,
            default: 0,
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

module.exports = mongoose.model('Customer', customerSchema);


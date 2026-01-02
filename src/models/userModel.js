const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        name: {
            type: String,
            required: false, // Keep for backward compatibility
        },
        firstName: {
            type: String,
            required: function() {
                return !this.name; // Required if name is not provided
            },
        },
        lastName: {
            type: String,
            required: function() {
                return !this.name;
            },
        },
        userName: {
            type: String,
            unique: true,
            sparse: true, // Allows null values
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        mobileNumber: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
            enum: ['ADMIN', 'USER'],
            default: 'USER',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        deviceId: {
            type: String,
            trim: true,
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function () {
    // Only hash password if it has been modified
    if (!this.isModified('password')) {
        return;  // Skip hashing
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;

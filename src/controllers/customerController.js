const Customer = require('../models/customerModel');

// @desc    Get all customers (Tenant scoped)
// @route   GET /api/customers
// @access  Private (Admin/User)
const getCustomers = async (req, res, next) => {
    try {
        const customers = await Customer.find({
            tenantId: req.user.tenantId,
            isActive: true,
        });

        res.json({
            success: true,
            count: customers.length,
            data: customers,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Private (Admin/User)
const getCustomerById = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            res.status(404);
            throw new Error('Customer not found');
        }

        // Check tenant ownership
        if (customer.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to access this customer');
        }

        res.json({
            success: true,
            data: customer,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private/Admin
const createCustomer = async (req, res, next) => {
    try {
        const { name, mobile, email, shopName, gstNumber, address } = req.body;

        // Validate required fields
        if (!name || !mobile) {
            res.status(400);
            throw new Error('Please provide name and mobile number');
        }

        const customer = await Customer.create({
            tenantId: req.user.tenantId,
            name,
            mobile,
            email,
            shopName,
            gstNumber,
            address,
            outstandingAmount: 0,
            isActive: true,
        });

        res.status(201).json({
            success: true,
            data: customer,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private/Admin
const updateCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            res.status(404);
            throw new Error('Customer not found');
        }

        // Check tenant ownership
        if (customer.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this customer');
        }

        customer.name = req.body.name || customer.name;
        customer.mobile = req.body.mobile || customer.mobile;
        customer.email = req.body.email !== undefined ? req.body.email : customer.email;
        customer.shopName = req.body.shopName !== undefined ? req.body.shopName : customer.shopName;
        customer.gstNumber = req.body.gstNumber !== undefined ? req.body.gstNumber : customer.gstNumber;
        customer.address = req.body.address !== undefined ? req.body.address : customer.address;
        customer.outstandingAmount = req.body.outstandingAmount !== undefined ? req.body.outstandingAmount : customer.outstandingAmount;
        customer.isActive = req.body.isActive !== undefined ? req.body.isActive : customer.isActive;

        const updatedCustomer = await customer.save();

        res.json({
            success: true,
            data: updatedCustomer,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            res.status(404);
            throw new Error('Customer not found');
        }

        // Check tenant ownership
        if (customer.tenantId.toString() !== req.user.tenantId.toString()) {
            res.status(403);
            throw new Error('Not authorized to delete this customer');
        }

        await customer.deleteOne();

        res.json({
            success: true,
            message: 'Customer removed successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
};


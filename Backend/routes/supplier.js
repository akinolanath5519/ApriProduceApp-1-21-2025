const express = require('express');
const Supplier = require('../models/supplier'); // Import the Supplier model
const { authMiddleware, verifyAdminOrStandard } = require('../middleware/authMiddleware'); // Import the middleware for authentication

const router = express.Router();

// Create a Supplier
router.post('/supplier', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    const { name, contact, address } = req.body;


    const supplier = new Supplier({
        name,
        contact,
        address,
        adminEmail: req.user.adminEmail, // Link supplier to the admin
    });

    try {
        
        await supplier.save();
        res.status(201).json({ message: 'Supplier created successfully', supplier });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

// Get All Suppliers
router.get('/supplier', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    try {
        const suppliers = await Supplier.findAll({
            where: { adminEmail: req.user.adminEmail },
        });
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

// Get a Single Supplier by ID
router.get('/supplier/:id', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    try {
        const supplier = await Supplier.findOne({
            where: { id: req.params.id, adminEmail: req.user.adminEmail },
        });

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.status(200).json(supplier);
    } catch (error) {
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

// Update a Supplier by ID
router.put('/supplier/:id', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    const { name, contact, address } = req.body;

    try {
        const supplier = await Supplier.findOne({
            where: { id: req.params.id, adminEmail: req.user.adminEmail },
        });

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found or unauthorized' });
        }

        // Update supplier properties
        supplier.name = name;
        supplier.contact = contact;
        supplier.address = address;
        await supplier.save();

        res.status(200).json({ message: 'Supplier updated successfully', supplier });
    } catch (error) {
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

// Delete a Supplier by ID
router.delete('/supplier/:id', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    try {
        const deletedCount = await Supplier.destroy({
            where: {
                id: req.params.id,
                adminEmail: req.user.adminEmail
            }
        });

        if (!deletedCount) {
            return res.status(404).json({ message: 'Supplier not found or unauthorized' });
        }

        res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

module.exports = router;

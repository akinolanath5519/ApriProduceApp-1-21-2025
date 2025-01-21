// routes/companyInfo.js
const express = require('express');
const CompanyInfo = require('../models/companyInfo'); // Import the CompanyInfo model
const { authMiddleware, verifyAdminOrStandard } = require('../middleware/authMiddleware'); // Import the middleware for authentication

const router = express.Router();


// Create Company Information
router.post('/company', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    const { name, address, phone, email } = req.body;

    const companyInfo = new CompanyInfo({
        name,
        address,
        phone,
        email,
        adminEmail: req.user.adminEmail, // Link company info to the admin
    });

    try {
        await companyInfo.save();
        console.log(`Company information created successfully by user: ${req.user.adminEmail}`); // Log success message
        res.status(201).json({ message: 'Company information created successfully', companyInfo });
    } catch (error) {
        console.error('Error creating company information:', error); // Log error to console
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

// Get All Company Information
router.get('/company', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    try {
        const companies = await CompanyInfo.findAll({
            where: { adminEmail: req.user.adminEmail }, // Ensure companies belong to the admin
        });
        console.log(`Fetched company information for user: ${req.user.adminEmail}`); // Log fetch success
        res.status(200).json(companies);
    } catch (error) {
        console.error('Error fetching company information:', error); // Log error to console
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

// Get a Single Company Information by ID
router.get('/company/:id', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    try {
        const companyInfo = await CompanyInfo.findOne({
            where: { id: req.params.id, adminEmail: req.user.adminEmail },
        });

        if (!companyInfo) {
            console.warn(`Company information not found for user: ${req.user.adminEmail}, ID: ${req.params.id}`); // Log warning if not found
            return res.status(404).json({ message: 'Company information not found' });
        }
        console.log(`Fetched company information ID: ${req.params.id} for user: ${req.user.adminEmail}`); // Log fetch success
        res.status(200).json(companyInfo);
    } catch (error) {
        console.error('Error fetching company information:', error); // Log error to console
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

// Update Company Information by ID
router.put('/company/:id', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    const { name, address, phone, email } = req.body;

    try {
        const companyInfo = await CompanyInfo.findOne({
            where: { id: req.params.id, adminEmail: req.user.adminEmail },
        });

        if (!companyInfo) {
            console.warn(`Company information not found for update by user: ${req.user.adminEmail}, ID: ${req.params.id}`); // Log warning if not found
            return res.status(404).json({ message: 'Company information not found or unauthorized' });
        }

        // Update company properties
        companyInfo.name = name;
        companyInfo.address = address;
        companyInfo.phone = phone;
        companyInfo.email = email;
        await companyInfo.save();
        

        console.log(`Company information updated successfully by user: ${req.user.adminEmail}, ID: ${req.params.id}`); // Log success message
        res.status(200).json({ message: 'Company information updated successfully', companyInfo });
    } catch (error) {
        console.error('Error updating company information:', error); // Log error to console
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

// Delete Company Information by ID
router.delete('/company/:id', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    try {
        const deletedCount = await CompanyInfo.destroy({
            where: {
                id: req.params.id,
                adminEmail: req.user.adminEmail // Ensure only the admin can delete
            }
        });

        if (!deletedCount) {
            console.warn(`Company information not found for deletion by user: ${req.user.adminEmail}, ID: ${req.params.id}`); // Log warning if not found
            return res.status(404).json({ message: 'Company information not found or unauthorized' });
        }

        console.log(`Company information deleted successfully by user: ${req.user.adminEmail}, ID: ${req.params.id}`); // Log success message
        res.status(200).json({ message: 'Company information deleted successfully' });
    } catch (error) {
        console.error('Error deleting company information:', error); // Log error to console
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

module.exports = router;

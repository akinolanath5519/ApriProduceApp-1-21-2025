const express = require('express');
const { Transaction, User } = require('../models/model');
const { Op } = require('sequelize');  // Import Op for Sequelize operators
const { authMiddleware, verifyAdminOrStandard } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a Transaction
router.post('/transaction', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    const { weight, unit, price, rate, commodityName, supplierName, transactionDate } = req.body;

    try {
        // Fetch the associated admin's email only if the user is an admin
        const adminEmail = req.user.isAdmin ? req.user.email : req.user.adminEmail || null;  // Use null if adminEmail is not available

        const transaction = await Transaction.create({
            weight,
            unit,
            price,
            rate,  // Add rate to the transaction
            commodityName,
            supplierName,
            transactionDate,
            userId: req.user.id, // Associate transaction with the logged-in user
            adminEmail: adminEmail, // Set the admin's email for the transaction
        });

        res.status(201).json({ message: 'Transaction record created successfully', transaction });
    } catch (error) {
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});

// Get All Transactions (for admin and users)
router.get('/transaction', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    try {
        console.log('Requesting transactions for userId:', req.user.id);

        // Handle case where adminEmail might be undefined
        const adminEmail = req.user.isAdmin ? req.user.email : req.user.adminEmail || null;

        const transactions = await Transaction.findAll({
            where: {
                [Op.or]: [
                    { userId: req.user.id },  // User's transactions
                    { adminEmail: adminEmail },  // Admin's transactions
                ]
            },
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }], // Include user info (who performed the transaction)
        });

        if (transactions.length === 0) {
            console.log('No transactions found for userId:', req.user.id);
        }

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);

        res.status(500).json({
            error: 'An unexpected error occurred while fetching transactions.',
            details: error.message,
            stack: error.stack,  // Include the stack trace to help debug
        });
    }
});

// Get a Specific Transaction (for admin and users)
router.get('/transaction/:id', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    try {
        // Handle case where adminEmail might be undefined
        const adminEmail = req.user.isAdmin ? req.user.email : req.user.adminEmail || null;

        const transaction = await Transaction.findOne({
            where: { 
                id: req.params.id, 
                [Op.or]: [
                    { userId: req.user.id },  // Allow access if the transaction belongs to the user
                    { adminEmail: adminEmail }  // Allow access if the transaction belongs to the admin
                ]
            },
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction record not found' });
        }

        res.status(200).json(transaction);
    } catch (error) {
        res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
    }
});





// Edit a Transaction (for admin and users)
router.put('/transaction/:id', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    const { id } = req.params;
    const { weight, unit, price, rate, commodityName, supplierName, transactionDate } = req.body;

    try {
        // Handle case where adminEmail might be undefined
        const adminEmail = req.user.isAdmin ? req.user.email : req.user.adminEmail || null;

        // Find the transaction to be updated
        const transaction = await Transaction.findOne({
            where: {
                id: id,
                [Op.or]: [
                    { userId: req.user.id }, // Allow update if the transaction belongs to the user
                    { adminEmail: adminEmail }, // Allow update if the transaction belongs to the admin
                ],
            },
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction record not found or you do not have permission to edit it' });
        }

        // Update the transaction with the new values
        await transaction.update({
            weight,
            unit,
            price,
            rate,
            commodityName,
            supplierName,
            transactionDate,
        });

        res.status(200).json({ message: 'Transaction updated successfully', transaction });
    } catch (error) {
        res.status(500).json({ error: 'An unexpected error occurred while updating the transaction.', details: error.message });
    }
});



// Delete a Transaction (for admin and users)
router.delete('/transaction/:id', authMiddleware, verifyAdminOrStandard, async (req, res) => {
    try {
        const { id } = req.params;

        // Handle case where adminEmail might be undefined
        const adminEmail = req.user.isAdmin ? req.user.email : req.user.adminEmail || null;

        // Check if the transaction exists and belongs to the user or admin
        const transaction = await Transaction.findOne({
            where: {
                id: id,
                [Op.or]: [
                    { userId: req.user.id },  // Allow deletion if the transaction belongs to the user
                    { adminEmail: adminEmail }  // Allow deletion if the transaction belongs to the admin
                ]
            }
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction record not found or you do not have permission to delete it' });
        }

        // If the transaction exists and is authorized, delete it
        await transaction.destroy();

        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An unexpected error occurred while deleting the transaction.', details: error.message });
    }
});

module.exports = router;

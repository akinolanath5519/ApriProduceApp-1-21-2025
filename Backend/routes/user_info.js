const express = require('express');
const { authMiddleware, verifyAdminOrStandard } = require('../middleware/authMiddleware'); 
const User = require("../models/user");
const router = express.Router();

router.get("/users", authMiddleware, verifyAdminOrStandard, async (req, res) => {
    const adminEmail = req.user.adminEmail || req.user.email; // Use adminEmail or fallback to current user's email
    const currentUserId = req.user.id; // Extract current user ID from the token
  
    try {
        // Fetch the admin using the adminEmail
        const admin = await User.findOne({
            where: { email: adminEmail, role: "admin" },
            attributes: ['id', 'name', 'email', 'role'], // Only include required fields
            raw: true, // Ensure a plain object is returned
        });

        // If admin is not found and the current user is not an admin, return an error
        if (!admin && req.user.role !== "admin") {
            return res.status(404).json({ message: "Admin not found." });
        }

        // Fetch all users associated with the adminEmail
        const associatedUsers = await User.findAll({
            where: { adminEmail },
            attributes: ['id', 'name', 'email', 'role'], // Only include required fields
            raw: true, // Ensure plain objects are returned
        });

        // Include the current user in the response and label them
        const usersWithCurrentUserLabel = associatedUsers.map(user => ({
            ...user,
            isCurrentUser: user.id === currentUserId, // Mark current user
        }));

        // Add the admin object as a user in the response, marking it with isCurrentUser if applicable
        if (admin) {
            usersWithCurrentUserLabel.unshift({
                ...admin,
                isCurrentUser: admin.id === currentUserId,
            });
        }

        res.status(200).json({
            admin,
            associatedUsers: usersWithCurrentUserLabel,
        });
    } catch (error) {
        console.error("Error fetching admin and associated users:", error);
        res.status(500).json({ error: "An error occurred while fetching data." });
    }
});

module.exports = router;

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Subscription = require('../models/subscription');
const sequelize = require("../db");
const router = express.Router();

const path = require("path");

console.log(path.resolve(__dirname, "../models/User"));

// Helper function to validate incoming data
const validateEmail = (email) => {
  const re = /\S+@\S+\.\S+/; // Simple regex for email validation
  return re.test(email);
};

// Register Admin
router.post("/register-admin", async (req, res) => {
  const { name, email, password } = req.body;
  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const transaction = await sequelize.transaction(); // Begin transaction

  try {
    const user = await User.create(
      { name, email, password: hashedPassword, role: "admin" },
      { transaction }
    );


    // Set expiry date to a few minutes from now for testing purpose
    const subscriptionDurationMinutes = 2; // Set duration to 5 minutes for testing
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + subscriptionDurationMinutes); // Set expiry to 5 minutes from now

  
    await Subscription.create(
      {
        userId: user.id,
        subscriptionStatus: "active",
        subscriptionExpiry: expiryDate,
        duration: subscriptionDurationMinutes, // Duration set in minutes for testing
      },
      { transaction }
    );

    await transaction.commit(); // Commit the transaction
    res.status(201).json({ message: "Admin registered successfully", expiryDate });
  } catch (error) {
    await transaction.rollback(); // Rollback on error
    console.error("Error in register-admin:", error); // Log the error
    res.status(400).json({ error: error.message });
  }
});



// Register Standard User
router.post("/register-standard", async (req, res) => {
    const { name, email, password, adminEmail } = req.body;
  
    // Find the associated admin
    const admin = await User.findOne({
      where: { email: adminEmail, role: "admin" },
    });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }
  
    // Fetch the admin's current subscription
    const adminSubscription = await Subscription.findOne({
      where: { userId: admin.id },
    });
    if (!adminSubscription) {
      return res.status(400).json({ message: "Admin subscription not found" });
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    const transaction = await sequelize.transaction(); // Begin transaction
  
    try {
      // Create the standard user
      const user = await User.create(
        { name, email, password: hashedPassword, role: "standard", adminEmail },
        { transaction }
      );
  
      // Create subscription for the standard user mirroring the admin's subscription
      await Subscription.create(
        {
          userId: user.id,
          subscriptionStatus: adminSubscription.subscriptionStatus,
          subscriptionExpiry: adminSubscription.subscriptionExpiry,
          duration: adminSubscription.duration, // Use the same duration as the admin's
        },
        { transaction }
      );
  
      await transaction.commit(); // Commit the transaction
      res.status(201).json({ message: "Standard user registered successfully" });
    } catch (error) {
      await transaction.rollback(); // Rollback on error
      res.status(400).json({ error: error.message });
    }
  });
  


// Register Super Admin
router.post("/register-super-admin", async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  const transaction = await sequelize.transaction(); // Begin transaction

  try {
    const superAdminExists = await User.count({
      where: { role: "superadmin" },
      transaction,
    });
    if (superAdminExists > 0) {
      await transaction.rollback(); // Rollback if superadmin exists
      return res.status(400).json({ message: "Superadmin already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const superAdmin = await User.create(
      {
        name,
        email,
        password: hashedPassword,
        role: "superadmin",
      },
      { transaction }
    );

    await transaction.commit(); // Commit the transaction
    res.status(201).json({ message: "Superadmin registered successfully", superAdmin });
  } catch (error) {
    await transaction.rollback(); // Rollback on error
    console.error("Error in register-super-admin:", error); // Log the error
    res.status(400).json({ error: error.message });
  }
});



// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const isFirstLogin = user.firstLogin;

  const token = jwt.sign(
    { id: user.id, role: user.role, adminEmail: user.adminEmail || user.email },
    "secretKey",
    { expiresIn: "48h" }
  );

  if (isFirstLogin) {
    await User.update({ firstLogin: false }, { where: { id: user.id } });
  }

  res.status(200).json({ token, role: user.role, isFirstLogin });
});




module.exports = router;
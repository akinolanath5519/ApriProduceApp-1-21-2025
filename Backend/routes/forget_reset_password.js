// routes/auth.js
const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
require("dotenv").config(); // Load environment variables

const router = express.Router();

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).send("User not found");

    // Generate a reset token
    const token = crypto.randomBytes(20).toString("hex");
    const expiry = new Date(Date.now() + 3600000); 

    // Update user with reset token and expiry
    await user.update({
      reset_token: token,
      token_expiry: expiry,
    });

    // Set up email transport
    const transporter = nodemailer.createTransport({
      secure: true,
      host: "smtp.gmail.com",
      port: 465,
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    // Email content
    const frontendUrl = process.env.FRONTEND_URL; 
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset",
      text: `Click the following link to reset your password: ${frontendUrl}/reset-password?token=${token}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    res.send("Password reset link sent to your email");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

// Render Reset Password Form
router.get("/reset-password", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Token is required");
  }

  // Read the HTML file
  const filePath = path.join(__dirname, "../views/reset_password.html");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error reading the reset password file");
    }

    // Replace the token placeholder with the actual token
    const htmlContent = data.replace("${token}", token);

    // Send the HTML content
    res.send(htmlContent);
  });
});


// Reset Password Route
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body; // Ensure these are extracted from req.body
  console.log("Received token:", token); // Log the received token
  console.log("Received newPassword:", newPassword); // Log the new password

  try {
    // Find user by reset token and ensure token is not expired
    const user = await User.findOne({
      where: {
        reset_token: token,
        token_expiry: { [Op.gt]: new Date() }, // Token should not be expired
      },
    });

    if (!user) return res.status(400).send("Invalid or expired token");

    // Hash the new password and update user record
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      reset_token: null,
      token_expiry: null,
    });

    res.send("Password reset successful");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

module.exports = router;

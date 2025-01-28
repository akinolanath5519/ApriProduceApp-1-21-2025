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
    if (!user) {
      console.log(`User with email ${email} not found`);
      return res.status(404).send("User not found");
    }

    // Generate a reset token
    const token = crypto.randomBytes(20).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour

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
    console.log(`Password reset email sent to ${user.email}`);
    res.send("Password reset link sent to your email");
  } catch (error) {
    console.error(`Error occurred while processing forgot-password request: ${error.message}`);
    res.status(500).send("An error occurred");
  }
});



// Reset Password Route
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      where: {
        reset_token: token,
        token_expiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).send("Invalid or expired token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      reset_token: null,
      token_expiry: null,
    });

    res.send({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).send("An error occurred");
  }
});


module.exports = router;
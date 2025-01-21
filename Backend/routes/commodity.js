const express = require("express");
const Commodity = require("../models/commodity"); // Import the Commodity model
const {
  authMiddleware,
  verifyAdminOrStandard,
} = require("../middleware/authMiddleware"); // Import the middleware for authentication

const router = express.Router();

// Create a Commodity
router.post(
  "/commodity",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    const { name, rate } = req.body;

    const commodity = new Commodity({
      name,
      rate,
      adminEmail: req.user.adminEmail, // Link commodity to the admin
    });

    try {
      await commodity.save();
      console.log(
        `Commodity created successfully by user: ${req.user.adminEmail}`
      ); // Log success message
      res
        .status(201)
        .json({ message: "Commodity created successfully", commodity });
    } catch (error) {
      console.error("Error creating commodity:", error); // Log error to console
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }
      res
        .status(500)
        .json({
          error: "An unexpected error occurred.",
          details: error.message,
        });
    }
  }
);



// Get All Commodities
router.get(
  "/commodity",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    try {
      const commodities = await Commodity.findAll({
        where: { adminEmail: req.user.adminEmail }, // Ensure commodities belong to the admin
      });
      console.log(`Fetched commodities for user: ${req.user.adminEmail}`); // Log fetch success
      res.status(200).json(commodities);
    } catch (error) {
      console.error("Error fetching commodities:", error); // Log error to console
      res
        .status(500)
        .json({
          error: "An unexpected error occurred.",
          details: error.message,
        });
    }
  }
);

// Get a Single Commodity by ID
router.get(
  "/commodity/:id",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    try {
      const commodity = await Commodity.findOne({
        where: { id: req.params.id, adminEmail: req.user.adminEmail },
      });

      if (!commodity) {
        console.warn(
          `Commodity not found for user: ${req.user.adminEmail}, ID: ${req.params.id}`
        ); // Log warning if not found
        return res.status(404).json({ message: "Commodity not found" });
      }
      console.log(
        `Fetched commodity ID: ${req.params.id} for user: ${req.user.adminEmail}`
      ); // Log fetch success
      res.status(200).json(commodity);
    } catch (error) {
      console.error("Error fetching commodity:", error); // Log error to console
      res
        .status(500)
        .json({
          error: "An unexpected error occurred.",
          details: error.message,
        });
    }
  }
);

// Update a Commodity by ID
router.put(
  "/commodity/:id",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    const { name, rate } = req.body;

    try {
      const commodity = await Commodity.findOne({
        where: { id: req.params.id, adminEmail: req.user.adminEmail },
      });

      if (!commodity) {
        console.warn(
          `Commodity not found for update by user: ${req.user.adminEmail}, ID: ${req.params.id}`
        ); // Log warning if not found
        return res
          .status(404)
          .json({ message: "Commodity not found or unauthorized" });
      }

      // Update commodity properties
      commodity.name = name;
      commodity.rate = rate;
      await commodity.save();

      console.log(
        `Commodity updated successfully by user: ${req.user.adminEmail}, ID: ${req.params.id}`
      ); // Log success message
      res
        .status(200)
        .json({ message: "Commodity updated successfully", commodity });
    } catch (error) {
      console.error("Error updating commodity:", error); // Log error to console
      res
        .status(500)
        .json({
          error: "An unexpected error occurred.",
          details: error.message,
        });
    }
  }
);

// Delete a Commodity by ID
router.delete(
  "/commodity/:id",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    try {
      const deletedCount = await Commodity.destroy({
        where: {
          id: req.params.id,
          adminEmail: req.user.adminEmail, // Ensure only the admin can delete
        },
      });

      if (!deletedCount) {
        console.warn(
          `Commodity not found for deletion by user: ${req.user.adminEmail}, ID: ${req.params.id}`
        ); // Log warning if not found
        return res
          .status(404)
          .json({ message: "Commodity not found or unauthorized" });
      }

      console.log(
        `Commodity deleted successfully by user: ${req.user.adminEmail}, ID: ${req.params.id}`
      ); // Log success message
      res.status(200).json({ message: "Commodity deleted successfully" });
    } catch (error) {
      console.error("Error deleting commodity:", error); // Log error to console
      res
        .status(500)
        .json({
          error: "An unexpected error occurred.",
          details: error.message,
        });
    }
  }
);

module.exports = router;

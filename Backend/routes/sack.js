const express = require("express");
const Sack = require("../models/sack"); // Ensure you have a Sack model
const {
  authMiddleware,
  verifyAdminOrStandard,
} = require("../middleware/authMiddleware");

const router = express.Router();


// Create a new sack entry
router.post(
  "/sack",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    const { supplierName, date, bagsCollected, bagsReturned } = req.body;

    // Ensure that bagsCollected and bagsReturned are numbers
    const bagsCollectedNum = Number(bagsCollected);
    const bagsReturnedNum = Number(bagsReturned);
    const bagsRemaining = bagsCollectedNum - bagsReturnedNum;

    const sack = new Sack({
      supplierName,
      date,
      bagsCollected: bagsCollectedNum,
      bagsReturned: bagsReturnedNum,
      bagsRemaining,
      adminEmail: req.user.adminEmail, // Link sack entry to the admin
    });

    try {
      await sack.save();
      console.log(
        `Sack entry created successfully by user: ${req.user.adminEmail}`
      );
      res
        .status(201)
        .json({ message: "Sack entry created successfully", sack });
    } catch (error) {
      console.error("Error creating sack entry:", error);
      res
        .status(500)
        .json({
          error: "An unexpected error occurred.",
          details: error.message,
        });
    }
  }
);

// Get all sack entries
router.get("/sack", authMiddleware, verifyAdminOrStandard, async (req, res) => {
  try {
    const sacks = await Sack.findAll({
      where: { adminEmail: req.user.adminEmail }, // Ensure sacks belong to the admin
    });
    console.log(`Fetched sack entries for user: ${req.user.adminEmail}`);
    res.status(200).json(sacks);
  } catch (error) {
    console.error("Error fetching sack entries:", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred.", details: error.message });
  }
});

// Update a sack entry by ID
router.put(
  "/sack/:id",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    const { supplierName, date, bagsCollected, bagsReturned } = req.body;

    const bagsCollectedNum = Number(bagsCollected);
    const bagsReturnedNum = Number(bagsReturned);
    const bagsRemaining = bagsCollectedNum - bagsReturnedNum;

    try {
      const sack = await Sack.findOne({
        where: { id: req.params.id, adminEmail: req.user.adminEmail },
      });

      if (!sack) {
        console.warn(
          `Sack entry not found for update by user: ${req.user.adminEmail}, ID: ${req.params.id}`
        );
        return res
          .status(404)
          .json({ message: "Sack entry not found or unauthorized" });
      }

      // Update sack properties
      sack.supplierName = supplierName;
      sack.date = date;
      sack.bagsCollected = bagsCollectedNum;
      sack.bagsReturned = bagsReturnedNum;
      sack.bagsRemaining = bagsRemaining; // Set the updated bagsRemaining
      await sack.save();

      console.log(
        `Sack entry updated successfully by user: ${req.user.adminEmail}, ID: ${req.params.id}`
      );
      res
        .status(200)
        .json({ message: "Sack entry updated successfully", sack });
    } catch (error) {
      console.error("Error updating sack entry:", error);
      res
        .status(500)
        .json({
          error: "An unexpected error occurred.",
          details: error.message,
        });
    }
  }
);

// Delete a sack entry by ID
router.delete(
  "/sack/:id",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    try {
      const sack = await Sack.destroy({
        where: { id: req.params.id, adminEmail: req.user.adminEmail },
      });

      if (!sack) {
        console.warn(
          `Sack entry not found for deletion by user: ${req.user.adminEmail}, ID: ${req.params.id}`
        );
        return res
          .status(404)
          .json({ message: "Sack entry not found or unauthorized" });
      }

      console.log(
        `Sack entry deleted successfully by user: ${req.user.adminEmail}, ID: ${req.params.id}`
      );
      res.status(200).json({ message: "Sack entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting sack entry:", error);
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

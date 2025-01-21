const express = require("express");
const { v4: uuidv4 } = require("uuid"); // For generating unique transaction IDs
const BulkWeight = require("../models/bulkweight");

const {
  authMiddleware,
  verifyAdminOrStandard,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/bulkweight",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    const { entries } = req.body; // Array of { bags, weight }
    
    // Check if entries are provided
    if (!entries || !entries.length) {
      return res.status(400).json({
        message: "Entries are required.",
        error: "Missing entries in the request body.",
      });
    }

    const transactionId = uuidv4(); // Generate a unique transaction ID
    const adminEmail = req.user.adminEmail;

    try {
      // Initialize cumulative variables
      let cumulativeBags = 0;
      let cumulativeWeight = 0;

      // Map entries with cumulative totals, reset for new transaction
      const bulkEntries = entries.map((entry, index) => {
        // For the first entry in a new transaction, set cumulative totals
        if (index === 0) {
          cumulativeBags = entry.bags;
          cumulativeWeight = entry.weight;
        } else {
          // For subsequent entries, add to the cumulative totals
          cumulativeBags += entry.bags;
          cumulativeWeight += entry.weight;
        }

        // Return entry with calculated cumulative totals
        return {
          ...entry,
          cumulativeBags,
          cumulativeWeight,
          transactionId,
          adminEmail,
        };
      });

      // Log the entries data before saving
      console.log("Attempting to save entries:", JSON.stringify(bulkEntries, null, 2));

      // Save all entries in one transaction
      const savedEntries = await BulkWeight.bulkCreate(bulkEntries);

      res.status(201).json({
        message: "Transaction saved successfully.",
        transactionId,
        entries: savedEntries, // Returns the saved entries
      });
    } catch (error) {
      console.error("Error saving transaction:", error);

      // Capture the expected data (entries) and actual error data for troubleshooting
      const errorData = {
        expectedData: {
          entries, // Entries sent in the request body
          adminEmail, // Admin email
          transactionId, // Generated transaction ID
        },
        errorDetails: {
          message: error.message, // The error message from the exception
          name: error.name, // Type of error (e.g., SequelizeValidationError)
        },
      };

      // Enhanced error handling with specific context
      if (error.name === 'SequelizeValidationError') {
        // Capture specific validation errors
        const validationErrors = error.errors.map((err) => {
          return {
            field: err.path, // Field that failed validation
            message: err.message, // Specific validation message
          };
        });

        // Log error details for debugging
        console.error("Validation Errors:", JSON.stringify(validationErrors, null, 2));
        console.error("Error Data:", JSON.stringify(errorData, null, 2));

        res.status(400).json({
          message: "Validation failed for some entries.",
          details: validationErrors,
          error: error.name,
          expectedData: errorData.expectedData,
        });
      } else if (error.name === 'SequelizeDatabaseError') {
        res.status(500).json({
          message: "Database error occurred while saving transaction.",
          details: error.message,
          error: error.name,
          expectedData: errorData.expectedData,
        });
      } else {
        res.status(500).json({
          message: "Failed to save transaction.",
          details: error.message,
          error: error.name,
          expectedData: errorData.expectedData,
        });
      }
    }
  }
);


// **Get all entries of a transaction**
router.get(
  "/bulkweight/:transactionId",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    const { transactionId } = req.params;

    try {
      const entries = await BulkWeight.findAll({
        where: { transactionId, adminEmail: req.user.adminEmail },
        order: [["createdAt", "ASC"]],
      });

      if (!entries.length) {
        return res
          .status(404)
          .json({ message: "No entries found for this transaction." });
      }

      const { cumulativeBags, cumulativeWeight } = entries[entries.length - 1];

      res.status(200).json({
        message: "Transaction retrieved successfully.",
        transactionId,
        cumulativeBags,
        cumulativeWeight,
        entries,
      });
    } catch (error) {
      console.error("Error fetching transaction entries:", error);
      res.status(500).json({
        message: "Failed to fetch transaction entries.",
        details: error.message,
      });
    }
  }
);

// **Delete a single entry**
router.delete(
  "/bulkweight/entry/:entryId",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    const { entryId } = req.params;

    const transaction = await BulkWeight.sequelize.transaction();
    let transactionCommitted = false;

    try {
      // Find the entry to be deleted
      const entryToDelete = await BulkWeight.findOne({
        where: { id: entryId, adminEmail: req.user.adminEmail },
        transaction,
      });

      if (!entryToDelete) {
        return res
          .status(404)
          .json({ message: "Entry not found or already deleted." });
      }

      // Delete the entry
      await entryToDelete.destroy({ transaction });

      // Fetch all remaining entries for this transaction
      const remainingEntries = await BulkWeight.findAll({
        where: {
          transactionId: entryToDelete.transactionId,
          adminEmail: req.user.adminEmail,
        },
        order: [["createdAt", "ASC"]],
        transaction,
      });

      // Recalculate cumulative values for remaining entries
      let cumulativeBags = 0;
      let cumulativeWeight = 0;

      for (const entry of remainingEntries) {
        cumulativeBags += entry.bags;
        cumulativeWeight += entry.weight;

        entry.cumulativeBags = cumulativeBags;
        entry.cumulativeWeight = cumulativeWeight;

        await entry.save({ transaction });
      }

      await transaction.commit();
      transactionCommitted = true;

      res.status(200).json({ message: "Entry deleted successfully.", entryId });
    } catch (error) {
      console.error("Error deleting entry:", error);

      if (!transactionCommitted) {
        await transaction.rollback();
      }

      res
        .status(500)
        .json({ message: "Failed to delete entry.", details: error.message });
    }
  }
);

// **Update a single entry**
router.put(
  "/bulkweight/:entryId",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    const { entryId } = req.params;
    const { bags, weight } = req.body;

    if (bags === undefined || weight === undefined) {
      console.error("Validation error: Bags or weight is missing.");
      return res
        .status(400)
        .json({ message: "Bags and weight are required to update entry." });
    }

    const transaction = await BulkWeight.sequelize.transaction();
    let transactionCommitted = false; // Track if the transaction has been committed

    try {
      console.log(`[DEBUG] Attempting to update entry with ID: ${entryId}`);

      const entry = await BulkWeight.findOne({
        where: { id: entryId, adminEmail: req.user.adminEmail },
        transaction,
      });

      if (!entry) {
        console.error(`[DEBUG] Entry with ID ${entryId} not found.`);
        return res.status(404).json({ message: "Entry not found." });
      }

      console.log(`[DEBUG] Entry found: ${JSON.stringify(entry)}`);

      // Fetch all previous entries for this transaction ID
      const previousEntries = await BulkWeight.findAll({
        where: {
          transactionId: entry.transactionId,
          adminEmail: req.user.adminEmail,
        },
        order: [["createdAt", "ASC"]],
        transaction,
      });

      console.log(
        `[DEBUG] Fetched previous entries for transactionId: ${entry.transactionId}`
      );
      console.log(`[DEBUG] Entries: ${JSON.stringify(previousEntries)}`);

      // Recalculate cumulative values
      let cumulativeBags = 0;
      let cumulativeWeight = 0;

      for (const prevEntry of previousEntries) {
        if (prevEntry.id === parseInt(entryId, 10)) {
          console.log(`[DEBUG] Updating entry with ID: ${entryId}`);
          prevEntry.bags = bags;
          prevEntry.weight = weight;

          // Update cumulative fields
          prevEntry.setDataValue("cumulativeBags", cumulativeBags + bags);
          prevEntry.setDataValue("cumulativeWeight", cumulativeWeight + weight);

          prevEntry.changed("bags", true);
          prevEntry.changed("weight", true);
          prevEntry.changed("cumulativeBags", true);
          prevEntry.changed("cumulativeWeight", true);
        }

        // Update cumulative values for subsequent entries
        cumulativeBags += prevEntry.bags;
        cumulativeWeight += prevEntry.weight;

        prevEntry.cumulativeBags = cumulativeBags;
        prevEntry.cumulativeWeight = cumulativeWeight;

        console.log(`[DEBUG] Before save: ${JSON.stringify(prevEntry)}`);
        await prevEntry.save({ transaction });
        console.log(`[DEBUG] After save: ${JSON.stringify(prevEntry)}`);
      }

      await transaction.commit();
      transactionCommitted = true; // Mark transaction as committed
      console.log(`[DEBUG] Transaction committed successfully.`);

      // Re-fetch the updated entry after the transaction
      const updatedEntry = await BulkWeight.findOne({
        where: { id: entryId, adminEmail: req.user.adminEmail },
      });

      console.log(
        `[DEBUG] Reloaded updated entry: ${JSON.stringify(updatedEntry)}`
      );

      res.status(200).json({
        message: "Entry updated successfully.",
        entry: updatedEntry,
      });
    } catch (error) {
      console.error("[DEBUG] Error during update operation:", error);

      if (!transactionCommitted) {
        await transaction.rollback();
        console.error("[DEBUG] Transaction rolled back.");
      }

      res
        .status(500)
        .json({ message: "Failed to update entry.", details: error.message });
    }
  }
);

// **Get all transactions grouped by entries**
router.get(
  "/bulkweight",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    try {
      const transactions = await BulkWeight.findAll({
        where: { adminEmail: req.user.adminEmail },
        order: [["createdAt", "ASC"]],
        attributes: [
          "id",
          "bags",
          "weight",
          "cumulativeBags",
          "cumulativeWeight",
          "transactionId",
          "adminEmail",
          "createdAt", // Explicitly include this
        ],
      });

      if (!transactions.length) {
        return res.status(404).json({ message: "No transactions found." });
      }

      const groupedTransactions = transactions.reduce((acc, entry) => {
        if (!acc[entry.transactionId]) {
          acc[entry.transactionId] = [];
        }
        acc[entry.transactionId].push(entry);
        return acc;
      }, {});

      res.status(200).json({
        message: "Transactions retrieved successfully.",
        transactions: groupedTransactions,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({
        message: "Failed to fetch transactions.",
        details: error.message,
      });
    }
  }
);

// **Delete a transaction**
router.delete(
  "/bulkweight/:transactionId",
  authMiddleware,
  verifyAdminOrStandard,
  async (req, res) => {
    const { transactionId } = req.params;

    try {
      const deletedCount = await BulkWeight.destroy({
        where: { transactionId, adminEmail: req.user.adminEmail },
      });

      if (deletedCount === 0) {
        return res
          .status(404)
          .json({ message: "Transaction not found or already deleted." });
      }

      res
        .status(200)
        .json({ message: "Transaction deleted successfully.", transactionId });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({
        message: "Failed to delete transaction.",
        details: error.message,
      });
    }
  }
);

module.exports = router;
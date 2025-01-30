const fs = require('fs');
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables from .env file

const certificatePath = 'C:/AgriproducePayUpdated-1-21-2025/Backend/ca-certificate.crt'; // Use the correct local path

// Debugging: Check if DATABASE_URL is loaded correctly
console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);

// Ensure DATABASE_URL is present in environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing. Check your .env file.");
}

// Initialize Sequelize with connection details from environment variables
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Only use this for cloud-hosted DBs like DigitalOcean
      ca: fs.readFileSync(certificatePath), // Reference the certificate file here
    },
  },
});

// Test the connection to the PostgreSQL database
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL successfully");
  } catch (error) {
    console.error("❌ Unable to connect to PostgreSQL:", error);
  }
})();

// Export sequelize instance for use in other modules
module.exports = sequelize;

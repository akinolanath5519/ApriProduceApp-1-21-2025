const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables from .env file
const fs = require('fs');

// Debugging: Check if DATABASE_URL is loaded correctly
console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);

// Ensure DATABASE_URL is present in environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing. Check your .env file.");
}

// Path to your SSL certificate from the environment variable
const sslOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false, // Set to true for stricter validation
    ca: fs.readFileSync(process.env.CA_CERT_PATH).toString()  // Use the path from the .env file
  }
};

// Initialize Sequelize with connection details from environment variables and SSL options
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: sslOptions,
});

// Test the connection to the PostgreSQL database
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL successfully with SSL");
  } catch (error) {
    console.error("❌ Unable to connect to PostgreSQL:", error);
  }
})();

// Export sequelize instance for use in other modules
module.exports = sequelize;

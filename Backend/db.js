const fs = require('fs');
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables from .env file

const certificatePath = 'C:/AgriproducePayUpdated-1-21-2025/Backend/ca-certificate.crt'; // Path to your SSL certificate

// Debugging: Check if DATABASE_URL is loaded correctly
console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);

// Ensure DATABASE_URL is present in environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing. Check your .env file.");
}

// Verify if the certificate file exists
if (!fs.existsSync(certificatePath)) {
  throw new Error(`❌ SSL certificate not found at ${certificatePath}. Please check the path.`);
}

// Initialize Sequelize with connection details from environment variables
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Allow self-signed certificates
      ca: fs.readFileSync(certificatePath), // Add the SSL certificate for secure connection
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

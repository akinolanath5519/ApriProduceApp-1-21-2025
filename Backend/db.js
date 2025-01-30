const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables from .env file

// Debugging: Check if DATABASE_URL is loaded correctly
console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing. Check your .env file.");
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Only use this for cloud-hosted DBs like DigitalOcean
    },
  },
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL successfully");
  } catch (error) {
    console.error("❌ Unable to connect to PostgreSQL:", error);
  }
})();

module.exports = sequelize;

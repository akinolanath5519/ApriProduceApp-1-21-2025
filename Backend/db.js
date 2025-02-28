const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    dialectOptions: {
      socketPath: process.env.DB_HOST, 
      ssl: false, // Disable SSL
    },
    port: process.env.DB_PORT,
    logging: false, // Optional: Disable logs
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL successfully");
  } catch (error) {
    console.error("❌ Unable to connect to PostgreSQL:", error);
  }
})();

module.exports = sequelize;

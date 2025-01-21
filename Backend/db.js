
const { Sequelize } = require("sequelize");
require("dotenv").config(); // Load environment variables from .env file

// Create a Sequelize instance with MySQL credentials from environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL");
  } catch (error) {
    console.error("Unable to connect to MySQL:", error);
  }
})();

module.exports = sequelize;

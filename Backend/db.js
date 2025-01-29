// db.js (MySQL connection setup)
const { Sequelize } = require("sequelize");
require("dotenv").config(); // Load environment variables from .env file

// Create a Sequelize instance with MySQL credentials from environment variables
const sequelize = new Sequelize(
  process.env.MySQL_DB_NAME,
  process.env.MySQL_DB_USER,
  process.env.MySQL_PASSWORD,
  {
    host: process.env.MySQL_HOST,
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



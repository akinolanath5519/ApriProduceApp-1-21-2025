const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables from .env file

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST, // This should be the Cloud SQL socket path
  dialect: 'postgres',
  dialectOptions: {
    // Remove SSL if the server doesn't support it
    ssl: false, // Disable SSL
  },
  logging: console.log, // Enable logging to see queries in the console (optional)
});

(async () => {
  try {
    await sequelize.authenticate(); // Test the connection
    console.log("Connected to PostgreSQL successfully");
  } catch (error) {
    console.error("Unable to connect to PostgreSQL:", error);
  }
})();

module.exports = sequelize;

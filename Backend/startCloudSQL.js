const { Sequelize } = require('sequelize');
require('dotenv').config();

// Set up the Sequelize connection to Cloud SQL
const sequelize = new Sequelize(
  process.env.DB_NAME, // Database name
  process.env.DB_USER, // Database user
  process.env.DB_PASSWORD, // Database password
  {
    host: process.env.DB_HOST, // Cloud SQL instance connection
    dialect: 'postgres', // Database type
    dialectOptions: {
      socketPath: process.env.DB_SOCKET_PATH, // Cloud SQL socket connection (for Cloud Functions)
    },
    logging: false, // Optional: Disable logging for clean output
  }
);

// Cloud Function that connects to the PostgreSQL database
exports.startCloudSQL = async (req, res) => {
  try {
    // Attempt to authenticate with the database
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL successfully');
    res.status(200).send('Cloud SQL started successfully');
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error);
    res.status(500).send('Failed to start Cloud SQL');
  }
};

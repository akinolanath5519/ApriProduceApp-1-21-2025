const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables from .env file

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Only use this if necessary, for cloud-hosted DBs like Render
    },
  },
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL successfully");
  } catch (error) {
    console.error("Unable to connect to PostgreSQL:", error);
  }
})();

module.exports = sequelize;



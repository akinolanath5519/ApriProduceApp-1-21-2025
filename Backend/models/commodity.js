const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db"); // Ensure you have your Sequelize instance configured

class Commodity extends Model {}

Commodity.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false, // Ensure name is required
    },
    rate: {
      type: DataTypes.FLOAT, // Use FLOAT for decimal rates
      allowNull: false, // Ensure rate is required
      validate: {
        min: 0, // Ensure rate is not negative
      },
    },
    adminEmail: {
      type: DataTypes.STRING,
    
    },
  },
  {
    sequelize,
    modelName: "Commodity", // This will create the "Commodities" table
    timestamps: true, // Enable createdAt and updatedAt fields
  }
);

module.exports = Commodity;

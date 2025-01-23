const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db"); // Import Sequelize instance

class BulkWeight extends Model {}

BulkWeight.init(
  {
    bags: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    cumulativeBags: {
      type: DataTypes.INTEGER, // Running total of bags
      allowNull: false,
      defaultValue: 0,
    },
    cumulativeWeight: {
      type: DataTypes.FLOAT, // Running total of weight
      allowNull: false,
      defaultValue: 0,
    },
    transactionId: {
      type: DataTypes.STRING, // Unique transaction ID
      allowNull: false,
    },
    adminEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "BulkWeight",
    timestamps: true, // Adds `createdAt` and `updatedAt` columns
  }
);

module.exports = BulkWeight;

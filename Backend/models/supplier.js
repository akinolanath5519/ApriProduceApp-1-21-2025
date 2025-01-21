// models/supplier.js
const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db"); // Ensure you have your Sequelize instance configured

class Supplier extends Model {}

Supplier.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false, // Ensure name is required
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: false, // Ensure contact is required
      validate: {
        len: {
          args: [8, 15], // Ensure contact is between 8 and 15 characters
          msg: "Contact number must be between 8 and 15 digits long",
        },
      },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false, // Ensure address is required
    },
    adminEmail: {
      type: DataTypes.STRING,
      // Ensure adminEmail is required
    },
  },

  {
    sequelize,
    modelName: "Supplier", // This will create the "Suppliers" table
    timestamps: true, // Enable createdAt and updatedAt fields
  }
);

module.exports = Supplier;

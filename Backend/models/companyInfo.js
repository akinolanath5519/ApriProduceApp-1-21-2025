// models/companyInfo.js
const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db"); // Ensure you have your Sequelize instance configured

class CompanyInfo extends Model {}

CompanyInfo.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false, // Ensure name is required
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false, // Ensure address is required
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false, // Ensure phone number is required
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false, // Ensure email is required
      validate: {
        isEmail: true, // Validate the email format
      },
    },
    adminEmail: {
      type: DataTypes.STRING,
      // Optional field to associate the company with an admin
    },
  },
  {
    sequelize,
    modelName: "CompanyInfo", // This will create the "CompanyInfos" table
    timestamps: true, // Enable createdAt and updatedAt fields
  }
);

module.exports = CompanyInfo;

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");

const Sack = sequelize.define('Sack', {
    supplierName: {
        type: DataTypes.STRING,  // Use DataTypes instead of Sequelize
        allowNull: false,
    },
    date: {
        type: DataTypes.DATE,  // Use DataTypes instead of Sequelize
        allowNull: false,
    },
    bagsCollected: {
        type: DataTypes.INTEGER,  // Use DataTypes instead of Sequelize
        allowNull: false,
    },
    bagsReturned: {
        type: DataTypes.INTEGER,  // Use DataTypes instead of Sequelize
        allowNull: false,
    },
    
    bagsRemaining: {
        type: DataTypes.INTEGER,  // Use DataTypes instead of Sequelize
        allowNull: false, // This should be true if you want to enforce that it must have a value
    },
    adminEmail: {
        type: DataTypes.STRING,  // Use DataTypes instead of Sequelize
     
    },
});

// If you need to add any additional methods or hooks, you can define them here

module.exports = Sack;

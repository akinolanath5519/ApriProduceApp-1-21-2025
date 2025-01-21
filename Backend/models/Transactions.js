const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class Transaction extends Model {}

Transaction.init(
    {
        weight: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            validate: { min: 0 },
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            validate: { min: 0 },
        },
        rate:{
            type: DataTypes.DOUBLE,
            allowNull: false,
            validate: { min: 0 },
        },
        commodityName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        supplierName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        transactionDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        adminEmail: {
            type: DataTypes.STRING,
        },
    },
    {
        sequelize,
        modelName: 'Transaction',
        timestamps: true,
    }
);

Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
    });
};

module.exports = Transaction;

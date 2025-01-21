const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('superadmin', 'admin', 'standard'),
        defaultValue: 'standard',
    },
    adminEmail: {
        type: DataTypes.STRING,
        defaultValue: null,
    },
    reset_token: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    token_expiry: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    firstLogin: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
});


User.associate = (models) => {
    User.hasMany(models.Transaction, {
        foreignKey: 'userId',
        as: 'transactions',
    });
};

module.exports = User;

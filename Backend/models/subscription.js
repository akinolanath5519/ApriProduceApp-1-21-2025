const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Subscription = sequelize.define('Subscription', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // This should match the name of the user table
            key: 'id'
        }
    },
    
    subscriptionStatus: {
        type: DataTypes.ENUM('active', 'expired'),
        defaultValue: 'expired'
    },
    subscriptionExpiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false // Ensuring duration is required
    }
});

module.exports = Subscription;

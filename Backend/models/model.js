// Import models
const User = require('./user');
const Transaction = require('./Transactions');

// Establish associations between models
User.associate = (models) => {
    User.hasMany(models.Transaction, {
        foreignKey: 'userId',
        as: 'transactions',
    });
};


Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
    });
};

// Call the association methods to link models
User.associate({ Transaction });
Transaction.associate({ User });

// Export models
module.exports = { User, Transaction };

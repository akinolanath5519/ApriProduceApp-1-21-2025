const crypto = require('crypto');

// Generate random strings
const jwtSecret = crypto.randomBytes(64).toString('hex'); // 64 bytes -> 128 characters
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

console.log("JWT_SECRET:", jwtSecret);
console.log("JWT_REFRESH_SECRET:", jwtRefreshSecret);

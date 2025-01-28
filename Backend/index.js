// app.js (Express setup with MySQL via Sequelize)
const express = require("express");
const cors = require("cors");
const sequelize = require("./db"); // MySQL connection
const authRoutes = require("./routes/auth");
const supplierRoutes = require("./routes/supplier");
const commodityRoutes = require("./routes/commodity");
const sackRoutes = require("./routes/sack");
const bulkWeightRoutes=require("./routes/bulkweight")
const transactionRoutes = require("./routes/transaction");
const companyInfoRoutes = require("./routes/companyInfo");
const forgetResetPassword = require("./routes/forget_reset_password");
const subscriptionRoutes = require("./routes/subscription");
const userInfoRoutes = require("./routes/user_info");




const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use CORS middleware
app.use(cors());





// Sync Sequelize models
sequelize
  .sync()
  .then(() => {
    console.log("Database synced");
  })
  .catch((err) => console.log(err));

// Use routes
app.use(authRoutes);
app.use(forgetResetPassword);
app.use(supplierRoutes);
app.use(commodityRoutes);
app.use(sackRoutes);
app.use(transactionRoutes);
app.use(companyInfoRoutes);
app.use(subscriptionRoutes);
app.use(bulkWeightRoutes);
app.use(userInfoRoutes)

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

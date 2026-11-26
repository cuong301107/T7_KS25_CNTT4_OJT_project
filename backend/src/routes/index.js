const express = require("express");
const productRoutes = require("./product.routes");
const adminRoutes = require("./admin.routes");

const router = express.Router();
router.use("/products", productRoutes);
router.use("/admin", adminRoutes);

module.exports = router;

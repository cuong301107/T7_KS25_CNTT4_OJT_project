const express = require("express");
const authRoutes = require("./auth.routes");
const cartRoutes = require("./cart.routes");
const orderRoutes = require("./order.routes");

const router = express.Router();
router.use("/auth", authRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);

module.exports = router;

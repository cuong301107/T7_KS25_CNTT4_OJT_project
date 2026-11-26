const express = require("express");
const authRoutes = require("./auth.routes");
const cartRoutes = require("./cart.routes");

const router = express.Router();
router.use("/auth", authRoutes);
router.use("/cart", cartRoutes);

module.exports = router;

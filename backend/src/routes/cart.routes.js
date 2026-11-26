const express = require("express");
const router = express.Router();
const cart = require("../controllers/cartController");
const { requireAuth } = require("../middlewares/auth");

router.use(requireAuth);

router.get("/", cart.getCart);
router.get("/count", cart.count);
router.post("/", cart.addItem);
router.put("/:itemId", cart.updateItem);
router.delete("/:itemId", cart.removeItem);

module.exports = router;

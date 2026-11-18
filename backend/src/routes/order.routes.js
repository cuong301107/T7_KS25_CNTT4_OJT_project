const express = require('express');
const router = express.Router();
const order = require('../controllers/orderController');
const { requireAuth } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', order.listMyOrders);
router.post('/', order.create);
router.get('/:id', order.getMyOrder);
router.post('/:id/cancel', order.cancelOrder);

module.exports = router;

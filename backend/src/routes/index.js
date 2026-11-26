const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/', require('./product.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/orders', require('./order.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;

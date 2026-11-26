const express = require('express');
const router = express.Router();
const product = require('../controllers/productController');
const category = require('../controllers/categoryController');
const review = require('../controllers/reviewController');
const { requireAuth } = require('../middlewares/auth');

// San pham (cong khai)
router.get('/products', product.list);
router.get('/products/:id', product.detail);

// Danh muc (cong khai)
router.get('/categories', category.list);

// Danh gia san pham
router.get('/products/:productId/reviews', review.listByProduct);
router.post('/products/:productId/reviews', requireAuth, review.createOrUpdate);

module.exports = router;

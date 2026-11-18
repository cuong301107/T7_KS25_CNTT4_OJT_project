const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { requireAuth, adminOnly } = require('../middlewares/auth');

router.use(requireAuth, adminOnly);

// Dashboard
router.get('/stats', admin.stats);

// San pham
router.get('/products', admin.listProducts);
router.post('/products', admin.createProduct);
router.put('/products/:id', admin.updateProduct);
router.delete('/products/:id', admin.deleteProduct);

// Danh muc
router.get('/categories', admin.listCategories);
router.post('/categories', admin.createCategory);
router.put('/categories/:id', admin.updateCategory);
router.delete('/categories/:id', admin.deleteCategory);

// Don hang
router.get('/orders', admin.listOrders);
router.get('/orders/:id', admin.getOrder);
router.put('/orders/:id/status', admin.updateOrderStatus);

// Nguoi dung
router.get('/users', admin.listUsers);
router.get('/users/:id', admin.getUser);
router.patch('/users/:id/status', admin.toggleUserStatus);

module.exports = router;

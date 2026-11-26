const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const admin = require('../controllers/adminController');
const { requireAuth, adminOnly } = require('../middlewares/auth');

router.use(requireAuth, adminOnly);

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
      return cb(new Error('Chỉ hỗ trợ ảnh JPG, PNG, GIF hoặc WebP.'));
    }
    cb(null, true);
  }
});

router.post('/products/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh.' });
  res.status(201).json({
    success: true,
    data: { image_url: `/uploads/${req.file.filename}` }
  });
});

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

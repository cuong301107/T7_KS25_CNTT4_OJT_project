const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.listByProduct = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId);
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.full_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC, r.id DESC`,
    [productId]
  );
  const [[stats]] = await pool.query(
    'SELECT COUNT(*) AS total, COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating FROM reviews WHERE product_id = ?',
    [productId]
  );
  res.json({
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      rating: Number(r.rating),
      comment: r.comment,
      created_at: r.created_at,
      full_name: r.full_name
    })),
    stats: { total: Number(stats.total), avg_rating: Number(stats.avg_rating) }
  });
});

exports.createOrUpdate = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId);
  const rating = parseInt(req.body && req.body.rating);
  const comment = ((req.body && req.body.comment) || '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Điểm đánh giá phải từ 1 đến 5 sao.');
  }
  if (comment.length > 1000) throw new ApiError(400, 'Nội dung đánh giá tối đa 1000 ký tự.');

  const [prods] = await pool.query('SELECT id, status FROM products WHERE id = ?', [productId]);
  if (!prods.length) throw new ApiError(404, 'Sản phẩm không tồn tại.');
  if (prods[0].status !== 'ACTIVE') throw new ApiError(400, 'Sản phẩm đã ngừng kinh doanh.');

  const [existing] = await pool.query('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?', [
    req.user.id,
    productId
  ]);

  if (existing.length) {
    await pool.query('UPDATE reviews SET rating = ?, comment = ? WHERE id = ?', [
      rating,
      comment || null,
      existing[0].id
    ]);
    res.json({ success: true, message: 'Đã cập nhật đánh giá của bạn.' });
  } else {
    await pool.query('INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)', [
      req.user.id,
      productId,
      rating,
      comment || null
    ]);
    res.status(201).json({ success: true, message: 'Cảm ơn bạn đã đánh giá sản phẩm.' });
  }
});

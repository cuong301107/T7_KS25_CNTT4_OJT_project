const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    stock_quantity: Number(p.stock_quantity),
    stock: Number(p.stock_quantity),
    image_url: p.image_url,
    image: p.image_url,
    imageUrl: p.image_url,
    status: p.status,
    category_id: p.category_id,
    categoryId: p.category_id,
    category_name: p.category_name || null,
    categoryName: p.category_name || null,
    created_at: p.created_at
  };
}

exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
  const offset = (page - 1) * limit;

  const q = (req.query.q || '').trim();
  const categoryId = req.query.category ? parseInt(req.query.category) : null;
  const sort = req.query.sort || 'newest';

  const where = ["p.status = 'ACTIVE'"];
  const params = [];
  if (q) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (categoryId) {
    where.push('p.category_id = ?');
    params.push(categoryId);
  }
  const whereSql = 'WHERE ' + where.join(' AND ');

  let orderSql = 'p.created_at DESC';
  if (sort === 'price_asc') orderSql = 'p.price ASC';
  else if (sort === 'price_desc') orderSql = 'p.price DESC';
  else if (sort === 'name_asc') orderSql = 'p.name ASC';
  else if (sort === 'name_desc') orderSql = 'p.name DESC';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p ${whereSql}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.description, p.price, p.stock_quantity, p.image_url, p.status,
            p.category_id, p.created_at, c.name AS category_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ${whereSql}
     ORDER BY ${orderSql}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows.map(mapProduct),
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit)
    }
  });
});

exports.detail = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.description, p.price, p.stock_quantity, p.image_url, p.status,
            p.category_id, p.created_at, c.name AS category_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.id = ? AND p.status = 'ACTIVE'`,
    [id]
  );
  if (!rows[0]) throw new ApiError(404, 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.');

  // Thống kê đánh giá
  const [[reviewStats]] = await pool.query(
    'SELECT COUNT(*) AS total, COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating FROM reviews WHERE product_id = ?',
    [id]
  );

  res.json({
    success: true,
    data: {
      ...mapProduct(rows[0]),
      review_count: Number(reviewStats.total),
      avg_rating: Number(reviewStats.avg_rating)
    }
  });
});

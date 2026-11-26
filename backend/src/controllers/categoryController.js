const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.description, COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.status = 'ACTIVE'
     GROUP BY c.id, c.name, c.description
     ORDER BY c.name ASC`
  );
  res.json({
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      product_count: Number(r.product_count)
    }))
  });
});

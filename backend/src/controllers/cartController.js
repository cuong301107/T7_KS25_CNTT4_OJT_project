const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

async function ensureCart(userId) {
  const [carts] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (carts.length) return carts[0].id;
  const [r] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
  return r.insertId;
}

async function buildCart(userId) {
  const cartId = await ensureCart(userId);
  const [items] = await pool.query(
    `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price,
            p.stock_quantity, p.image_url, p.status
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.created_at DESC, ci.id DESC`,
    [cartId]
  );
  const data = items.map((it) => ({
    id: it.id,
    product_id: it.product_id,
    name: it.name,
    price: Number(it.price),
    image_url: it.image_url,
    image: it.image_url,
    imageUrl: it.image_url,
    stock_quantity: Number(it.stock_quantity),
    quantity: Number(it.quantity),
    available: it.status === 'ACTIVE',
    line_total: Number(it.price) * Number(it.quantity)
  }));
  const total = data.reduce((s, it) => s + it.line_total, 0);
  const total_items = data.reduce((s, it) => s + it.quantity, 0);
  return { items: data, total, total_items };
}

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await buildCart(req.user.id);
  res.json({ success: true, data: cart });
});

exports.addItem = asyncHandler(async (req, res) => {
  const { product_id, quantity = 1 } = req.body || {};
  const qty = parseInt(quantity);
  if (!product_id || !Number.isInteger(qty) || qty < 1) {
    throw new ApiError(400, 'Số lượng sản phẩm không hợp lệ.');
  }

  const [prods] = await pool.query('SELECT id, name, status, stock_quantity FROM products WHERE id = ?', [
    product_id
  ]);
  const product = prods[0];
  if (!product) throw new ApiError(404, 'Sản phẩm không tồn tại.');
  if (product.status !== 'ACTIVE') throw new ApiError(400, 'Sản phẩm đã ngừng kinh doanh.');
  if (product.stock_quantity <= 0) throw new ApiError(400, 'Sản phẩm đã hết hàng.');

  const cartId = await ensureCart(req.user.id);
  const [existing] = await pool.query(
    'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
    [cartId, product_id]
  );

  let newQty = qty;
  if (existing.length) newQty = existing[0].quantity + qty;
  if (newQty > product.stock_quantity) {
    throw new ApiError(400, `Vượt quá tồn kho. Sản phẩm chỉ còn ${product.stock_quantity} sản phẩm.`);
  }

  if (existing.length) {
    await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
  } else {
    await pool.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)', [
      cartId,
      product_id,
      qty
    ]);
  }

  const cart = await buildCart(req.user.id);
  res.json({ success: true, message: 'Đã thêm sản phẩm vào giỏ hàng.', data: cart });
});

exports.updateItem = asyncHandler(async (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const qty = parseInt(req.body && req.body.quantity);
  if (!Number.isInteger(qty) || qty < 1) throw new ApiError(400, 'Số lượng phải lớn hơn hoặc bằng 1.');

  const [rows] = await pool.query(
    `SELECT ci.id, ci.cart_id, ci.product_id, p.stock_quantity, p.status
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.id = ?`,
    [itemId]
  );
  const item = rows[0];
  if (!item) throw new ApiError(404, 'Không tìm thấy sản phẩm trong giỏ hàng.');
  if (item.status !== 'ACTIVE') throw new ApiError(400, 'Sản phẩm đã ngừng kinh doanh.');
  if (qty > item.stock_quantity) {
    throw new ApiError(400, `Vượt quá tồn kho. Sản phẩm chỉ còn ${item.stock_quantity} sản phẩm.`);
  }

  // Chỉ cho phép sửa giỏ hàng của chính mình
  const [carts] = await pool.query('SELECT user_id FROM carts WHERE id = ?', [item.cart_id]);
  if (!carts.length || carts[0].user_id !== req.user.id) {
    throw new ApiError(403, 'Bạn không có quyền sửa giỏ hàng này.');
  }

  await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [qty, itemId]);
  const cart = await buildCart(req.user.id);
  res.json({ success: true, message: 'Đã cập nhật giỏ hàng.', data: cart });
});

exports.removeItem = asyncHandler(async (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const [rows] = await pool.query(
    `SELECT ci.id, ci.cart_id, c.user_id FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE ci.id = ?`,
    [itemId]
  );
  const item = rows[0];
  if (!item) throw new ApiError(404, 'Không tìm thấy sản phẩm trong giỏ hàng.');
  if (item.user_id !== req.user.id) throw new ApiError(403, 'Bạn không có quyền sửa giỏ hàng này.');

  await pool.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
  const cart = await buildCart(req.user.id);
  res.json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng.', data: cart });
});

exports.count = asyncHandler(async (req, res) => {
  const cart = await buildCart(req.user.id);
  res.json({ success: true, data: { total_items: cart.total_items } });
});

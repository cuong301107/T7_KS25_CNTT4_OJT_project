const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const fs = require('fs');
const path = require('path');

function deleteUploadedImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  const filename = path.basename(imageUrl);
  const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
  fs.unlink(filePath, () => {});
}

/* ------------------------------------------------------------------ *
 *  Dashboard / thong ke
 * ------------------------------------------------------------------ */
exports.stats = asyncHandler(async (req, res) => {
  const [[productStat]] = await pool.query(
    "SELECT COUNT(*) AS total, SUM(status = 'ACTIVE') AS active FROM products"
  );
  const [[orderStat]] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(status = 'PENDING') AS pending,
            SUM(status = 'CONFIRMED') AS confirmed,
            SUM(status = 'SHIPPING') AS shipping,
            SUM(status = 'COMPLETED') AS completed,
            SUM(status = 'CANCELLED') AS cancelled
     FROM orders`
  );
  const [[customerStat]] = await pool.query(
    "SELECT COUNT(*) AS total FROM users WHERE position = 'CUSTOMER'"
  );
  const [[revenueStat]] = await pool.query(
    "SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE status = 'COMPLETED'"
  );

  const [recentOrders] = await pool.query(
    `SELECT o.id, o.order_code, o.total_amount, o.status, o.created_at, u.full_name AS customer
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC
     LIMIT 8`
  );

  const [topProducts] = await pool.query(
    `SELECT p.id, p.name, SUM(oi.quantity) AS sold
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     JOIN orders o ON o.id = oi.order_id
     WHERE o.status = 'COMPLETED'
     GROUP BY p.id, p.name
     ORDER BY sold DESC
     LIMIT 5`
  );

  res.json({
    success: true,
    data: {
      products: { total: Number(productStat.total), active: Number(productStat.active) },
      orders: {
        total: Number(orderStat.total),
        pending: Number(orderStat.pending),
        confirmed: Number(orderStat.confirmed),
        shipping: Number(orderStat.shipping),
        completed: Number(orderStat.completed),
        cancelled: Number(orderStat.cancelled)
      },
      customers: Number(customerStat.total),
      revenue: Number(revenueStat.revenue),
      recent_orders: recentOrders.map((o) => ({
        id: o.id,
        order_code: o.order_code,
        total_amount: Number(o.total_amount),
        status: o.status,
        customer: o.customer,
        created_at: o.created_at
      })),
      top_products: topProducts.map((p) => ({ id: p.id, name: p.name, sold: Number(p.sold) }))
    }
  });
});

/* ------------------------------------------------------------------ *
 *  Quan ly san pham
 * ------------------------------------------------------------------ */
exports.listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  const q = (req.query.q || '').trim();
  const categoryId = req.query.category ? parseInt(req.query.category) : null;
  const status = req.query.status || null;

  const where = ['1 = 1'];
  const params = [];
  if (q) {
    where.push('p.name LIKE ?');
    params.push(`%${q}%`);
  }
  if (categoryId) {
    where.push('p.category_id = ?');
    params.push(categoryId);
  }
  if (status) {
    where.push('p.status = ?');
    params.push(status);
  }
  const whereSql = 'WHERE ' + where.join(' AND ');

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.description, p.price, p.stock_quantity, p.image_url, p.status,
            p.category_id, p.created_at, c.name AS category_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ${whereSql}
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows.map((p) => ({
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
      category_name: p.category_name,
      categoryName: p.category_name,
      created_at: p.created_at
    })),
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) }
  });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const { category_id, name, description, price, stock_quantity, image_url, status = 'ACTIVE' } =
    req.body || {};
  if (!name || !name.trim()) throw new ApiError(400, 'Tên sản phẩm không được để trống.');
  if (!category_id) throw new ApiError(400, 'Vui lòng chọn danh mục.');
  const priceNum = Number(price);
  const stockNum = Number(stock_quantity);
  if (!Number.isFinite(priceNum) || priceNum <= 0) throw new ApiError(400, 'Giá sản phẩm phải lớn hơn 0.');
  if (!Number.isInteger(stockNum) || stockNum < 0) throw new ApiError(400, 'Số lượng tồn kho không hợp lệ.');
  if (status !== 'ACTIVE' && status !== 'INACTIVE') throw new ApiError(400, 'Trạng thái không hợp lệ.');

  const [cats] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
  if (!cats.length) throw new ApiError(400, 'Danh mục không tồn tại.');

  const [result] = await pool.query(
    'INSERT INTO products (category_id, name, description, price, stock_quantity, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      category_id,
      name.trim(),
      description ? String(description).trim() : null,
      priceNum,
      stockNum,
      image_url ? String(image_url).trim() : null,
      status
    ]
  );
  res.status(201).json({ success: true, message: 'Đã thêm sản phẩm.', data: { id: result.insertId } });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { category_id, name, description, price, stock_quantity, image_url, status } = req.body || {};

  const [rows] = await pool.query('SELECT id, image_url FROM products WHERE id = ?', [id]);
  if (!rows.length) throw new ApiError(404, 'Sản phẩm không tồn tại.');
  const oldImageUrl = rows[0].image_url;

  if (name !== undefined && !name.trim()) throw new ApiError(400, 'Tên sản phẩm không được để trống.');
  if (status !== undefined && status !== 'ACTIVE' && status !== 'INACTIVE') {
    throw new ApiError(400, 'Trạng thái không hợp lệ.');
  }
  if (price !== undefined) {
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) throw new ApiError(400, 'Giá sản phẩm phải lớn hơn 0.');
  }
  if (stock_quantity !== undefined) {
    const s = Number(stock_quantity);
    if (!Number.isInteger(s) || s < 0) throw new ApiError(400, 'Số lượng tồn kho không hợp lệ.');
  }
  if (category_id !== undefined) {
    const [cats] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!cats.length) throw new ApiError(400, 'Danh mục không tồn tại.');
  }

  const updates = [];
  const values = [];
  if (category_id !== undefined) {
    updates.push('category_id = ?');
    values.push(category_id);
  }
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name.trim());
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description ? String(description).trim() : null);
  }
  if (price !== undefined) {
    updates.push('price = ?');
    values.push(Number(price));
  }
  if (stock_quantity !== undefined) {
    updates.push('stock_quantity = ?');
    values.push(Number(stock_quantity));
  }
  if (image_url !== undefined) {
    updates.push('image_url = ?');
    values.push(image_url ? String(image_url).trim() : null);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }
  if (!updates.length) throw new ApiError(400, 'Không có thông tin nào để cập nhật.');
  await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, [...values, id]);
  if (image_url !== undefined && image_url !== oldImageUrl) {
    deleteUploadedImage(oldImageUrl);
  }
  res.json({ success: true, message: 'Đã cập nhật sản phẩm.' });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [rows] = await pool.query('SELECT id, image_url FROM products WHERE id = ?', [id]);
  if (!rows.length) throw new ApiError(404, 'Sản phẩm không tồn tại.');

  const [[{ used }]] = await pool.query(
    'SELECT COUNT(*) AS used FROM order_items WHERE product_id = ?',
    [id]
  );
  if (Number(used) > 0) {
    throw new ApiError(409, 'Sản phẩm đã có đơn hàng, không thể xóa. Hãy ngừng kinh doanh thay vì xóa.');
  }

  await pool.query('DELETE FROM products WHERE id = ?', [id]);
  deleteUploadedImage(rows[0].image_url);
  res.json({ success: true, message: 'Đã xóa sản phẩm.' });
});

/* ------------------------------------------------------------------ *
 *  Quan ly danh muc
 * ------------------------------------------------------------------ */
exports.listCategories = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.description, c.created_at, COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id, c.name, c.description, c.created_at
     ORDER BY c.created_at DESC, c.id DESC`
  );
  res.json({
    success: true,
    data: rows.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      product_count: Number(c.product_count),
      created_at: c.created_at
    }))
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body || {};
  if (!name || !name.trim()) throw new ApiError(400, 'Tên danh mục không được để trống.');
  const [result] = await pool.query('INSERT INTO categories (name, description) VALUES (?, ?)', [
    name.trim(),
    description ? String(description).trim() : null
  ]);
  res.status(201).json({ success: true, message: 'Đã thêm danh mục.', data: { id: result.insertId } });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description } = req.body || {};
  const [rows] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
  if (!rows.length) throw new ApiError(404, 'Danh mục không tồn tại.');
  if (name !== undefined && !name.trim()) throw new ApiError(400, 'Tên danh mục không được để trống.');

  await pool.query('UPDATE categories SET name = COALESCE(?, name), description = ? WHERE id = ?', [
    name ? name.trim() : null,
    description !== undefined ? (description ? String(description).trim() : null) : undefined,
    id
  ]);
  res.json({ success: true, message: 'Đã cập nhật danh mục.' });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [rows] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
  if (!rows.length) throw new ApiError(404, 'Danh mục không tồn tại.');
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  res.json({ success: true, message: 'Đã xóa danh mục.' });
});

/* ------------------------------------------------------------------ *
 *  Quan ly don hang
 * ------------------------------------------------------------------ */
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING'],
  SHIPPING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: []
};

exports.listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  const q = (req.query.q || '').trim();
  const status = req.query.status || null;

  const where = ['1 = 1'];
  const params = [];
  if (q) {
    where.push('(o.order_code LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status) {
    where.push('o.status = ?');
    params.push(status);
  }
  const whereSql = 'WHERE ' + where.join(' AND ');

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM orders o JOIN users u ON u.id = o.user_id ${whereSql}`,
    params
  );
  const [rows] = await pool.query(
    `SELECT o.id, o.order_code, o.recipient_name, o.recipient_phone, o.shipping_address,
            o.total_amount, o.payment_method, o.status, o.created_at, u.full_name AS customer
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ${whereSql}
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows.map((o) => ({
      id: o.id,
      order_code: o.order_code,
      customer: o.customer,
      recipient_name: o.recipient_name,
      recipient_phone: o.recipient_phone,
      shipping_address: o.shipping_address,
      total_amount: Number(o.total_amount),
      payment_method: o.payment_method,
      status: o.status,
      created_at: o.created_at
    })),
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) }
  });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [rows] = await pool.query(
    `SELECT o.id, o.order_code, o.recipient_name, o.recipient_phone, o.shipping_address,
            o.total_amount, o.payment_method, o.status, o.created_at, u.full_name AS customer, u.email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [id]
  );
  if (!rows[0]) throw new ApiError(404, 'Đơn hàng không tồn tại.');

  const [items] = await pool.query(
    `SELECT oi.quantity, oi.unit_price, p.name, p.image_url, p.id AS product_id
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [id]
  );

  res.json({
    success: true,
    data: {
      id: rows[0].id,
      order_code: rows[0].order_code,
      customer: rows[0].customer,
      email: rows[0].email,
      recipient_name: rows[0].recipient_name,
      recipient_phone: rows[0].recipient_phone,
      shipping_address: rows[0].shipping_address,
      total_amount: Number(rows[0].total_amount),
      payment_method: rows[0].payment_method,
      status: rows[0].status,
      created_at: rows[0].created_at,
      items: items.map((it) => ({
        product_id: it.product_id,
        name: it.name,
        image_url: it.image_url,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        line_total: Number(it.unit_price) * Number(it.quantity)
      }))
    }
  });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body || {};
  const [rows] = await pool.query('SELECT id, status FROM orders WHERE id = ?', [id]);
  const order = rows[0];
  if (!order) throw new ApiError(404, 'Đơn hàng không tồn tại.');

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(
      400,
      `Không thể chuyển trạng thái từ ${order.status} sang ${status}. Các trạng thái hợp lệ: ${
        allowed.length ? allowed.join(', ') : 'không có (đơn đã kết thúc)'
      }.`
    );
  }

  // Khi hủy đơn, hoàn lại tồn kho
  if (status === 'CANCELLED') {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [items] = await conn.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ? FOR UPDATE',
        [id]
      );
      for (const it of items) {
        await conn.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [
          it.quantity,
          it.product_id
        ]);
      }
      await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } else {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  }

  res.json({ success: true, message: 'Đã cập nhật trạng thái đơn hàng.' });
});

/* ------------------------------------------------------------------ *
 *  Quan ly nguoi dung
 * ------------------------------------------------------------------ */
exports.listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  const q = (req.query.q || '').trim();
  const position = req.query.position || null;

  const where = ['1 = 1'];
  const params = [];
  if (q) {
    where.push('(full_name LIKE ? OR email LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (position) {
    where.push('position = ?');
    params.push(position);
  }
  const whereSql = 'WHERE ' + where.join(' AND ');

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.position, u.phone, u.address, u.status, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
     FROM users u
     ${whereSql}
     ORDER BY u.created_at DESC, u.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows.map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      position: u.position,
      phone: u.phone,
      address: u.address,
      status: u.status,
      order_count: Number(u.order_count),
      created_at: u.created_at
    })),
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) }
  });
});

exports.getUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.position, u.phone, u.address, u.status, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
            (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.user_id = u.id AND o.status = 'COMPLETED') AS total_spent
     FROM users u WHERE u.id = ?`,
    [id]
  );
  if (!rows[0]) throw new ApiError(404, 'Người dùng không tồn tại.');
  res.json({
    success: true,
    data: {
      ...rows[0],
      order_count: Number(rows[0].order_count),
      total_spent: Number(rows[0].total_spent)
    }
  });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [rows] = await pool.query(
    'SELECT id, position, status FROM users WHERE id = ?',
    [id]
  );
  const user = rows[0];
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại.');
  if (user.id === req.user.id) throw new ApiError(400, 'Không thể tự khóa tài khoản của chính mình.');

  const newStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';

  // Khong cho phep khoa Admin cuoi cung con hoat dong
  if (user.position === 'ADMIN' && newStatus === 'LOCKED') {
    const [[{ activeAdmins }]] = await pool.query(
      "SELECT COUNT(*) AS activeAdmins FROM users WHERE position = 'ADMIN' AND status = 'ACTIVE'"
    );
    if (Number(activeAdmins) <= 1) {
      throw new ApiError(400, 'Không thể khóa quản trị viên cuối cùng đang hoạt động.');
    }
  }

  await pool.query('UPDATE users SET status = ? WHERE id = ?', [newStatus, id]);
  res.json({
    success: true,
    message: newStatus === 'LOCKED' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.'
  });
});

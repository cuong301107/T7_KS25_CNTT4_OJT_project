const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { generateOrderCode } = require('../utils/orderCode');

function mapOrder(o) {
  return {
    id: o.id,
    order_code: o.order_code,
    recipient_name: o.recipient_name,
    recipient_phone: o.recipient_phone,
    shipping_address: o.shipping_address,
    total_amount: Number(o.total_amount),
    payment_method: o.payment_method,
    status: o.status,
    created_at: o.created_at,
    updated_at: o.updated_at
  };
}

exports.create = asyncHandler(async (req, res) => {
  const { recipient_name, recipient_phone, shipping_address, payment_method = 'COD' } = req.body || {};
  if (!recipient_name || !recipient_name.trim()) throw new ApiError(400, 'Vui lòng nhập họ tên người nhận.');
  if (!recipient_phone || !recipient_phone.trim()) throw new ApiError(400, 'Vui lòng nhập số điện thoại người nhận.');
  if (!shipping_address || !shipping_address.trim()) throw new ApiError(400, 'Vui lòng nhập địa chỉ giao hàng.');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [carts] = await conn.query('SELECT id FROM carts WHERE user_id = ? FOR UPDATE', [req.user.id]);
    if (!carts.length) throw new ApiError(400, 'Giỏ hàng trống.');
    const cartId = carts[0].id;

    const [items] = await conn.query(
      'SELECT product_id, quantity FROM cart_items WHERE cart_id = ?',
      [cartId]
    );
    if (!items.length) throw new ApiError(400, 'Giỏ hàng trống.');

    let total = 0;
    const orderItems = [];
    for (const it of items) {
      const [prods] = await conn.query(
        'SELECT id, name, price, stock_quantity, status FROM products WHERE id = ? FOR UPDATE',
        [it.product_id]
      );
      const p = prods[0];
      if (!p || p.status !== 'ACTIVE') {
        throw new ApiError(400, `Sản phẩm "${p ? p.name : '#' + it.product_id}" đã ngừng kinh doanh.`);
      }
      if (it.quantity > p.stock_quantity) {
        throw new ApiError(400, `Sản phẩm "${p.name}" không đủ tồn kho (còn ${p.stock_quantity}).`);
      }
      const unitPrice = Number(p.price);
      total += unitPrice * it.quantity;
      orderItems.push({ product_id: p.id, quantity: it.quantity, unit_price: unitPrice });
      await conn.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [
        it.quantity,
        p.id
      ]);
    }

    const orderCode = generateOrderCode();
    const [result] = await conn.query(
      `INSERT INTO orders
        (order_code, user_id, recipient_name, recipient_phone, shipping_address, total_amount, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        orderCode,
        req.user.id,
        recipient_name.trim(),
        recipient_phone.trim(),
        shipping_address.trim(),
        total,
        payment_method
      ]
    );
    const orderId = result.insertId;

    for (const oi of orderItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, oi.product_id, oi.quantity, oi.unit_price]
      );
    }

    await conn.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công.',
      data: { id: orderId, order_code: orderCode, total_amount: total }
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

exports.listMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM orders WHERE user_id = ?', [
    req.user.id
  ]);
  const [rows] = await pool.query(
    `SELECT id, order_code, recipient_name, recipient_phone, shipping_address,
            total_amount, payment_method, status, created_at, updated_at
     FROM orders WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset]
  );

  const orders = rows.map(mapOrder);
  if (orders.length) {
    const ids = orders.map((o) => o.id);
    const [items] = await pool.query(
      `SELECT oi.order_id, oi.quantity, oi.unit_price, p.name, p.image_url, p.id AS product_id
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (?)`,
      [ids]
    );
    const byOrder = {};
    for (const it of items) {
      (byOrder[it.order_id] = byOrder[it.order_id] || []).push({
        product_id: it.product_id,
        name: it.name,
        image_url: it.image_url,
        image: it.image_url,
        imageUrl: it.image_url,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        line_total: Number(it.unit_price) * Number(it.quantity)
      });
    }
    for (const o of orders) o.items = byOrder[o.id] || [];
  }

  res.json({
    success: true,
    data: orders,
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) }
  });
});

exports.getMyOrder = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [rows] = await pool.query(
    `SELECT id, order_code, recipient_name, recipient_phone, shipping_address,
            total_amount, payment_method, status, created_at, updated_at
     FROM orders WHERE id = ? AND user_id = ?`,
    [id, req.user.id]
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
      ...mapOrder(rows[0]),
      items: items.map((it) => ({
        product_id: it.product_id,
        name: it.name,
        image_url: it.image_url,
        image: it.image_url,
        imageUrl: it.image_url,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        line_total: Number(it.unit_price) * Number(it.quantity)
      }))
    }
  });
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [rows] = await pool.query('SELECT id, user_id, status FROM orders WHERE id = ?', [id]);
  const order = rows[0];
  if (!order) throw new ApiError(404, 'Đơn hàng không tồn tại.');
  if (order.user_id !== req.user.id) throw new ApiError(403, 'Bạn không có quyền với đơn hàng này.');
  if (order.status !== 'PENDING') {
    throw new ApiError(400, 'Chỉ có thể hủy đơn hàng ở trạng thái chờ xác nhận.');
  }

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
    await conn.query("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", [id]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  res.json({ success: true, message: 'Đã hủy đơn hàng.' });
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, position: user.position },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function sanitizeUser(u) {
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    position: u.position,
    phone: u.phone,
    address: u.address,
    status: u.status,
    created_at: u.created_at
  };
}

exports.register = asyncHandler(async (req, res) => {
  const { full_name, email, password, confirm_password } = req.body || {};
  if (!full_name || !email || !password) {
    throw new ApiError(400, 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.');
  }
  if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Email không đúng định dạng.');
  if (password.length < 8) throw new ApiError(400, 'Mật khẩu phải có ít nhất 8 ký tự.');
  if (confirm_password !== undefined && password !== confirm_password) {
    throw new ApiError(400, 'Xác nhận mật khẩu không khớp.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (existing.length) throw new ApiError(409, 'Email đã được sử dụng.');

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, position) VALUES (?, ?, ?, ?)',
    [full_name.trim(), normalizedEmail, hash, 'CUSTOMER']
  );
  const userId = result.insertId;
  await pool.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);

  const [rows] = await pool.query(
    'SELECT id, full_name, email, position, phone, address, status, created_at FROM users WHERE id = ?',
    [userId]
  );
  const user = rows[0];
  res.status(201).json({
    success: true,
    message: 'Đăng ký thành công.',
    token: signToken(user),
    user: sanitizeUser(user)
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'Vui lòng nhập email và mật khẩu.');

  const [rows] = await pool.query(
    'SELECT id, full_name, email, password_hash, position, phone, address, status, created_at FROM users WHERE email = ?',
    [email.trim().toLowerCase()]
  );
  const user = rows[0];
  if (!user) throw new ApiError(401, 'Email hoặc mật khẩu không đúng.');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new ApiError(401, 'Email hoặc mật khẩu không đúng.');

  if (user.status !== 'ACTIVE') throw new ApiError(403, 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');

  res.json({
    success: true,
    message: 'Đăng nhập thành công.',
    token: signToken(user),
    user: sanitizeUser(user)
  });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: sanitizeUser(req.user) });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { full_name, phone, address } = req.body || {};
  if (!full_name || !full_name.trim()) throw new ApiError(400, 'Họ tên không được để trống.');

  await pool.query('UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?', [
    full_name.trim(),
    phone ? String(phone).trim() : null,
    address ? String(address).trim() : null,
    req.user.id
  ]);

  const [rows] = await pool.query(
    'SELECT id, full_name, email, position, phone, address, status, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json({ success: true, message: 'Cập nhật thông tin thành công.', data: sanitizeUser(rows[0]) });
});

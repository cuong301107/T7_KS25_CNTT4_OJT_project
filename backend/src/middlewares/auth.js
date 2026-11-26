const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Bạn cần đăng nhập để thực hiện thao tác này.');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (e) {
    throw new ApiError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  }

  const [rows] = await pool.query(
    'SELECT id, full_name, email, position, phone, address, status, created_at FROM users WHERE id = ?',
    [payload.id]
  );
  if (!rows[0]) throw new ApiError(401, 'Tài khoản không tồn tại.');
  if (rows[0].status !== 'ACTIVE') throw new ApiError(403, 'Tài khoản đã bị khóa.');

  req.user = rows[0];
  next();
});

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.position !== 'ADMIN') {
    return next(new ApiError(403, 'Bạn không có quyền truy cập chức năng quản trị.'));
  }
  next();
};

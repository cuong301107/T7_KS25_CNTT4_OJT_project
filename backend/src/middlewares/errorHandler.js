const ApiError = require('../utils/ApiError');

exports.notFound = (req, res, next) => {
  next(new ApiError(404, `Không tìm thấy tài nguyên: ${req.method} ${req.originalUrl}`));
};

exports.errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ.';

  // Xử lý lỗi quen thuộc của MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Dữ liệu đã tồn tại (trùng khóa duy nhất).';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    statusCode = 409;
    message = 'Không thể xóa vì dữ liệu đang được tham chiếu bởi bản ghi khác.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Dữ liệu tham chiếu không hợp lệ.';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
  }

  if (statusCode >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({ success: false, message });
};

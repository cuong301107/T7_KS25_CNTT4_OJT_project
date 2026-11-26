// Sinh ma don hang dang ORD20261112001 (năm + tháng + ngày + 3 chữ số ngẫu nhiên)
function generateOrderCode() {
  const now = new Date();
  const ymd =
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `ORD${ymd}${rand}`;
}

module.exports = { generateOrderCode };

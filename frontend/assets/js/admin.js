// ShopEase - Admin: sidebar, topbar, guard

function renderAdminSidebar() {
  const sb = document.getElementById('admin-sidebar');
  if (!sb) return;
  sb.innerHTML = `
    <div class="brand">
      <span class="logo-mark">S</span>
      <strong>ShopEase Admin</strong>
    </div>
    <nav class="admin-nav">
      <a href="/admin/dashboard.html" data-nav="dashboard"><span class="ico">📊</span> Tổng quan</a>
      <a href="/admin/products.html" data-nav="products"><span class="ico">📦</span> Sản phẩm</a>
      <a href="/admin/categories.html" data-nav="categories"><span class="ico">🗂️</span> Danh mục</a>
      <a href="/admin/orders.html" data-nav="orders"><span class="ico">🧾</span> Đơn hàng</a>
      <a href="/admin/users.html" data-nav="users"><span class="ico">👥</span> Người dùng</a>
    </nav>
    <div class="side-foot">
      <a class="btn btn-outline btn-sm btn-block" href="/index.html">← Về trang web</a>
    </div>`;

  const path = window.location.pathname;
  sb.querySelectorAll('.admin-nav a').forEach((a) => {
    if (path.endsWith(a.getAttribute('href'))) a.classList.add('active');
  });
}

function renderAdminTopbar() {
  const box = document.getElementById('admin-topbar-actions');
  if (!box) return;
  const user = Auth.getUser() || {};
  const name = esc(user.full_name || '');
  box.innerHTML = `
    <span class="user-chip">
      <span class="avatar">${esc((name || '?').charAt(0).toUpperCase())}</span>
      <span class="name">${name}</span>
    </span>
    <button class="btn btn-outline btn-sm" onclick="logout()">Đăng xuất</button>`;
}

function guardAdmin() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/admin/login.html';
    return false;
  }
  if (!Auth.isAdmin()) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// Modal helper (dung chung)
function openModal(title, bodyHtml) {
  let backdrop = document.getElementById('modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'modal-backdrop';
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);
  }
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3>${esc(title)}</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
    </div>`;
  backdrop.classList.add('open');
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  return backdrop;
}

function closeModal() {
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) backdrop.classList.remove('open');
}
window.openModal = openModal;
window.closeModal = closeModal;

document.addEventListener('DOMContentLoaded', () => {
  if (!guardAdmin()) return;
  renderAdminSidebar();
  renderAdminTopbar();
});

// ShopEase - helpers, header/footer, toast, cart badge

/* ---------- Auth storage ---------- */
const Auth = {
  getToken: () => localStorage.getItem('shopease_token'),
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('shopease_user'));
    } catch (e) {
      return null;
    }
  },
  setSession(token, user) {
    localStorage.setItem('shopease_token', token);
    localStorage.setItem('shopease_user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('shopease_token');
    localStorage.removeItem('shopease_user');
  },
  isLoggedIn: () => !!localStorage.getItem('shopease_token'),
  isAdmin() {
    const u = Auth.getUser();
    return !!(u && u.position === 'ADMIN');
  }
};

/* ---------- Format helpers ---------- */
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ';
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function mediaHtml(imageUrl, name, cls) {
  const initial = esc((name || '?').trim().charAt(0).toUpperCase());
  if (imageUrl) {
    return `<img src="${esc(imageUrl)}" alt="${esc(name)}" loading="lazy" onerror="this.outerHTML='<div class=&quot;img-placeholder&quot;>${initial}</div>'">`;
  }
  return `<div class="${cls || 'img-placeholder'}">${initial}</div>`;
}

function statusBadge(status) {
  const map = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Ngừng bán',
    LOCKED: 'Đã khóa',
    ADMIN: 'Quản trị',
    CUSTOMER: 'Khách hàng'
  };
  const cls = {
    PENDING: 'badge-pending',
    CONFIRMED: 'badge-confirmed',
    SHIPPING: 'badge-shipping',
    COMPLETED: 'badge-completed',
    CANCELLED: 'badge-cancelled',
    ACTIVE: 'badge-active',
    INACTIVE: 'badge-inactive',
    LOCKED: 'badge-locked',
    ADMIN: 'badge-admin',
    CUSTOMER: 'badge-customer'
  }[status] || 'badge-customer';
  return `<span class="badge ${cls}">${esc(map[status] || status)}</span>`;
}

/* ---------- Toast ---------- */
function toast(message, type) {
  type = type || 'info';
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    root.className = 'toast-root';
    document.body.appendChild(root);
  }
  const node = document.createElement('div');
  node.className = 'toast ' + type;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  node.innerHTML = `<span>${icon}</span><span>${esc(message)}</span>`;
  root.appendChild(node);
  setTimeout(() => {
    node.style.opacity = '0';
    node.style.transition = 'opacity 0.25s';
    setTimeout(() => node.remove(), 260);
  }, 2800);
}

/* ---------- Header / footer ---------- */
function renderHeader() {
  const header = document.getElementById('app-header');
  if (!header) return;
  const user = Auth.getUser();

  let authHtml = '';
  if (user) {
    const name = esc(user.full_name || '');
    const profileLink = user.position === 'ADMIN' ? '/admin/dashboard.html' : '/profile.html';
    let adminBtn = '';
    if (user.position === 'ADMIN') {
      adminBtn = `<a class="btn btn-outline btn-sm" href="/admin/dashboard.html">Quản trị</a>`;
    }
    authHtml = `
      <a class="user-chip" href="${profileLink}" title="${name}">
        <span class="avatar">${esc((name || '?').charAt(0).toUpperCase())}</span>
        <span class="name">${name}</span>
      </a>
      ${adminBtn}
      <button class="btn btn-ghost btn-sm" onclick="logout()">Đăng xuất</button>`;
  } else {
    authHtml = `
      <a class="btn btn-ghost btn-sm" href="/login.html">Đăng nhập</a>
      <a class="btn btn-primary btn-sm" href="/register.html">Đăng ký</a>`;
  }

  header.className = 'site-header';
  header.innerHTML = `
    <div class="container header-inner">
      <a class="logo" href="/index.html">
        <span class="logo-mark">S</span>
        <span>ShopEase</span>
      </a>
      <nav class="main-nav">
        <a href="/index.html" data-nav="home">Trang chủ</a>
        <a href="/products.html" data-nav="products">Sản phẩm</a>
      </nav>
      <form class="header-search" onsubmit="return submitSearch(event)">
        <div class="search-box">
          <input type="text" id="global-search-input" placeholder="Tìm kiếm sản phẩm..." autocomplete="off">
          <button type="submit">Tìm</button>
        </div>
      </form>
      <div class="header-actions">
        <a class="cart-link" href="/cart.html" title="Giỏ hàng">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <span class="cart-badge" id="cart-badge"></span>
        </a>
        ${authHtml}
      </div>
    </div>`;
}

function renderFooter() {
  const footer = document.getElementById('app-footer');
  if (!footer) return;
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="container footer-inner">
      <div class="footer-col">
        <h4>ShopEase</h4>
        <p>Website thương mại điện tử đơn giản, hiện đại. Mua sắm dễ dàng, thanh toán COD.</p>
      </div>
      <div class="footer-col">
        <h4>Liên kết</h4>
        <a href="/index.html">Trang chủ</a>
        <a href="/products.html">Sản phẩm</a>
        <a href="/cart.html">Giỏ hàng</a>
      </div>
      <div class="footer-col">
        <h4>Hỗ trợ</h4>
        <a href="/orders.html">Đơn hàng của tôi</a>
        <a href="/profile.html">Tài khoản</a>
      </div>
      <div class="footer-col">
        <h4>Liên hệ</h4>
        <p>Hotline: 1900 0000</p>
        <p>Email: support@shopease.vn</p>
      </div>
    </div>
    <div class="footer-bottom">© 2026 ShopEase-Team7_OJT</div>`;
}

/* ---------- Cart badge ---------- */
async function refreshCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  if (!Auth.isLoggedIn() || Auth.isAdmin()) {
    badge.classList.remove('show');
    return;
  }
  try {
    const data = await API.get('/api/cart/count');
    const n = (data.data && data.data.total_items) || 0;
    if (n > 0) {
      badge.textContent = n > 99 ? '99+' : n;
      badge.classList.add('show');
    } else {
      badge.classList.remove('show');
    }
  } catch (e) {
    badge.classList.remove('show');
  }
}

/* ---------- Actions ---------- */
function logout() {
  Auth.clear();
  toast('Đã đăng xuất.', 'info');
  setTimeout(() => (window.location.href = '/index.html'), 300);
}

function submitSearch(e) {
  e.preventDefault();
  const q = (document.getElementById('global-search-input') || {}).value || '';
  window.location.href = '/products.html?q=' + encodeURIComponent(q.trim());
  return false;
}

function requireAuth() {
  if (!Auth.isLoggedIn()) {
    toast('Vui lòng đăng nhập để tiếp tục.', 'info');
    setTimeout(() => {
      window.location.href = '/login.html?next=' + encodeURIComponent(window.location.pathname + window.location.search);
    }, 350);
    return false;
  }
  return true;
}

async function addToCart(e, productId, qty) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (!requireAuth()) return;
  const quantity = qty || 1;
  try {
    await API.post('/api/cart', { product_id: productId, quantity });
    toast('Đã thêm vào giỏ hàng.', 'success');
    refreshCartBadge();
  } catch (err) {
    toast(err.message, 'error');
  }
}
window.addToCart = addToCart;
window.logout = logout;

/* ---------- Product card (dung chung) ---------- */
function productCardHtml(p) {
  const soldOut = Number(p.stock_quantity) <= 0;
  return `
  <div class="product-card">
    <a class="product-media" href="/product.html?id=${p.id}">
      ${mediaHtml(p.image_url, p.name, 'img-placeholder')}
      ${soldOut ? '<div class="product-out">HẾT HÀNG</div>' : ''}
    </a>
    <div class="product-body">
      <span class="product-cat">${esc(p.category_name || '')}</span>
      <a class="product-name" href="/product.html?id=${p.id}">${esc(p.name)}</a>
      <div class="product-foot">
        <span class="price">${fmtMoney(p.price)}</span>
        <button class="add-btn" onclick="addToCart(event, ${p.id})" ${soldOut ? 'disabled' : ''}>
          ${soldOut ? 'Hết hàng' : 'Thêm'}
        </button>
      </div>
    </div>
  </div>`;
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  refreshCartBadge();

  const path = window.location.pathname;
  document.querySelectorAll('.main-nav a').forEach((a) => {
    const key = a.getAttribute('data-nav');
    if (key === 'home' && (path === '/' || path.endsWith('/index.html'))) a.classList.add('active');
    if (key === 'products' && path.endsWith('/products.html')) a.classList.add('active');
  });
});

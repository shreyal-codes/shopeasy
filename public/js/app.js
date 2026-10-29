// Shared helpers used by every page: API calls, login state, navbar, toast.

// ----- login state (token is kept in localStorage) -----
function getToken() { return localStorage.getItem('token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
}
function saveLogin(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
}

// ----- fetch wrapper: adds the token, throws an Error with the server message -----
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (getToken()) headers.Authorization = 'Bearer ' + getToken();

  const res = await fetch('/api' + path, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = {};
  try { data = await res.json(); } catch (e) { /* empty body */ }

  if (!res.ok) {
    // token expired -> clear it so the user can login again
    if (res.status === 401 && getToken()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

// ----- small utilities -----
function rupees(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// escape text before putting it in innerHTML (stops XSS)
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

function formatDate(sqliteDate) {
  return new Date(sqliteDate.replace(' ', 'T') + 'Z').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function toast(message, type = 'success') {
  const box = document.createElement('div');
  box.className = 'toast ' + type;
  box.textContent = message;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3000);
}

// call at the top of pages that need a login (pass 'admin' for admin pages)
function requireLogin(role) {
  const user = getUser();
  if (!getToken() || !user) {
    window.location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search);
    return false;
  }
  if (role && user.role !== role) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// ----- navbar -----
async function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge || !getToken()) return;
  try {
    const cart = await api('/cart');
    badge.textContent = cart.itemCount;
  } catch (e) { /* ignore */ }
}

function renderNavbar() {
  const user = getUser();
  let links = '<a href="/index.html">Shop</a>';

  if (user && user.role === 'admin') {
    links += `<a href="/admin/dashboard.html">Dashboard</a>
              <a href="/admin/products.html">Products</a>
              <a href="/admin/categories.html">Categories</a>
              <a href="/admin/orders.html">Orders</a>`;
  } else if (user) {
    links += `<a href="/orders.html">My Orders</a>
              <a href="/cart.html">Cart <span class="badge" id="cart-count">0</span></a>`;
  }

  links += user
    ? `<span class="hello">Hi, ${esc(user.name.split(' ')[0])}</span><button class="btn btn-small btn-outline-light" id="logout-btn">Logout</button>`
    : '<a href="/login.html">Login</a><a href="/register.html" class="btn btn-small">Register</a>';

  document.getElementById('navbar').innerHTML = `
    <div class="container nav-inner">
      <a href="/index.html" class="logo">Shop<span>Easy</span></a>
      <button class="menu-toggle" id="menu-toggle" aria-label="Menu">&#9776;</button>
      <nav class="nav-links" id="nav-links">${links}</nav>
    </div>`;

  document.getElementById('menu-toggle').onclick = () =>
    document.getElementById('nav-links').classList.toggle('open');
  const out = document.getElementById('logout-btn');
  if (out) out.onclick = logout;
  updateCartBadge();
}

document.addEventListener('DOMContentLoaded', renderNavbar);

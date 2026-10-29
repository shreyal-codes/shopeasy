// Handles both login.html and register.html (the form has data-mode="login" or "register")
const form = document.getElementById('auth-form');
const errorBox = document.getElementById('error');
const mode = form.dataset.mode;

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}

// only allow redirects to pages on our own site
function nextUrl() {
  const next = new URLSearchParams(location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const body = { email, password };

  // client side checks (the server checks again)
  if (mode === 'register') {
    body.name = document.getElementById('name').value.trim();
    if (body.name.length < 2) return showError('Please enter your name');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('Enter a valid email address');
  if (mode === 'register' && password.length < 6) return showError('Password must be at least 6 characters');
  if (!password) return showError('Enter your password');

  try {
    const data = await api('/auth/' + mode, { method: 'POST', body });
    saveLogin(data);
    if (nextUrl()) window.location.href = nextUrl();
    else window.location.href = data.user.role === 'admin' ? '/admin/dashboard.html' : '/index.html';
  } catch (err) {
    showError(err.message);
  }
});

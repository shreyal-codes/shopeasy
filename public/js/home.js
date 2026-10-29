// Home page: product grid with search, category filter, sort and pagination
let currentPage = 1;

const searchBox = document.getElementById('search');
const categorySel = document.getElementById('category');
const sortSel = document.getElementById('sort');
const grid = document.getElementById('products');

async function loadCategories() {
  const cats = await api('/categories');
  cats.forEach((c) => {
    categorySel.insertAdjacentHTML('beforeend', `<option value="${c.id}">${esc(c.name)}</option>`);
  });
}

async function loadProducts() {
  const qs = new URLSearchParams({
    search: searchBox.value,
    category: categorySel.value,
    sort: sortSel.value,
    page: currentPage,
  });

  try {
    const data = await api('/products?' + qs.toString());
    if (data.products.length === 0) {
      grid.innerHTML = '<p class="empty" style="grid-column:1/-1">No products found.</p>';
    } else {
      grid.innerHTML = data.products.map(productCard).join('');
    }
    drawPagination(data.page, data.totalPages);
  } catch (err) {
    grid.innerHTML = `<p class="error-msg">${esc(err.message)}</p>`;
  }
}

function stockLabel(p) {
  if (p.stock === 0) return '<span class="stock-out">Out of stock</span>';
  if (p.stock < 5) return `<span class="stock-low">Only ${p.stock} left</span>`;
  return '<span class="stock-in">In stock</span>';
}

function productCard(p) {
  return `
    <div class="card">
      <a href="/product.html?id=${p.id}"><img src="${esc(p.image_url)}" alt="${esc(p.name)}"></a>
      <div class="card-body">
        <span class="cat-tag">${esc(p.category_name)}</span>
        <h3><a href="/product.html?id=${p.id}">${esc(p.name)}</a></h3>
        <div class="price">${rupees(p.price)}</div>
        ${stockLabel(p)}
        <button class="btn btn-small add-btn" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
          ${p.stock === 0 ? 'Out of stock' : 'Add to Cart'}
        </button>
      </div>
    </div>`;
}

function drawPagination(page, totalPages) {
  const box = document.getElementById('pagination');
  if (totalPages <= 1) { box.innerHTML = ''; return; }

  let html = `<button data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button data-page="${i}" class="${i === page ? 'active' : ''}">${i}</button>`;
  }
  html += `<button data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next</button>`;
  box.innerHTML = html;
}

// Add to cart (event delegation, because the buttons are created dynamically)
grid.addEventListener('click', async (e) => {
  const btn = e.target.closest('.add-btn');
  if (!btn) return;
  if (!getToken()) {
    window.location.href = '/login.html?next=' + encodeURIComponent('/index.html');
    return;
  }
  if (getUser().role === 'admin') return toast('Admins cannot shop. Use a customer account.', 'error');

  try {
    await api('/cart', { method: 'POST', body: { productId: Number(btn.dataset.id), quantity: 1 } });
    toast('Added to cart');
    updateCartBadge();
  } catch (err) {
    toast(err.message, 'error');
  }
});

document.getElementById('pagination').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || btn.disabled) return;
  currentPage = Number(btn.dataset.page);
  loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// wait a little after typing so we do not call the API on every key press
let timer;
searchBox.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => { currentPage = 1; loadProducts(); }, 350);
});
[categorySel, sortSel].forEach((el) =>
  el.addEventListener('change', () => { currentPage = 1; loadProducts(); })
);

loadCategories();
loadProducts();

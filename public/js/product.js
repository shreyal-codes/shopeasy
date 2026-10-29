// Product detail page (product.html?id=3)
const box = document.getElementById('product');
const id = new URLSearchParams(location.search).get('id');

async function loadProduct() {
  try {
    const p = await api('/products/' + encodeURIComponent(id));
    document.title = p.name + ' | ShopEasy';

    let stockHtml = '<span class="stock-in">In stock</span>';
    if (p.stock === 0) stockHtml = '<span class="stock-out">Out of stock</span>';
    else if (p.stock < 5) stockHtml = `<span class="stock-low">Only ${p.stock} left</span>`;

    box.innerHTML = `
      <div class="detail">
        <img src="${esc(p.image_url)}" alt="${esc(p.name)}">
        <div>
          <span class="cat-tag">${esc(p.category_name)}</span>
          <h1>${esc(p.name)}</h1>
          <div class="price">${rupees(p.price)}</div>
          ${stockHtml}
          <p style="margin-top:14px">${esc(p.description)}</p>
          <div class="qty-row">
            <label for="qty" style="margin:0">Quantity</label>
            <input type="number" id="qty" value="1" min="1" max="${p.stock}" ${p.stock === 0 ? 'disabled' : ''}>
          </div>
          <button class="btn" id="add-btn" ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Out of stock' : 'Add to Cart'}
          </button>
          <a href="/index.html" class="btn btn-outline">Back to shop</a>
        </div>
      </div>`;

    const addBtn = document.getElementById('add-btn');
    addBtn.addEventListener('click', async () => {
      if (!getToken()) {
        window.location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search);
        return;
      }
      if (getUser().role === 'admin') return toast('Admins cannot shop. Use a customer account.', 'error');
      try {
        const qty = Number(document.getElementById('qty').value);
        await api('/cart', { method: 'POST', body: { productId: p.id, quantity: qty } });
        toast('Added to cart');
        updateCartBadge();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  } catch (err) {
    box.innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}
loadProduct();

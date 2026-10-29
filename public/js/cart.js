// Cart page
if (requireLogin()) loadCart();

const cartBox = document.getElementById('cart');

async function loadCart() {
  try {
    drawCart(await api('/cart'));
  } catch (err) {
    cartBox.innerHTML = `<p class="error-msg">${esc(err.message)}</p>`;
  }
}

function drawCart(cart) {
  document.getElementById('cart-count').textContent = cart.itemCount;

  if (cart.items.length === 0) {
    cartBox.innerHTML = '<div class="empty"><p>Your cart is empty.</p><br><a href="/index.html" class="btn">Start shopping</a></div>';
    return;
  }

  const rows = cart.items.map((i) => `
    <tr>
      <td><div class="thumb-cell"><img src="${esc(i.image_url)}" alt=""><a href="/product.html?id=${i.product_id}">${esc(i.name)}</a></div></td>
      <td>${rupees(i.price)}</td>
      <td>
        <span class="qty-btns">
          <button data-action="minus" data-id="${i.id}" data-qty="${i.quantity}">-</button>
          ${i.quantity}
          <button data-action="plus" data-id="${i.id}" data-qty="${i.quantity}" ${i.quantity >= i.stock ? 'disabled' : ''}>+</button>
        </span>
      </td>
      <td>${rupees(i.line_total)}</td>
      <td><button class="btn btn-small btn-danger" data-action="remove" data-id="${i.id}">Remove</button></td>
    </tr>`).join('');

  cartBox.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Total</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="box" style="margin-top:20px; max-width:360px; margin-left:auto">
      <div class="summary-line total"><span>Grand total</span><span>${rupees(cart.totalAmount)}</span></div>
      <a href="/checkout.html" class="btn btn-block" style="text-align:center; margin-top:14px">Proceed to Checkout</a>
    </div>`;
}

cartBox.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  const qty = Number(btn.dataset.qty);

  try {
    let cart;
    if (action === 'remove') {
      cart = await api('/cart/' + id, { method: 'DELETE' });
    } else if (action === 'plus') {
      cart = await api('/cart/' + id, { method: 'PUT', body: { quantity: qty + 1 } });
    } else if (qty > 1) {
      cart = await api('/cart/' + id, { method: 'PUT', body: { quantity: qty - 1 } });
    } else {
      return; // minimum quantity is 1, use Remove to delete
    }
    drawCart(cart);
  } catch (err) {
    toast(err.message, 'error');
  }
});

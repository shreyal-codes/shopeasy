// Checkout page: shipping form + order summary
if (requireLogin()) init();

const checkoutForm = document.getElementById('checkout-form');
const errBox = document.getElementById('error');

async function init() {
  const cart = await api('/cart');
  if (cart.items.length === 0) {
    window.location.href = '/cart.html';
    return;
  }

  document.getElementById('summary').innerHTML = `
    <h2>Order summary</h2>
    ${cart.items.map((i) => `
      <div class="summary-line"><span>${esc(i.name)} x ${i.quantity}</span><span>${rupees(i.line_total)}</span></div>`).join('')}
    <div class="summary-line total"><span>Total (COD)</span><span>${rupees(cart.totalAmount)}</span></div>`;

  // pre-fill the name from the logged in user
  document.getElementById('name').value = getUser().name;
}

function fail(msg) {
  errBox.textContent = msg;
  errBox.hidden = false;
}

checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errBox.hidden = true;

  const body = {
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    city: document.getElementById('city').value.trim(),
    pincode: document.getElementById('pincode').value.trim(),
  };

  // client side validation
  if (body.name.length < 2) return fail('Enter your full name');
  if (!/^[6-9]\d{9}$/.test(body.phone)) return fail('Enter a valid 10 digit mobile number');
  if (body.address.length < 5) return fail('Enter your full address');
  if (body.city.length < 2) return fail('Enter your city');
  if (!/^\d{6}$/.test(body.pincode)) return fail('PIN code must be 6 digits');

  const btn = document.getElementById('place-btn');
  btn.disabled = true;
  btn.textContent = 'Placing order...';

  try {
    const result = await api('/orders', { method: 'POST', body });
    window.location.href = '/success.html?id=' + result.orderId;
  } catch (err) {
    fail(err.message);
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
});

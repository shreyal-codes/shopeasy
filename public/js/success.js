// Order confirmation page
if (requireLogin()) load();

async function load() {
  const id = new URLSearchParams(location.search).get('id');
  const box = document.getElementById('success');
  try {
    const o = await api('/orders/' + encodeURIComponent(id));
    box.innerHTML = `
      <div class="tick">&#10003;</div>
      <h1>Thank you, order placed!</h1>
      <p>Your order ID is <strong>#${o.id}</strong>. Pay ${rupees(o.total_amount)} in cash when it arrives.</p>
      <div style="text-align:left; margin:20px 0">
        ${o.items.map((i) => `<div class="summary-line"><span>${esc(i.name)} x ${i.quantity}</span><span>${rupees(i.line_total)}</span></div>`).join('')}
        <div class="summary-line total"><span>Total</span><span>${rupees(o.total_amount)}</span></div>
        <p class="muted" style="margin-top:10px">Deliver to: ${esc(o.shipping_name)}, ${esc(o.shipping_address)}</p>
      </div>
      <a href="/orders.html" class="btn">View my orders</a>
      <a href="/index.html" class="btn btn-outline">Continue shopping</a>`;
  } catch (err) {
    box.innerHTML = `<p class="error-msg">${esc(err.message)}</p>`;
  }
}

// Single order detail page (order.html?id=5) with cancel button
if (requireLogin()) load();

const orderBox = document.getElementById('order');

async function load() {
  const id = new URLSearchParams(location.search).get('id');
  try {
    const o = await api('/orders/' + encodeURIComponent(id));
    const canCancel = o.status === 'Placed' && getUser().role !== 'admin';
    orderBox.innerHTML = `
      <div class="page-head">
        <h1>Order #${o.id}</h1>
        <span class="status status-${o.status}">${o.status}</span>
      </div>
      <div class="two-col">
        <div class="table-wrap"><table>
          <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead>
          <tbody>${o.items.map((i) => `
            <tr>
              <td><div class="thumb-cell"><img src="${esc(i.image_url)}" alt="">${esc(i.name)}</div></td>
              <td>${rupees(i.unit_price)}</td><td>${i.quantity}</td><td>${rupees(i.line_total)}</td>
            </tr>`).join('')}</tbody>
        </table></div>
        <div class="box">
          <h2>Details</h2>
          <p class="muted">Placed on ${formatDate(o.created_at)}</p>
          <p style="margin-top:10px"><strong>${esc(o.shipping_name)}</strong><br>${esc(o.shipping_phone)}<br>${esc(o.shipping_address)}</p>
          <p style="margin-top:10px">Payment: Cash on Delivery</p>
          <div class="summary-line total"><span>Total</span><span>${rupees(o.total_amount)}</span></div>
          ${canCancel ? '<button class="btn btn-danger btn-block" id="cancel-btn" style="margin-top:14px">Cancel order</button>' : ''}
        </div>
      </div>`;

    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', async () => {
        if (!confirm('Cancel this order?')) return;
        try {
          await api('/orders/' + o.id + '/cancel', { method: 'PATCH' });
          toast('Order cancelled');
          load();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    }
  } catch (err) {
    orderBox.innerHTML = `<p class="error-msg">${esc(err.message)}</p>`;
  }
}

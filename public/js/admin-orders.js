// Admin: all orders + move status forward (Placed -> Shipped -> Delivered)
if (!requireLogin('admin')) throw new Error('not admin');

const NEXT = { Placed: 'Shipped', Shipped: 'Delivered' };

async function load() {
  const orders = await api('/admin/orders');
  if (orders.length === 0) {
    document.getElementById('table').innerHTML = '<p class="empty">No orders yet.</p>';
    return;
  }
  document.getElementById('table').innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Update</th></tr></thead>
      <tbody>${orders.map((o) => `
        <tr>
          <td><a href="/order.html?id=${o.id}" style="color:var(--primary)">#${o.id}</a></td>
          <td>${esc(o.customer_name)}<br><span class="muted">${esc(o.email)}</span></td>
          <td>${formatDate(o.created_at)}</td>
          <td>${rupees(o.total_amount)}</td>
          <td><span class="status status-${o.status}">${o.status}</span></td>
          <td>${NEXT[o.status]
            ? `<button class="btn btn-small" data-id="${o.id}" data-status="${NEXT[o.status]}">Mark ${NEXT[o.status]}</button>`
            : '<span class="muted">-</span>'}</td>
        </tr>`).join('')}</tbody>
    </table></div>`;
}

document.getElementById('table').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  try {
    await api('/admin/orders/' + btn.dataset.id + '/status', { method: 'PATCH', body: { status: btn.dataset.status } });
    toast('Order marked ' + btn.dataset.status);
    load();
  } catch (err) { toast(err.message, 'error'); }
});

load();

// My Orders page
if (requireLogin()) load();

async function load() {
  const box = document.getElementById('orders');
  try {
    const orders = await api('/orders');
    if (orders.length === 0) {
      box.innerHTML = '<div class="empty"><p>You have not placed any orders yet.</p><br><a href="/index.html" class="btn">Shop now</a></div>';
      return;
    }
    box.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${orders.map((o) => `
            <tr>
              <td>#${o.id}</td>
              <td>${formatDate(o.created_at)}</td>
              <td>${o.item_count}</td>
              <td>${rupees(o.total_amount)}</td>
              <td><span class="status status-${o.status}">${o.status}</span></td>
              <td><a href="/order.html?id=${o.id}" class="btn btn-small btn-outline">View</a></td>
            </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch (err) {
    box.innerHTML = `<p class="error-msg">${esc(err.message)}</p>`;
  }
}

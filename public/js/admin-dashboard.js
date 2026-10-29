// Admin dashboard: counts + low stock list
if (requireLogin('admin')) load();

async function load() {
  try {
    const s = await api('/admin/stats');
    const card = (num, label) => `<div class="stat"><div class="num">${num}</div><div class="lbl">${label}</div></div>`;
    document.getElementById('stats').innerHTML =
      card(s.totalProducts, 'Active products') +
      card(s.totalOrders, 'Total orders') +
      card(s.totalCustomers, 'Customers') +
      card(rupees(s.totalSales), 'Total sales (excl. cancelled)');

    const products = await api('/admin/products');
    const low = products.filter((p) => p.is_active && p.stock < 5);
    document.getElementById('low-stock').innerHTML = low.length === 0
      ? '<p class="muted">Nothing is running low.</p>'
      : `<div class="table-wrap"><table>
          <thead><tr><th>Product</th><th>Category</th><th>Stock</th></tr></thead>
          <tbody>${low.map((p) => `<tr class="row-low"><td>${esc(p.name)}</td><td>${esc(p.category_name)}</td><td><strong>${p.stock}</strong></td></tr>`).join('')}</tbody>
        </table></div>`;
  } catch (err) {
    document.getElementById('stats').innerHTML = `<p class="error-msg">${esc(err.message)}</p>`;
  }
}

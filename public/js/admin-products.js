// Admin product management: table + add/edit modal
if (!requireLogin('admin')) throw new Error('not admin');

let products = [];
let categories = [];
let editingId = null; // null = adding a new product

const modal = document.getElementById('modal');
const pForm = document.getElementById('product-form');
const errBox = document.getElementById('error');

async function load() {
  categories = await api('/categories');
  document.getElementById('p-category').innerHTML =
    categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  products = await api('/admin/products');
  drawTable();
}

function drawTable() {
  document.getElementById('table').innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${products.map((p) => `
        <tr class="${p.is_active && p.stock < 5 ? 'row-low' : ''}">
          <td><div class="thumb-cell"><img src="${esc(p.image_url)}" alt="">${esc(p.name)}</div></td>
          <td>${esc(p.category_name)}</td>
          <td>${rupees(p.price)}</td>
          <td>${p.stock}${p.is_active && p.stock < 5 ? ' <span class="stock-low">(low)</span>' : ''}</td>
          <td>${p.is_active ? 'Active' : '<span class="muted">Inactive</span>'}</td>
          <td>
            <button class="btn btn-small btn-outline" data-edit="${p.id}">Edit</button>
            ${p.is_active ? `<button class="btn btn-small btn-danger" data-delete="${p.id}">Delete</button>` : ''}
          </td>
        </tr>`).join('')}</tbody>
    </table></div>`;
}

function openModal(product) {
  editingId = product ? product.id : null;
  document.getElementById('modal-title').textContent = product ? 'Edit product' : 'Add product';
  document.getElementById('p-name').value = product ? product.name : '';
  document.getElementById('p-category').value = product ? product.category_id : categories[0]?.id;
  document.getElementById('p-price').value = product ? product.price / 100 : '';
  document.getElementById('p-stock').value = product ? product.stock : '';
  document.getElementById('p-image').value = product ? product.image_url : '';
  document.getElementById('p-desc').value = product ? product.description : '';
  document.getElementById('p-active').value = product ? product.is_active : 1;
  errBox.hidden = true;
  modal.classList.add('show');
}
const closeModal = () => modal.classList.remove('show');

document.getElementById('add-product').onclick = () => openModal(null);
document.getElementById('cancel-modal').onclick = closeModal;

document.getElementById('table').addEventListener('click', async (e) => {
  const editId = e.target.dataset.edit;
  const delId = e.target.dataset.delete;
  if (editId) openModal(products.find((p) => p.id === Number(editId)));
  if (delId && confirm('Delete this product? It will be hidden from the shop.')) {
    try {
      await api('/products/' + delId, { method: 'DELETE' });
      toast('Product deleted');
      load();
    } catch (err) { toast(err.message, 'error'); }
  }
});

pForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById('p-name').value.trim(),
    categoryId: Number(document.getElementById('p-category').value),
    price: document.getElementById('p-price').value,
    stock: document.getElementById('p-stock').value,
    imageUrl: document.getElementById('p-image').value.trim(),
    description: document.getElementById('p-desc').value.trim(),
    isActive: document.getElementById('p-active').value === '1',
  };

  // quick client side checks
  const fail = (m) => { errBox.textContent = m; errBox.hidden = false; };
  if (body.name.length < 2) return fail('Product name is required');
  if (body.price === '' || Number(body.price) < 0) return fail('Enter a valid price');
  if (body.stock === '' || !Number.isInteger(Number(body.stock)) || Number(body.stock) < 0) return fail('Stock must be a whole number');

  try {
    if (editingId) await api('/products/' + editingId, { method: 'PUT', body });
    else await api('/products', { method: 'POST', body });
    closeModal();
    toast(editingId ? 'Product updated' : 'Product added');
    load();
  } catch (err) {
    fail(err.message);
  }
});

load();

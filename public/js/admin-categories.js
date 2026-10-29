// Admin category management
if (!requireLogin('admin')) throw new Error('not admin');

async function load() {
  const cats = await api('/categories');
  document.getElementById('table').innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>Name</th><th>Actions</th></tr></thead>
      <tbody>${cats.map((c) => `
        <tr>
          <td>${c.id}</td><td>${esc(c.name)}</td>
          <td>
            <button class="btn btn-small btn-outline" data-edit="${c.id}" data-name="${esc(c.name)}">Rename</button>
            <button class="btn btn-small btn-danger" data-delete="${c.id}">Delete</button>
          </td>
        </tr>`).join('')}</tbody>
    </table></div>`;
}

document.getElementById('cat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('cat-name');
  try {
    await api('/categories', { method: 'POST', body: { name: input.value } });
    input.value = '';
    toast('Category added');
    load();
  } catch (err) { toast(err.message, 'error'); }
});

document.getElementById('table').addEventListener('click', async (e) => {
  const { edit, delete: del, name } = e.target.dataset;
  try {
    if (edit) {
      const newName = prompt('New category name:', name);
      if (!newName) return;
      await api('/categories/' + edit, { method: 'PUT', body: { name: newName } });
      toast('Category renamed');
      load();
    }
    if (del && confirm('Delete this category?')) {
      await api('/categories/' + del, { method: 'DELETE' });
      toast('Category deleted');
      load();
    }
  } catch (err) { toast(err.message, 'error'); }
});

load();

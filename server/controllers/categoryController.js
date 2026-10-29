const db = require('../db');
const { isText } = require('../middleware/validate');

exports.list = (req, res) => {
  res.json(db.prepare('SELECT id, name FROM categories ORDER BY name').all());
};

exports.create = (req, res) => {
  const { name } = req.body;
  if (!isText(name, 2)) return res.status(400).json({ error: 'Category name is required' });

  const dup = db.prepare('SELECT id FROM categories WHERE name = ?').get(name.trim());
  if (dup) return res.status(400).json({ error: 'Category already exists' });

  const r = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name.trim());
  res.status(201).json({ id: r.lastInsertRowid, name: name.trim() });
};

exports.update = (req, res) => {
  const { name } = req.body;
  if (!isText(name, 2)) return res.status(400).json({ error: 'Category name is required' });

  const dup = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(name.trim(), req.params.id);
  if (dup) return res.status(400).json({ error: 'Category already exists' });

  const r = db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Category not found' });
  res.json({ message: 'Category updated' });
};

exports.remove = (req, res) => {
  const used = db.prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ?').get(req.params.id).n;
  if (used > 0) {
    return res.status(400).json({ error: 'Cannot delete: this category still has products' });
  }
  const r = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Category not found' });
  res.json({ message: 'Category deleted' });
};

const db = require('../db');
const { isText, isPosInt } = require('../middleware/validate');

const PAGE_SIZE = 8;

// GET /api/products?search=&category=&sort=&page=
exports.list = (req, res) => {
  const { search = '', category, sort } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);

  let where = 'WHERE p.is_active = 1';
  const params = [];

  if (search.trim()) {
    where += ' AND p.name LIKE ?';
    params.push('%' + search.trim() + '%');
  }
  if (category) {
    where += ' AND p.category_id = ?';
    params.push(Number(category));
  }

  let orderBy = 'ORDER BY p.id DESC';
  if (sort === 'price_asc') orderBy = 'ORDER BY p.price ASC';
  if (sort === 'price_desc') orderBy = 'ORDER BY p.price DESC';

  const total = db
    .prepare(`SELECT COUNT(*) AS n FROM products p ${where}`)
    .get(...params).n;

  const products = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
       ${where} ${orderBy} LIMIT ? OFFSET ?`
    )
    .all(...params, PAGE_SIZE, (page - 1) * PAGE_SIZE);

  res.json({ products, page, totalPages: Math.ceil(total / PAGE_SIZE) || 1, total });
};

exports.getOne = (req, res) => {
  const product = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? AND p.is_active = 1`
    )
    .get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
};

// admin: all products including deactivated ones
exports.listAll = (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
       ORDER BY p.id DESC`
    )
    .all();
  res.json(rows);
};

// checks the body of create/update requests, returns an error message or null
function checkProduct(b) {
  if (!isText(b.name, 2)) return 'Product name is required';
  if (!isPosInt(b.categoryId)) return 'Choose a category';
  if (!(Number(b.price) >= 0) || b.price === '' || b.price === null) return 'Enter a valid price';
  if (!Number.isInteger(Number(b.stock)) || Number(b.stock) < 0) return 'Stock must be 0 or more';
  return null;
}

const toPaise = (rupees) => Math.round(Number(rupees) * 100);

exports.create = (req, res) => {
  const b = req.body;
  const problem = checkProduct(b);
  if (problem) return res.status(400).json({ error: problem });

  const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(b.categoryId);
  if (!cat) return res.status(400).json({ error: 'Category does not exist' });

  const r = db
    .prepare(
      `INSERT INTO products (category_id, name, description, price, stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(b.categoryId, b.name.trim(), b.description || '', toPaise(b.price), Number(b.stock), b.imageUrl || '/images/p1.svg');

  res.status(201).json({ id: r.lastInsertRowid, message: 'Product created' });
};

exports.update = (req, res) => {
  const b = req.body;
  const problem = checkProduct(b);
  if (problem) return res.status(400).json({ error: problem });

  const r = db
    .prepare(
      `UPDATE products SET category_id = ?, name = ?, description = ?, price = ?,
       stock = ?, image_url = ?, is_active = ? WHERE id = ?`
    )
    .run(
      b.categoryId, b.name.trim(), b.description || '', toPaise(b.price),
      Number(b.stock), b.imageUrl || '/images/p1.svg',
      b.isActive === false || b.isActive === 0 ? 0 : 1, req.params.id
    );

  if (r.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product updated' });
};

// products can be inside old orders, so we hide them instead of deleting rows
exports.remove = (req, res) => {
  const r = db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product deactivated' });
};

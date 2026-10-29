const db = require('../db');
const { isPosInt } = require('../middleware/validate');

// builds the cart response (items + totals) for one user
function getCart(userId) {
  const items = db
    .prepare(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.stock, p.image_url,
              ci.quantity * p.price AS line_total
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ? AND p.is_active = 1
       ORDER BY ci.id`
    )
    .all(userId);

  const totalAmount = items.reduce((sum, i) => sum + i.line_total, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, totalAmount, itemCount };
}

exports.get = (req, res) => res.json(getCart(req.user.id));

exports.add = (req, res) => {
  const { productId } = req.body;
  const qty = req.body.quantity === undefined ? 1 : req.body.quantity;
  if (!isPosInt(productId) || !isPosInt(qty)) {
    return res.status(400).json({ error: 'productId and quantity must be positive numbers' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock <= 0) return res.status(400).json({ error: 'This product is out of stock' });

  const existing = db
    .prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?')
    .get(req.user.id, productId);

  const newQty = (existing ? existing.quantity : 0) + Number(qty);
  if (newQty > product.stock) {
    return res.status(400).json({ error: `Only ${product.stock} left in stock` });
  }

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)')
      .run(req.user.id, productId, newQty);
  }
  res.status(201).json(getCart(req.user.id));
};

exports.update = (req, res) => {
  const { quantity } = req.body;
  if (!isPosInt(quantity)) return res.status(400).json({ error: 'Quantity must be 1 or more' });

  const item = db
    .prepare(
      `SELECT ci.id, p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.id = ? AND ci.user_id = ?`
    )
    .get(req.params.itemId, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });
  if (Number(quantity) > item.stock) {
    return res.status(400).json({ error: `Only ${item.stock} left in stock` });
  }

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, item.id);
  res.json(getCart(req.user.id));
};

exports.remove = (req, res) => {
  const r = db
    .prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?')
    .run(req.params.itemId, req.user.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Cart item not found' });
  res.json(getCart(req.user.id));
};

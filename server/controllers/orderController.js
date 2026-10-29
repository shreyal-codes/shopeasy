const db = require('../db');
const { isText, isPhone, isPin } = require('../middleware/validate');

// ---------- customer side ----------

// POST /api/orders  (checkout)
exports.place = (req, res) => {
  const { name, phone, address, city, pincode } = req.body;

  if (!isText(name, 2)) return res.status(400).json({ error: 'Enter your full name' });
  if (!isPhone(phone)) return res.status(400).json({ error: 'Enter a valid 10 digit mobile number' });
  if (!isText(address, 5)) return res.status(400).json({ error: 'Enter your full address' });
  if (!isText(city, 2)) return res.status(400).json({ error: 'Enter your city' });
  if (!isPin(pincode)) return res.status(400).json({ error: 'PIN code must be 6 digits' });

  const fullAddress = `${address.trim()}, ${city.trim()} - ${pincode}`;

  // Everything inside this function succeeds together or fails together.
  const placeOrder = db.transaction(() => {
    const cart = db
      .prepare(
        `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock
         FROM cart_items ci JOIN products p ON p.id = ci.product_id
         WHERE ci.user_id = ? AND p.is_active = 1`
      )
      .all(req.user.id);

    if (cart.length === 0) throw Object.assign(new Error('Your cart is empty'), { status: 400 });

    let total = 0;
    for (const item of cart) {
      if (item.quantity > item.stock) {
        throw Object.assign(new Error(`Not enough stock for ${item.name} (only ${item.stock} left)`), { status: 400 });
      }
      total += item.quantity * item.price;
    }

    const order = db
      .prepare(
        `INSERT INTO orders (user_id, total_amount, shipping_name, shipping_phone, shipping_address, payment_method)
         VALUES (?, ?, ?, ?, ?, 'COD')`
      )
      .run(req.user.id, total, name.trim(), phone, fullAddress);

    const addItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
    );
    const reduceStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of cart) {
      addItem.run(order.lastInsertRowid, item.product_id, item.quantity, item.price);
      reduceStock.run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    return order.lastInsertRowid;
  });

  try {
    const orderId = placeOrder();
    res.status(201).json({ orderId, message: 'Order placed successfully' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.myOrders = (req, res) => {
  const orders = db
    .prepare(
      `SELECT o.id, o.total_amount, o.status, o.created_at,
              (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) AS item_count
       FROM orders o WHERE o.user_id = ? ORDER BY o.id DESC`
    )
    .all(req.user.id);
  res.json(orders);
};

// GET /api/orders/:id  - customers can only open their own orders
exports.getOne = (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'This is not your order' });
  }

  order.items = db
    .prepare(
      `SELECT oi.quantity, oi.unit_price, oi.quantity * oi.unit_price AS line_total,
              p.id AS product_id, p.name, p.image_url
       FROM order_items oi JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`
    )
    .all(order.id);
  res.json(order);
};

// PATCH /api/orders/:id/cancel  (bonus: only while status is Placed)
exports.cancel = (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'Placed') {
    return res.status(400).json({ error: 'Only orders with status Placed can be cancelled' });
  }

  const cancelOrder = db.transaction(() => {
    db.prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ?").run(order.id);
    const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
    const restore = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    items.forEach((i) => restore.run(i.quantity, i.product_id));
  });
  cancelOrder();
  res.json({ message: 'Order cancelled and stock restored' });
};

// ---------- admin side ----------

exports.adminList = (req, res) => {
  const orders = db
    .prepare(
      `SELECT o.id, o.total_amount, o.status, o.created_at, u.name AS customer_name, u.email
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC`
    )
    .all();
  res.json(orders);
};

// Placed -> Shipped -> Delivered (one step forward at a time)
const NEXT_STATUS = { Placed: 'Shipped', Shipped: 'Delivered' };

exports.updateStatus = (req, res) => {
  const { status } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (!['Placed', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (NEXT_STATUS[order.status] !== status) {
    return res.status(400).json({ error: `Cannot change status from ${order.status} to ${status}` });
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, order.id);
  res.json({ message: 'Status updated', status });
};

exports.stats = (req, res) => {
  const one = (sql) => db.prepare(sql).get().n;
  res.json({
    totalProducts: one('SELECT COUNT(*) AS n FROM products WHERE is_active = 1'),
    totalOrders: one('SELECT COUNT(*) AS n FROM orders'),
    totalCustomers: one("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'"),
    // cancelled orders do not count as sales
    totalSales: one("SELECT COALESCE(SUM(total_amount), 0) AS n FROM orders WHERE status != 'Cancelled'"),
    lowStock: one('SELECT COUNT(*) AS n FROM products WHERE is_active = 1 AND stock < 5'),
  });
};

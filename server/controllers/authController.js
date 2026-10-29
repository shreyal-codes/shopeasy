const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { isEmail, isText } = require('../middleware/validate');

// helper: make a token that holds id, name and role
function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2d' }
  );
}

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  if (!isText(name, 2)) return res.status(400).json({ error: 'Name must be at least 2 characters' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email' });
  if (!isText(password, 6)) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (exists) return res.status(400).json({ error: 'This email is already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')")
    .run(name.trim(), email.toLowerCase(), hash);

  const user = { id: result.lastInsertRowid, name: name.trim(), role: 'customer' };
  res.status(201).json({ token: makeToken(user), user });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!isEmail(email) || !isText(password)) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  // same message for both cases so nobody can guess which emails exist
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = { id: row.id, name: row.name, role: row.role };
  res.json({ token: makeToken(user), user });
};

exports.me = (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, role, phone, address FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

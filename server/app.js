require('dotenv').config();
const express = require('express');
const path = require('path');
require('./db'); // opens the database (and creates it on first run)

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env first.');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

// unknown API url -> JSON 404
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

// last safety net for unexpected errors
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ShopEasy running at http://localhost:${PORT}`));

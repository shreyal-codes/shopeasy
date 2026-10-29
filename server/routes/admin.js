const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const orders = require('../controllers/orderController');
const products = require('../controllers/productController');

router.use(auth, adminOnly);   // everything under /api/admin is admin only
router.get('/orders', orders.adminList);
router.patch('/orders/:id/status', orders.updateStatus);
router.get('/stats', orders.stats);
router.get('/products', products.listAll);

module.exports = router;

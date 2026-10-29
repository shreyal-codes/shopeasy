const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/orderController');

router.use(auth);
router.post('/', c.place);
router.get('/', c.myOrders);
router.get('/:id', c.getOne);
router.patch('/:id/cancel', c.cancel);

module.exports = router;

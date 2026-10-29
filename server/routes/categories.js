const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const c = require('../controllers/categoryController');

router.get('/', c.list);
router.post('/', auth, adminOnly, c.create);
router.put('/:id', auth, adminOnly, c.update);
router.delete('/:id', auth, adminOnly, c.remove);

module.exports = router;

const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/cartController');

router.use(auth);   // every cart route needs a logged in user
router.get('/', c.get);
router.post('/', c.add);
router.put('/:itemId', c.update);
router.delete('/:itemId', c.remove);

module.exports = router;

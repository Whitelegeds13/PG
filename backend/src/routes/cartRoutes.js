const express = require('express');

const {
  addItem,
  clearCart,
  getCart,
  removeItem,
  updateItem,
} = require('../controllers/cartController');
const { authorize, protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect, authorize('cliente'));

router.get('/', getCart);
router.post('/items', addItem);
router.patch('/items/:productId', updateItem);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);

module.exports = router;

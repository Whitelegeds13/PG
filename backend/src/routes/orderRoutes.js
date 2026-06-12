const express = require('express');

const {
  createOrder,
  getOrder,
  listOrders,
  simulatePayment,
  updateOrderStatus,
} = require('../controllers/orderController');
const { authorize, protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('cliente', 'administrador'), listOrders);
router.post('/', authorize('cliente'), createOrder);
router.get('/:id', authorize('cliente', 'administrador'), getOrder);
router.post('/:id/pay', authorize('cliente'), simulatePayment);
router.patch('/:id/status', authorize('administrador'), updateOrderStatus);

module.exports = router;

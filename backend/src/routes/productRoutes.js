const express = require('express');

const {
  createProduct,
  deleteProduct,
  getProduct,
  listLowStockProducts,
  listProducts,
  listStockMovements,
  updateProduct,
  updateStock,
} = require('../controllers/productController');
const { authorize, protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', listProducts);
router.get(
  '/low-stock',
  protect,
  authorize('administrador'),
  listLowStockProducts,
);
router.get('/:id', getProduct);
router.post('/', protect, authorize('administrador'), createProduct);
router.patch('/:id', protect, authorize('administrador'), updateProduct);
router.delete('/:id', protect, authorize('administrador'), deleteProduct);
router.patch(
  '/:id/stock',
  protect,
  authorize('administrador'),
  updateStock,
);
router.get(
  '/:id/stock-movements',
  protect,
  authorize('administrador'),
  listStockMovements,
);

module.exports = router;

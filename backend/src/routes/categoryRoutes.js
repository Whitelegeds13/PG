const express = require('express');

const {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} = require('../controllers/categoryController');
const { authorize, protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', listCategories);
router.post('/', protect, authorize('administrador'), createCategory);
router.patch('/:id', protect, authorize('administrador'), updateCategory);
router.delete('/:id', protect, authorize('administrador'), deleteCategory);

module.exports = router;

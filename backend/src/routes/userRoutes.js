const express = require('express');

const { listUsers, updateUser } = require('../controllers/userController');
const { authorize, protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, authorize('administrador'), listUsers);
router.patch('/:id', protect, authorize('administrador'), updateUser);

module.exports = router;

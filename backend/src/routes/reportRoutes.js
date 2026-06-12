const express = require('express');

const { getSummary } = require('../controllers/reportController');
const { authorize, protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/summary', protect, authorize('administrador'), getSummary);

module.exports = router;

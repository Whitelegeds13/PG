const express = require('express');

const {
  addMessage,
  assignTicket,
  createQuote,
  createTicket,
  getTicket,
  listTickets,
  respondQuote,
  updateTicketStatus,
} = require('../controllers/ticketController');
const { authorize, protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('cliente', 'soporte', 'administrador'), listTickets);
router.post('/', authorize('cliente'), createTicket);
router.get('/:id', authorize('cliente', 'soporte', 'administrador'), getTicket);
router.post(
  '/:id/messages',
  authorize('cliente', 'soporte', 'administrador'),
  addMessage,
);
router.patch(
  '/:id/assign',
  authorize('soporte', 'administrador'),
  assignTicket,
);
router.patch(
  '/:id/status',
  authorize('soporte', 'administrador'),
  updateTicketStatus,
);
router.post(
  '/:id/quote',
  authorize('soporte', 'administrador'),
  createQuote,
);
router.patch('/:id/quote', authorize('cliente'), respondQuote);

module.exports = router;

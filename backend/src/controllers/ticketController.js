const Quote = require('../models/Quote');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const {
  buildQuoteItems,
  calculateQuoteTotal,
  createTicketNumber,
  validateTicketTransition,
} = require('../utils/support');

const ticketPopulation = [
  { path: 'client', select: 'name email' },
  { path: 'assignedTo', select: 'name email' },
  { path: 'messages.author', select: 'name email role' },
];

async function createTicket(req, res) {
  const ticket = await Ticket.create({
    ticketNumber: createTicketNumber(),
    client: req.user._id,
    subject: req.body.subject,
    description: req.body.description,
    category: req.body.category,
    priority: req.body.priority,
  });

  return res.status(201).json({ ticket });
}

async function listTickets(req, res) {
  const filter = req.user.role === 'cliente' ? { client: req.user._id } : {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const tickets = await Ticket.find(filter)
    .populate(ticketPopulation)
    .sort({ createdAt: -1 });

  return res.json({ tickets });
}

async function getTicket(req, res) {
  const ticket = await findAccessibleTicket(req);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket no encontrado' });
  }

  const quote = await Quote.findOne({ ticket: ticket._id })
    .populate('createdBy', 'name email');

  return res.json({ ticket, quote });
}

async function addMessage(req, res) {
  if (!req.body.message?.trim()) {
    return res.status(400).json({ message: 'El mensaje es obligatorio' });
  }

  const ticket = await findAccessibleTicket(req, false);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket no encontrado' });
  }

  if (ticket.status === 'cerrado') {
    return res.status(409).json({ message: 'El ticket esta cerrado' });
  }

  ticket.messages.push({
    author: req.user._id,
    authorRole: req.user.role,
    message: req.body.message,
  });
  await ticket.save();
  await ticket.populate(ticketPopulation);

  return res.status(201).json({ ticket });
}

async function assignTicket(req, res) {
  const assigneeId = req.user.role === 'soporte'
    ? req.user._id
    : req.body.assignedTo;
  const assignee = await User.findOne({
    _id: assigneeId,
    role: 'soporte',
    active: true,
  });

  if (!assignee) {
    return res.status(400).json({ message: 'El usuario de soporte no es valido' });
  }

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket no encontrado' });
  }

  ticket.assignedTo = assignee._id;

  if (ticket.status === 'abierto') {
    ticket.status = 'en_revision';
  }

  await ticket.save();
  await ticket.populate(ticketPopulation);

  return res.json({ ticket });
}

async function updateTicketStatus(req, res) {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket no encontrado' });
  }

  validateTicketTransition(ticket.status, req.body.status);
  ticket.status = req.body.status;
  await ticket.save();

  return res.json({ ticket });
}

async function createQuote(req, res) {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket no encontrado' });
  }

  if (['resuelto', 'cerrado'].includes(ticket.status)) {
    return res.status(409).json({
      message: 'No se puede cotizar un ticket finalizado',
    });
  }

  const items = buildQuoteItems(req.body.items);
  const laborCost = req.body.laborCost || 0;
  const validUntil = new Date(req.body.validUntil);

  if (Number.isNaN(validUntil.getTime()) || validUntil <= new Date()) {
    return res.status(400).json({ message: 'La vigencia de la cotizacion no es valida' });
  }

  const quote = await Quote.findOneAndUpdate(
    { ticket: ticket._id },
    {
      $set: {
        ticket: ticket._id,
        createdBy: req.user._id,
        diagnosis: req.body.diagnosis,
        items,
        laborCost,
        total: calculateQuoteTotal(items, laborCost),
        status: 'pendiente',
        validUntil,
      },
      $unset: { respondedAt: 1 },
    },
    {
      returnDocument: 'after',
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  ticket.status = 'cotizado';
  await ticket.save();

  return res.status(201).json({ quote, ticket });
}

async function respondQuote(req, res) {
  if (!['aprobada', 'rechazada'].includes(req.body.status)) {
    return res.status(400).json({
      message: 'La respuesta debe ser aprobada o rechazada',
    });
  }

  const ticket = await Ticket.findOne({
    _id: req.params.id,
    client: req.user._id,
  });

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket no encontrado' });
  }

  const quote = await Quote.findOne({
    ticket: ticket._id,
    status: 'pendiente',
  });

  if (!quote) {
    return res.status(404).json({ message: 'Cotizacion pendiente no encontrada' });
  }

  if (quote.validUntil < new Date()) {
    return res.status(409).json({ message: 'La cotizacion ha vencido' });
  }

  quote.status = req.body.status;
  quote.respondedAt = new Date();
  await quote.save();

  ticket.status = req.body.status === 'aprobada' ? 'aprobado' : 'en_revision';
  await ticket.save();

  return res.json({ quote, ticket });
}

function findAccessibleTicket(req, populate = true) {
  const filter = { _id: req.params.id };

  if (req.user.role === 'cliente') {
    filter.client = req.user._id;
  }

  const query = Ticket.findOne(filter);
  return populate ? query.populate(ticketPopulation) : query;
}

module.exports = {
  addMessage,
  assignTicket,
  createQuote,
  createTicket,
  getTicket,
  listTickets,
  respondQuote,
  updateTicketStatus,
};

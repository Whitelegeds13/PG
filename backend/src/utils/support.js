const crypto = require('node:crypto');

const ticketTransitions = {
  abierto: ['en_revision', 'cerrado'],
  en_revision: ['cotizado', 'en_proceso', 'resuelto', 'cerrado'],
  cotizado: ['aprobado', 'en_revision', 'cerrado'],
  aprobado: ['en_proceso', 'cerrado'],
  en_proceso: ['resuelto', 'cerrado'],
  resuelto: ['cerrado', 'en_proceso'],
  cerrado: [],
};

function createTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `ST-${date}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function buildQuoteItems(items = []) {
  if (!Array.isArray(items)) {
    throw createSupportError('Los conceptos de la cotizacion no son validos');
  }

  return items.map((item) => {
    if (
      !item.description?.trim()
      || !Number.isInteger(item.quantity)
      || item.quantity < 1
      || !Number.isFinite(item.unitPrice)
      || item.unitPrice < 0
    ) {
      throw createSupportError('Los conceptos de la cotizacion no son validos');
    }

    return {
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: roundMoney(item.unitPrice),
      subtotal: roundMoney(item.quantity * item.unitPrice),
    };
  });
}

function calculateQuoteTotal(items, laborCost = 0) {
  if (!Number.isFinite(laborCost) || laborCost < 0) {
    throw createSupportError('El costo de mano de obra no es valido');
  }

  return roundMoney(
    items.reduce((total, item) => total + item.subtotal, 0) + laborCost,
  );
}

function validateTicketTransition(currentStatus, nextStatus) {
  if (!(ticketTransitions[currentStatus] || []).includes(nextStatus)) {
    throw createSupportError(
      `No se puede cambiar el ticket de ${currentStatus} a ${nextStatus}`,
    );
  }
}

function createSupportError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

module.exports = {
  buildQuoteItems,
  calculateQuoteTotal,
  createSupportError,
  createTicketNumber,
  validateTicketTransition,
};

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const Quote = require('../src/models/Quote');
const Ticket = require('../src/models/Ticket');
const {
  buildQuoteItems,
  calculateQuoteTotal,
  validateTicketTransition,
} = require('../src/utils/support');

const clientId = '507f1f77bcf86cd799439011';
const supportId = '507f1f77bcf86cd799439012';
const ticketId = '507f1f77bcf86cd799439013';

describe('Tickets de soporte', () => {
  it('valida un ticket nuevo', async () => {
    const ticket = new Ticket({
      ticketNumber: 'ST-20260612-ABC12345',
      client: clientId,
      subject: 'Equipo no enciende',
      description: 'El equipo dejo de encender despues de una actualizacion.',
      category: 'hardware',
      priority: 'alta',
    });

    await ticket.validate();
    assert.equal(ticket.status, 'abierto');
  });

  it('valida mensajes y transiciones de estado', async () => {
    const ticket = new Ticket({
      ticketNumber: 'ST-20260612-XYZ12345',
      client: clientId,
      subject: 'Falla de sistema',
      description: 'El sistema operativo muestra una pantalla de error.',
      category: 'software',
      messages: [{
        author: supportId,
        authorRole: 'soporte',
        message: 'Revisaremos el equipo.',
      }],
    });

    await ticket.validate();
    assert.doesNotThrow(() => validateTicketTransition('abierto', 'en_revision'));
    assert.doesNotThrow(() => validateTicketTransition('en_proceso', 'resuelto'));
    assert.throws(
      () => validateTicketTransition('abierto', 'resuelto'),
      /No se puede cambiar/,
    );
  });
});

describe('Cotizaciones de soporte', () => {
  it('calcula conceptos, mano de obra y total', () => {
    const items = buildQuoteItems([
      { description: 'Fuente de poder', quantity: 1, unitPrice: 250.5 },
      { description: 'Cable', quantity: 2, unitPrice: 15.25 },
    ]);

    assert.equal(items[0].subtotal, 250.5);
    assert.equal(items[1].subtotal, 30.5);
    assert.equal(calculateQuoteTotal(items, 80), 361);
  });

  it('rechaza conceptos y costos invalidos', () => {
    assert.throws(
      () => buildQuoteItems([{ description: '', quantity: 1, unitPrice: 10 }]),
      /conceptos/,
    );
    assert.throws(
      () => calculateQuoteTotal([], -1),
      /mano de obra/,
    );
  });

  it('valida el modelo de cotizacion', async () => {
    const items = buildQuoteItems([
      { description: 'Limpieza interna', quantity: 1, unitPrice: 50 },
    ]);
    const quote = new Quote({
      ticket: ticketId,
      createdBy: supportId,
      diagnosis: 'El equipo requiere mantenimiento preventivo.',
      items,
      laborCost: 25,
      total: calculateQuoteTotal(items, 25),
      validUntil: new Date('2026-07-12T00:00:00Z'),
    });

    await quote.validate();
    assert.equal(quote.status, 'pendiente');
  });
});

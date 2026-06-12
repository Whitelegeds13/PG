const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const {
  buildOrderItems,
  calculateOrderTotal,
  validateOrderTransition,
} = require('../src/utils/order');

const userId = '507f1f77bcf86cd799439011';
const productId = '507f1f77bcf86cd799439012';

describe('Pedidos', () => {
  const cartItems = [
    {
      product: {
        _id: productId,
        name: 'Monitor Gamer',
        sku: 'MON-001',
        price: 799.95,
        stock: 4,
        active: true,
      },
      quantity: 2,
    },
  ];

  it('crea una copia de productos y precios del carrito', () => {
    const items = buildOrderItems(cartItems);

    assert.deepEqual(items[0], {
      product: productId,
      name: 'Monitor Gamer',
      sku: 'MON-001',
      unitPrice: 799.95,
      quantity: 2,
      subtotal: 1599.9,
    });
    assert.equal(calculateOrderTotal(items), 1599.9);
  });

  it('rechaza carritos vacios o sin stock suficiente', () => {
    assert.throws(() => buildOrderItems([]), /carrito esta vacio/);
    assert.throws(
      () => buildOrderItems([
        {
          product: { ...cartItems[0].product, stock: 1 },
          quantity: 2,
        },
      ]),
      /Stock insuficiente/,
    );
  });

  it('valida el modelo de pedido', async () => {
    const items = buildOrderItems(cartItems);
    const order = new Order({
      orderNumber: 'PG-20260612-ABC12345',
      user: userId,
      items,
      total: calculateOrderTotal(items),
      shippingAddress: {
        recipient: 'Cliente Prueba',
        phone: '999999999',
        address: 'Av. Principal 123',
        city: 'Lima',
      },
    });

    await order.validate();
    assert.equal(order.status, 'pendiente_pago');
    assert.equal(order.paymentStatus, 'pendiente');
  });

  it('solo permite avanzar por estados validos', () => {
    assert.doesNotThrow(() => validateOrderTransition('pagado', 'en_preparacion'));
    assert.doesNotThrow(() => validateOrderTransition('en_preparacion', 'enviado'));
    assert.doesNotThrow(() => validateOrderTransition('enviado', 'entregado'));
    assert.throws(
      () => validateOrderTransition('pagado', 'entregado'),
      /No se puede cambiar/,
    );
    assert.throws(
      () => validateOrderTransition('pagado', 'cancelado'),
      /No se puede cambiar/,
    );
  });
});

describe('Pagos simulados', () => {
  it('valida un pago aprobado', async () => {
    const payment = new Payment({
      order: '507f1f77bcf86cd799439013',
      user: userId,
      transactionCode: 'PAY-123-ABC',
      method: 'tarjeta',
      amount: 1599.9,
      status: 'aprobado',
      message: 'Pago aprobado por el simulador',
    });

    await payment.validate();
  });

  it('rechaza metodos de pago desconocidos', async () => {
    const payment = new Payment({
      order: '507f1f77bcf86cd799439013',
      user: userId,
      transactionCode: 'PAY-123-XYZ',
      method: 'criptomoneda',
      amount: 100,
      status: 'aprobado',
      message: 'Prueba',
    });

    await assert.rejects(payment.validate(), /metodo de pago no es valido/);
  });
});

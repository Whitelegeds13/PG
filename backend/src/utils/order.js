const crypto = require('node:crypto');

const orderTransitions = {
  pagado: ['en_preparacion'],
  en_preparacion: ['enviado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
};

function buildOrderItems(cartItems) {
  if (!cartItems.length) {
    throw createOrderError('El carrito esta vacio');
  }

  return cartItems.map((item) => {
    const product = item.product;

    if (!product?.active) {
      throw createOrderError('El carrito contiene productos no disponibles');
    }

    if (product.stock < item.quantity) {
      throw createOrderError(`Stock insuficiente para ${product.name}`);
    }

    const unitPrice = roundMoney(product.price);

    return {
      product: product._id,
      name: product.name,
      sku: product.sku,
      unitPrice,
      quantity: item.quantity,
      subtotal: roundMoney(unitPrice * item.quantity),
    };
  });
}

function calculateOrderTotal(items) {
  return roundMoney(items.reduce((total, item) => total + item.subtotal, 0));
}

function createOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `PG-${date}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function createTransactionCode() {
  return `PAY-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function validateOrderTransition(currentStatus, nextStatus) {
  const allowed = orderTransitions[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    throw createOrderError(
      `No se puede cambiar el pedido de ${currentStatus} a ${nextStatus}`,
    );
  }
}

function createOrderError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

module.exports = {
  buildOrderItems,
  calculateOrderTotal,
  createOrderError,
  createOrderNumber,
  createTransactionCode,
  validateOrderTransition,
};

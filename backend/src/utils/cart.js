function validateCartQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    const error = new Error('La cantidad debe ser un numero entero mayor que cero');
    error.statusCode = 400;
    throw error;
  }
}

function formatCart(cart) {
  const items = cart.items.map((item) => {
    const product = item.product;
    const available = Boolean(product?.active && product.stock >= item.quantity);
    const unitPrice = product?.price || 0;

    return {
      product,
      quantity: item.quantity,
      subtotal: roundMoney(unitPrice * item.quantity),
      available,
    };
  });

  return {
    id: cart._id,
    user: cart.user,
    items,
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
    total: roundMoney(
      items.reduce((total, item) => total + item.subtotal, 0),
    ),
    updatedAt: cart.updatedAt,
  };
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

module.exports = {
  formatCart,
  validateCartQuantity,
};

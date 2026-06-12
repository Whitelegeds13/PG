function calculateNewStock(currentStock, type, quantity) {
  validateMovement(type, quantity);

  if (type === 'entrada') {
    return currentStock + quantity;
  }

  if (type === 'salida') {
    if (quantity > currentStock) {
      throw createInventoryError('No hay stock suficiente para realizar la salida');
    }

    return currentStock - quantity;
  }

  return quantity;
}

function validateMovement(type, quantity) {
  if (!['entrada', 'salida', 'ajuste'].includes(type)) {
    throw createInventoryError('El tipo de movimiento no es valido');
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw createInventoryError('La cantidad debe ser un numero entero no negativo');
  }

  if (type !== 'ajuste' && quantity === 0) {
    throw createInventoryError('La cantidad debe ser mayor que cero');
  }
}

function createInventoryError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  calculateNewStock,
  validateMovement,
};

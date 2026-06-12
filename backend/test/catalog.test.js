const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const StockMovement = require('../src/models/StockMovement');
const { calculateNewStock } = require('../src/utils/inventory');

const categoryId = '507f1f77bcf86cd799439011';
const productId = '507f1f77bcf86cd799439012';
const userId = '507f1f77bcf86cd799439013';

describe('Catalogo', () => {
  it('valida una categoria correcta', async () => {
    const category = new Category({
      name: 'Tarjetas graficas',
      description: 'Componentes de video',
    });

    await category.validate();
    assert.equal(category.active, true);
  });

  it('normaliza el SKU y calcula stock bajo', async () => {
    const product = new Product({
      name: 'Tarjeta grafica',
      sku: ' gpu-001 ',
      category: categoryId,
      price: 1499.9,
      stock: 3,
      minimumStock: 5,
    });

    await product.validate();

    assert.equal(product.sku, 'GPU-001');
    assert.equal(product.lowStock, true);
  });

  it('rechaza precios y existencias negativas', async () => {
    const product = new Product({
      name: 'Producto invalido',
      sku: 'INV-001',
      category: categoryId,
      price: -1,
      stock: -2,
    });

    await assert.rejects(product.validate(), /precio no puede ser negativo/);
  });

  it('valida el historial de movimientos', async () => {
    const movement = new StockMovement({
      product: productId,
      user: userId,
      type: 'entrada',
      quantity: 4,
      previousStock: 2,
      newStock: 6,
      reason: 'Compra a proveedor',
    });

    await movement.validate();
  });
});

describe('Calculo de inventario', () => {
  it('calcula entradas, salidas y ajustes', () => {
    assert.equal(calculateNewStock(5, 'entrada', 3), 8);
    assert.equal(calculateNewStock(5, 'salida', 2), 3);
    assert.equal(calculateNewStock(5, 'ajuste', 10), 10);
  });

  it('impide una salida superior al stock disponible', () => {
    assert.throws(
      () => calculateNewStock(2, 'salida', 3),
      /No hay stock suficiente/,
    );
  });

  it('rechaza cantidades decimales y tipos desconocidos', () => {
    assert.throws(
      () => calculateNewStock(2, 'entrada', 1.5),
      /numero entero/,
    );
    assert.throws(
      () => calculateNewStock(2, 'reserva', 1),
      /tipo de movimiento/,
    );
  });
});

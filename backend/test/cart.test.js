const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const Cart = require('../src/models/Cart');
const { formatCart, validateCartQuantity } = require('../src/utils/cart');
const { buildProductQuery } = require('../src/utils/productQuery');

const userId = '507f1f77bcf86cd799439011';
const productId = '507f1f77bcf86cd799439012';
const categoryId = '507f1f77bcf86cd799439013';

describe('Busqueda y filtros', () => {
  it('crea filtros de texto, categoria, precio y disponibilidad', () => {
    const result = buildProductQuery({
      search: 'teclado (pro)',
      category: categoryId,
      minPrice: '50',
      maxPrice: '300',
      inStock: 'true',
      sort: 'price_asc',
      page: '2',
      limit: '10',
    });

    assert.equal(result.filter.active, true);
    assert.equal(result.filter.category, categoryId);
    assert.deepEqual(result.filter.price, { $gte: 50, $lte: 300 });
    assert.deepEqual(result.filter.stock, { $gt: 0 });
    assert.equal(result.filter.$or[0].name.$regex, 'teclado \\(pro\\)');
    assert.deepEqual(result.sort, { price: 1, name: 1 });
    assert.equal(result.page, 2);
    assert.equal(result.limit, 10);
    assert.equal(result.skip, 10);
  });

  it('aplica valores predeterminados y limita el tamano de pagina', () => {
    const defaults = buildProductQuery({});
    const limited = buildProductQuery({ limit: '100' });

    assert.equal(defaults.page, 1);
    assert.equal(defaults.limit, 12);
    assert.equal(limited.limit, 50);
  });

  it('rechaza rangos y parametros invalidos', () => {
    assert.throws(
      () => buildProductQuery({ minPrice: '20', maxPrice: '10' }),
      /precio minimo no puede superar/,
    );
    assert.throws(
      () => buildProductQuery({ inStock: 'yes' }),
      /debe ser true o false/,
    );
    assert.throws(
      () => buildProductQuery({ page: '0' }),
      /pagina no es valida/,
    );
    assert.throws(
      () => buildProductQuery({ sort: 'popular' }),
      /orden solicitado no es valido/,
    );
  });
});

describe('Carrito', () => {
  it('valida cantidades enteras positivas', () => {
    assert.doesNotThrow(() => validateCartQuantity(2));
    assert.throws(() => validateCartQuantity(0), /mayor que cero/);
    assert.throws(() => validateCartQuantity(1.5), /numero entero/);
  });

  it('valida el modelo de carrito', async () => {
    const cart = new Cart({
      user: userId,
      items: [{ product: productId, quantity: 2 }],
    });

    await cart.validate();
  });

  it('calcula subtotales, total y disponibilidad', () => {
    const formatted = formatCart({
      _id: 'cart-1',
      user: userId,
      updatedAt: new Date('2026-06-12T00:00:00Z'),
      items: [
        {
          product: {
            _id: productId,
            name: 'Mouse',
            price: 49.95,
            stock: 3,
            active: true,
          },
          quantity: 2,
        },
        {
          product: {
            _id: '507f1f77bcf86cd799439014',
            name: 'Teclado',
            price: 100,
            stock: 0,
            active: true,
          },
          quantity: 1,
        },
      ],
    });

    assert.equal(formatted.items[0].subtotal, 99.9);
    assert.equal(formatted.items[0].available, true);
    assert.equal(formatted.items[1].available, false);
    assert.equal(formatted.totalItems, 3);
    assert.equal(formatted.total, 199.9);
  });
});

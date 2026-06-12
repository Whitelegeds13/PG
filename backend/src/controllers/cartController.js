const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { formatCart, validateCartQuantity } = require('../utils/cart');

const productPopulation = {
  path: 'items.product',
  select: 'name sku price stock imageUrl active category',
  populate: {
    path: 'category',
    select: 'name',
  },
};

async function getCart(req, res) {
  const cart = await findOrCreateCart(req.user._id);

  return res.json({ cart: formatCart(cart) });
}

async function addItem(req, res) {
  const { productId, quantity = 1 } = req.body;
  validateCartQuantity(quantity);

  const product = await Product.findOne({
    _id: productId,
    active: true,
  });

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  const existingItem = cart?.items.find(
    (item) => item.product.toString() === product.id,
  );
  const requestedQuantity = (existingItem?.quantity || 0) + quantity;

  if (requestedQuantity > product.stock) {
    return res.status(400).json({
      message: 'La cantidad solicitada supera el stock disponible',
    });
  }

  const currentCart = cart || new Cart({ user: req.user._id });

  if (existingItem) {
    existingItem.quantity = requestedQuantity;
  } else {
    currentCart.items.push({ product: product._id, quantity });
  }

  await currentCart.save();
  await currentCart.populate(productPopulation);

  return res.status(201).json({ cart: formatCart(currentCart) });
}

async function updateItem(req, res) {
  const { quantity } = req.body;
  validateCartQuantity(quantity);

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({ message: 'Carrito no encontrado' });
  }

  const item = cart.items.find(
    (cartItem) => cartItem.product.toString() === req.params.productId,
  );

  if (!item) {
    return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
  }

  const product = await Product.findOne({
    _id: req.params.productId,
    active: true,
  });

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  if (quantity > product.stock) {
    return res.status(400).json({
      message: 'La cantidad solicitada supera el stock disponible',
    });
  }

  item.quantity = quantity;
  await cart.save();
  await cart.populate(productPopulation);

  return res.json({ cart: formatCart(cart) });
}

async function removeItem(req, res) {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({ message: 'Carrito no encontrado' });
  }

  const originalLength = cart.items.length;
  cart.items = cart.items.filter(
    (item) => item.product.toString() !== req.params.productId,
  );

  if (cart.items.length === originalLength) {
    return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
  }

  await cart.save();
  await cart.populate(productPopulation);

  return res.json({ cart: formatCart(cart) });
}

async function clearCart(req, res) {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { items: [] } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  ).populate(productPopulation);

  return res.json({ cart: formatCart(cart) });
}

async function findOrCreateCart(userId) {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  ).populate(productPopulation);

  return cart;
}

module.exports = {
  addItem,
  clearCart,
  getCart,
  removeItem,
  updateItem,
};

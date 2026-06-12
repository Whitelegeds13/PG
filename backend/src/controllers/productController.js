const Category = require('../models/Category');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { validateMovement } = require('../utils/inventory');
const { buildProductQuery } = require('../utils/productQuery');

async function listProducts(req, res) {
  const {
    filter,
    limit,
    page,
    skip,
    sort,
  } = buildProductQuery(req.query);
  const [products, total] = await Promise.all([
    Product.find(filter)
    .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return res.json({
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

async function getProduct(req, res) {
  const filter = { _id: req.params.id };

  if (req.user?.role !== 'administrador') {
    filter.active = true;
  }

  const product = await Product.findOne(filter).populate('category', 'name');

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  return res.json({ product });
}

async function createProduct(req, res) {
  const {
    name,
    sku,
    description,
    category,
    price,
    stock,
    minimumStock,
    imageUrl,
  } = req.body;

  if (!(await Category.exists({ _id: category, active: true }))) {
    return res.status(400).json({ message: 'La categoria no existe o esta inactiva' });
  }

  const product = await Product.create({
    name,
    sku,
    description,
    category,
    price,
    stock,
    minimumStock,
    imageUrl,
  });

  return res.status(201).json({
    product: await product.populate('category', 'name'),
  });
}

async function updateProduct(req, res) {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  if (
    req.body.category !== undefined
    && !(await Category.exists({ _id: req.body.category, active: true }))
  ) {
    return res.status(400).json({ message: 'La categoria no existe o esta inactiva' });
  }

  const allowedFields = [
    'name',
    'sku',
    'description',
    'category',
    'price',
    'minimumStock',
    'imageUrl',
    'active',
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  return res.json({
    product: await product.populate('category', 'name'),
  });
}

async function deleteProduct(req, res) {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  product.active = false;
  await product.save();

  return res.json({
    message: 'Producto desactivado',
    product,
  });
}

async function updateStock(req, res) {
  const { type, quantity, reason } = req.body;

  if (!reason?.trim()) {
    return res.status(400).json({ message: 'El motivo del movimiento es obligatorio' });
  }

  validateMovement(type, quantity);

  let previousProduct;

  if (type === 'entrada') {
    previousProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock: quantity } },
      { runValidators: true },
    );
  } else if (type === 'salida') {
    previousProduct = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        stock: { $gte: quantity },
      },
      { $inc: { stock: -quantity } },
      { runValidators: true },
    );

    if (!previousProduct) {
      const productExists = await Product.exists({ _id: req.params.id });

      if (productExists) {
        return res.status(400).json({
          message: 'No hay stock suficiente para realizar la salida',
        });
      }
    }
  } else {
    previousProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { stock: quantity } },
      { runValidators: true },
    );
  }

  if (!previousProduct) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  const previousStock = previousProduct.stock;
  const newStock = type === 'entrada'
    ? previousStock + quantity
    : type === 'salida'
      ? previousStock - quantity
      : quantity;
  const movement = await StockMovement.create({
    product: previousProduct._id,
    user: req.user._id,
    type,
    quantity,
    previousStock,
    newStock,
    reason,
  });
  const product = await Product.findById(previousProduct._id)
    .populate('category', 'name');

  return res.json({ movement, product });
}

async function listStockMovements(req, res) {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  const movements = await StockMovement.find({ product: product._id })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  return res.json({ movements });
}

async function listLowStockProducts(_req, res) {
  const products = await Product.find({
    active: true,
    $expr: { $lte: ['$stock', '$minimumStock'] },
  })
    .populate('category', 'name')
    .sort({ stock: 1 });

  return res.json({ products });
}

module.exports = {
  createProduct,
  deleteProduct,
  getProduct,
  listLowStockProducts,
  listProducts,
  listStockMovements,
  updateProduct,
  updateStock,
};

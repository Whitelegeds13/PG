const mongoose = require('mongoose');

const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const {
  buildOrderItems,
  calculateOrderTotal,
  createOrderError,
  createOrderNumber,
  createTransactionCode,
  validateOrderTransition,
} = require('../utils/order');

const orderPopulation = [
  { path: 'user', select: 'name email' },
  { path: 'items.product', select: 'name sku imageUrl active' },
];

async function createOrder(req, res) {
  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: req.user._id })
        .session(session)
        .populate({
          path: 'items.product',
          select: 'name sku price stock active',
        });

      if (!cart) {
        throw createOrderError('El carrito esta vacio');
      }

      const items = buildOrderItems(cart.items);
      [order] = await Order.create(
        [{
          orderNumber: createOrderNumber(),
          user: req.user._id,
          items,
          total: calculateOrderTotal(items),
          shippingAddress: req.body.shippingAddress,
        }],
        { session },
      );

      cart.items = [];
      await cart.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return res.status(201).json({ order });
}

async function listOrders(req, res) {
  const filter = req.user.role === 'administrador'
    ? {}
    : { user: req.user._id };
  const orders = await Order.find(filter)
    .populate(orderPopulation)
    .sort({ createdAt: -1 });

  return res.json({ orders });
}

async function getOrder(req, res) {
  const filter = { _id: req.params.id };

  if (req.user.role !== 'administrador') {
    filter.user = req.user._id;
  }

  const order = await Order.findOne(filter).populate(orderPopulation);

  if (!order) {
    return res.status(404).json({ message: 'Pedido no encontrado' });
  }

  const payments = await Payment.find({ order: order._id }).sort({ createdAt: -1 });

  return res.json({ order, payments });
}

async function simulatePayment(req, res) {
  const { method, simulate = 'approved' } = req.body;

  if (!['tarjeta', 'transferencia'].includes(method)) {
    return res.status(400).json({
      message: 'El metodo de pago debe ser tarjeta o transferencia',
    });
  }

  if (!['approved', 'rejected'].includes(simulate)) {
    return res.status(400).json({
      message: 'La simulacion debe ser approved o rejected',
    });
  }

  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!order) {
    return res.status(404).json({ message: 'Pedido no encontrado' });
  }

  if (order.paymentStatus === 'pagado') {
    return res.status(409).json({ message: 'El pedido ya fue pagado' });
  }

  if (order.status === 'cancelado') {
    return res.status(409).json({ message: 'El pedido esta cancelado' });
  }

  if (simulate === 'rejected') {
    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      transactionCode: createTransactionCode(),
      method,
      amount: order.total,
      status: 'rechazado',
      message: 'Pago rechazado por el simulador',
    });
    order.paymentStatus = 'rechazado';
    await order.save();

    return res.status(402).json({
      message: 'Pago simulado rechazado',
      payment,
      order,
    });
  }

  const session = await mongoose.startSession();
  let payment;

  try {
    await session.withTransaction(async () => {
      const currentOrder = await Order.findOne({
        _id: order._id,
        user: req.user._id,
        paymentStatus: { $ne: 'pagado' },
        status: { $ne: 'cancelado' },
      }).session(session);

      if (!currentOrder) {
        throw createOrderError('El pedido ya fue procesado', 409);
      }

      for (const item of currentOrder.items) {
        const previousProduct = await Product.findOneAndUpdate(
          {
            _id: item.product,
            active: true,
            stock: { $gte: item.quantity },
          },
          { $inc: { stock: -item.quantity } },
          { session },
        );

        if (!previousProduct) {
          throw createOrderError(`Stock insuficiente para ${item.name}`);
        }

        await StockMovement.create(
          [{
            product: item.product,
            user: req.user._id,
            type: 'salida',
            quantity: item.quantity,
            previousStock: previousProduct.stock,
            newStock: previousProduct.stock - item.quantity,
            reason: `Venta del pedido ${currentOrder.orderNumber}`,
          }],
          { session },
        );
      }

      [payment] = await Payment.create(
        [{
          order: currentOrder._id,
          user: req.user._id,
          transactionCode: createTransactionCode(),
          method,
          amount: currentOrder.total,
          status: 'aprobado',
          message: 'Pago aprobado por el simulador',
        }],
        { session },
      );

      currentOrder.paymentStatus = 'pagado';
      currentOrder.status = 'pagado';
      currentOrder.paidAt = new Date();
      await currentOrder.save({ session });

      await Cart.updateOne(
        { user: req.user._id },
        { $set: { items: [] } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  const paidOrder = await Order.findById(order._id).populate(orderPopulation);

  return res.json({
    message: 'Pago simulado aprobado',
    payment,
    order: paidOrder,
  });
}

async function updateOrderStatus(req, res) {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Pedido no encontrado' });
  }

  validateOrderTransition(order.status, req.body.status);
  order.status = req.body.status;
  await order.save();

  return res.json({ order });
}

module.exports = {
  createOrder,
  getOrder,
  listOrders,
  simulatePayment,
  updateOrderStatus,
};

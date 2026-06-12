const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { buildDateRange } = require('../utils/report');

async function getSummary(req, res) {
  const dateFilter = buildDateRange(req.query);
  const [
    sales,
    ordersByStatus,
    paymentsByStatus,
    ticketsByStatus,
    lowStockCount,
    activeUsers,
    topProducts,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { ...dateFilter, paymentStatus: 'pagado' } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          paidOrders: { $sum: 1 },
          averageTicket: { $avg: '$total' },
        },
      },
    ]),
    Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Payment.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]),
    Ticket.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Product.countDocuments({
      active: true,
      $expr: { $lte: ['$stock', '$minimumStock'] },
    }),
    User.countDocuments({ active: true }),
    Order.aggregate([
      { $match: { ...dateFilter, paymentStatus: 'pagado' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return res.json({
    sales: sales[0] || {
      totalSales: 0,
      paidOrders: 0,
      averageTicket: 0,
    },
    ordersByStatus,
    paymentsByStatus,
    ticketsByStatus,
    inventory: { lowStockCount },
    users: { activeUsers },
    topProducts,
  });
}

module.exports = {
  getSummary,
};

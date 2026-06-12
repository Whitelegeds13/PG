const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'La cantidad debe ser un numero entero',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const addressSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: [true, 'El destinatario es obligatorio'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'El telefono es obligatorio'],
      trim: true,
      maxlength: 30,
    },
    address: {
      type: String,
      required: [true, 'La direccion es obligatoria'],
      trim: true,
      maxlength: 200,
    },
    city: {
      type: String,
      required: [true, 'La ciudad es obligatoria'],
      trim: true,
      maxlength: 80,
    },
    reference: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: 'El pedido debe incluir al menos un producto',
      },
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pendiente_pago', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'cancelado'],
        message: 'El estado del pedido no es valido',
      },
      default: 'pendiente_pago',
    },
    paymentStatus: {
      type: String,
      enum: ['pendiente', 'pagado', 'rechazado'],
      default: 'pendiente',
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Order', orderSchema);

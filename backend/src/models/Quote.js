const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'La descripcion del concepto es obligatoria'],
      trim: true,
      maxlength: 300,
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
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
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

const quoteSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    diagnosis: {
      type: String,
      required: [true, 'El diagnostico es obligatorio'],
      trim: true,
      maxlength: 2000,
    },
    items: {
      type: [quoteItemSchema],
      default: [],
    },
    laborCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pendiente', 'aprobada', 'rechazada'],
      default: 'pendiente',
    },
    validUntil: {
      type: Date,
      required: true,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Quote', quoteSchema);

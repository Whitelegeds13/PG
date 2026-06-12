const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: {
        values: ['entrada', 'salida', 'ajuste'],
        message: 'El tipo de movimiento no es valido',
      },
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'La cantidad no puede ser negativa'],
      validate: {
        validator: Number.isInteger,
        message: 'La cantidad debe ser un numero entero',
      },
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: [true, 'El motivo del movimiento es obligatorio'],
      trim: true,
      maxlength: [300, 'El motivo no puede superar 300 caracteres'],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('StockMovement', stockMovementSchema);

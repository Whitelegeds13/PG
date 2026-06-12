const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorRole: {
      type: String,
      enum: ['cliente', 'administrador', 'soporte'],
      required: true,
    },
    message: {
      type: String,
      required: [true, 'El mensaje es obligatorio'],
      trim: true,
      maxlength: [2000, 'El mensaje no puede superar 2000 caracteres'],
    },
  },
  {
    timestamps: true,
  },
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    subject: {
      type: String,
      required: [true, 'El asunto es obligatorio'],
      trim: true,
      minlength: [5, 'El asunto debe tener al menos 5 caracteres'],
      maxlength: [150, 'El asunto no puede superar 150 caracteres'],
    },
    description: {
      type: String,
      required: [true, 'La descripcion es obligatoria'],
      trim: true,
      minlength: [10, 'La descripcion debe tener al menos 10 caracteres'],
      maxlength: [3000, 'La descripcion no puede superar 3000 caracteres'],
    },
    category: {
      type: String,
      enum: {
        values: ['hardware', 'software', 'mantenimiento', 'otro'],
        message: 'La categoria de soporte no es valida',
      },
      required: true,
    },
    priority: {
      type: String,
      enum: ['baja', 'media', 'alta'],
      default: 'media',
    },
    status: {
      type: String,
      enum: {
        values: [
          'abierto',
          'en_revision',
          'cotizado',
          'aprobado',
          'en_proceso',
          'resuelto',
          'cerrado',
        ],
        message: 'El estado del ticket no es valido',
      },
      default: 'abierto',
      index: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Ticket', ticketSchema);

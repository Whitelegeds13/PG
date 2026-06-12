const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [120, 'El nombre no puede superar 120 caracteres'],
    },
    sku: {
      type: String,
      required: [true, 'El SKU es obligatorio'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [40, 'El SKU no puede superar 40 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La descripcion no puede superar 1000 caracteres'],
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoria es obligatoria'],
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'El stock no puede ser negativo'],
      validate: {
        validator: Number.isInteger,
        message: 'El stock debe ser un numero entero',
      },
      default: 0,
    },
    minimumStock: {
      type: Number,
      required: true,
      min: [0, 'El stock minimo no puede ser negativo'],
      validate: {
        validator: Number.isInteger,
        message: 'El stock minimo debe ser un numero entero',
      },
      default: 5,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productSchema.virtual('lowStock').get(function isLowStock() {
  return this.stock <= this.minimumStock;
});

productSchema.index({ name: 1, category: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);

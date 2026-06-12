require('dotenv').config();

const mongoose = require('mongoose');

const connectDatabase = require('../config/database');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');

const categories = [
  {
    name: 'Computadoras',
    description: 'Equipos gamer y estaciones de trabajo',
  },
  {
    name: 'Componentes',
    description: 'Partes para ensamblaje y actualizacion',
  },
  {
    name: 'Perifericos',
    description: 'Teclados, mouse, audio y accesorios',
  },
];

const products = [
  {
    name: 'Teclado mecanico RGB',
    sku: 'TEC-RGB-001',
    description: 'Teclado mecanico para juegos con iluminacion RGB.',
    categoryName: 'Perifericos',
    price: 249.9,
    stock: 12,
    minimumStock: 3,
  },
  {
    name: 'Mouse gamer 12000 DPI',
    sku: 'MOU-GAM-001',
    description: 'Mouse ergonomico con sensor de alta precision.',
    categoryName: 'Perifericos',
    price: 149.9,
    stock: 15,
    minimumStock: 4,
  },
  {
    name: 'Tarjeta grafica 8 GB',
    sku: 'GPU-8GB-001',
    description: 'Tarjeta grafica para juegos en alta resolucion.',
    categoryName: 'Componentes',
    price: 1899.9,
    stock: 4,
    minimumStock: 2,
  },
];

async function run() {
  validateEnvironment();
  await connectDatabase();

  await Promise.all([
    upsertUser({
      name: process.env.SEED_ADMIN_NAME,
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
      role: 'administrador',
    }),
    upsertUser({
      name: process.env.SEED_SUPPORT_NAME,
      email: process.env.SEED_SUPPORT_EMAIL,
      password: process.env.SEED_SUPPORT_PASSWORD,
      role: 'soporte',
    }),
  ]);

  const categoryMap = new Map();

  for (const categoryData of categories) {
    const category = await Category.findOneAndUpdate(
      { name: categoryData.name },
      { $setOnInsert: categoryData },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    );
    categoryMap.set(category.name, category._id);
  }

  for (const productData of products) {
    const { categoryName, ...data } = productData;
    await Product.findOneAndUpdate(
      { sku: data.sku },
      {
        $setOnInsert: {
          ...data,
          category: categoryMap.get(categoryName),
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    );
  }

  console.log('Datos iniciales creados o verificados');
}

async function upsertUser(data) {
  const existingUser = await User.findOne({ email: data.email.toLowerCase() });

  if (existingUser) {
    existingUser.name = data.name;
    existingUser.role = data.role;
    existingUser.active = true;
    await existingUser.save();
    return existingUser;
  }

  return User.create(data);
}

function validateEnvironment() {
  const required = [
    'MONGODB_URI',
    'SEED_ADMIN_NAME',
    'SEED_ADMIN_EMAIL',
    'SEED_ADMIN_PASSWORD',
    'SEED_SUPPORT_NAME',
    'SEED_SUPPORT_EMAIL',
    'SEED_SUPPORT_PASSWORD',
  ];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }

  if (
    process.env.SEED_ADMIN_PASSWORD.length < 8
    || process.env.SEED_SUPPORT_PASSWORD.length < 8
  ) {
    throw new Error('Las contrasenas iniciales deben tener al menos 8 caracteres');
  }
}

run()
  .catch((error) => {
    console.error('No se pudieron crear los datos iniciales:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

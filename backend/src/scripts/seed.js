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
  {
    name: 'Monitores',
    description: 'Pantallas gamer de alta frecuencia y resolucion',
  },
  {
    name: 'Almacenamiento',
    description: 'Unidades SSD y discos para equipos gamer',
  },
  {
    name: 'Consolas',
    description: 'Consolas, mandos y accesorios para videojuegos',
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
  {
    name: 'PC Gamer Ryzen 5 RTX 4060',
    sku: 'PC-R5-4060',
    description: 'Equipo gamer con Ryzen 5, RTX 4060, 16 GB de RAM y SSD de 1 TB.',
    categoryName: 'Computadoras',
    price: 4599.9,
    stock: 5,
    minimumStock: 2,
  },
  {
    name: 'Laptop Gamer Core i7 RTX 4050',
    sku: 'LAP-I7-4050',
    description: 'Laptop gamer de 15.6 pulgadas, 16 GB de RAM y SSD de 1 TB.',
    categoryName: 'Computadoras',
    price: 5299.9,
    stock: 2,
    minimumStock: 2,
  },
  {
    name: 'Procesador Ryzen 7',
    sku: 'CPU-R7-001',
    description: 'Procesador de ocho nucleos para juegos y productividad.',
    categoryName: 'Componentes',
    price: 1299.9,
    stock: 8,
    minimumStock: 3,
  },
  {
    name: 'Memoria RAM DDR5 16 GB',
    sku: 'RAM-DDR5-16',
    description: 'Modulo de memoria DDR5 de alto rendimiento.',
    categoryName: 'Componentes',
    price: 299.9,
    stock: 3,
    minimumStock: 4,
  },
  {
    name: 'Fuente 750W 80 Plus Gold',
    sku: 'PSU-750-GOLD',
    description: 'Fuente modular certificada para equipos de alto rendimiento.',
    categoryName: 'Componentes',
    price: 449.9,
    stock: 6,
    minimumStock: 2,
  },
  {
    name: 'Audifonos gamer 7.1',
    sku: 'AUD-71-001',
    description: 'Audifonos con sonido envolvente, microfono y luces RGB.',
    categoryName: 'Perifericos',
    price: 229.9,
    stock: 10,
    minimumStock: 3,
  },
  {
    name: 'Control inalambrico',
    sku: 'CTL-WLS-001',
    description: 'Mando inalambrico compatible con PC y consola.',
    categoryName: 'Consolas',
    price: 279.9,
    stock: 1,
    minimumStock: 3,
  },
  {
    name: 'Consola de videojuegos 1 TB',
    sku: 'CON-1TB-001',
    description: 'Consola de nueva generacion con almacenamiento de 1 TB.',
    categoryName: 'Consolas',
    price: 2499.9,
    stock: 4,
    minimumStock: 2,
  },
  {
    name: 'Monitor gamer 24 pulgadas 165 Hz',
    sku: 'MON-24-165',
    description: 'Monitor Full HD con panel IPS y frecuencia de 165 Hz.',
    categoryName: 'Monitores',
    price: 899.9,
    stock: 7,
    minimumStock: 2,
  },
  {
    name: 'Monitor gamer 27 pulgadas QHD',
    sku: 'MON-27-QHD',
    description: 'Monitor QHD de 27 pulgadas con frecuencia de 180 Hz.',
    categoryName: 'Monitores',
    price: 1499.9,
    stock: 2,
    minimumStock: 2,
  },
  {
    name: 'SSD NVMe 1 TB',
    sku: 'SSD-NVME-1TB',
    description: 'Unidad NVMe de alta velocidad para sistema y videojuegos.',
    categoryName: 'Almacenamiento',
    price: 349.9,
    stock: 14,
    minimumStock: 4,
  },
  {
    name: 'SSD SATA 500 GB',
    sku: 'SSD-SATA-500',
    description: 'Unidad de estado solido para actualizar computadoras.',
    categoryName: 'Almacenamiento',
    price: 189.9,
    stock: 0,
    minimumStock: 3,
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

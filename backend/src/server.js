require('dotenv').config();

const app = require('./app');
const connectDatabase = require('./config/database');

const port = process.env.PORT || 5000;
let server;

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(port, '0.0.0.0', () => {
      console.log(`API disponible en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} recibido. Cerrando servidor...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  const mongoose = require('mongoose');
  await mongoose.disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

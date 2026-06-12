const mongoose = require('mongoose');
const dns = require('node:dns');

async function connectDatabase() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    console.warn('MONGODB_URI no esta configurada. La API iniciara sin base de datos.');
    return;
  }

  if (process.env.MONGODB_DNS_SERVERS) {
    const servers = process.env.MONGODB_DNS_SERVERS
      .split(',')
      .map((server) => server.trim())
      .filter(Boolean);

    if (servers.length) {
      dns.setServers(servers);
    }
  }

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB conectado');
}

module.exports = connectDatabase;

function buildDateRange(query) {
  const createdAt = {};

  if (query.from) {
    const from = parseDate(query.from, 'La fecha inicial no es valida');
    createdAt.$gte = from;
  }

  if (query.to) {
    const to = parseDate(query.to, 'La fecha final no es valida');
    to.setUTCHours(23, 59, 59, 999);
    createdAt.$lte = to;
  }

  if (createdAt.$gte && createdAt.$lte && createdAt.$gte > createdAt.$lte) {
    throw createReportError('La fecha inicial no puede superar la fecha final');
  }

  return Object.keys(createdAt).length ? { createdAt } : {};
}

function parseDate(value, message) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createReportError(message);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw createReportError(message);
  }

  return date;
}

function createReportError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  buildDateRange,
};

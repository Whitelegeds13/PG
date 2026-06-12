const mongoose = require('mongoose');

const sortOptions = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1, name: 1 },
  price_desc: { price: -1, name: 1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
};

function buildProductQuery(query) {
  const filter = { active: true };

  if (query.search?.trim()) {
    const search = escapeRegExp(query.search.trim());
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  if (query.category) {
    if (!mongoose.isValidObjectId(query.category)) {
      throw createQueryError('La categoria no es valida');
    }

    filter.category = query.category;
  }

  const minimumPrice = parseOptionalNumber(query.minPrice, 'El precio minimo no es valido');
  const maximumPrice = parseOptionalNumber(query.maxPrice, 'El precio maximo no es valido');

  if (minimumPrice !== undefined || maximumPrice !== undefined) {
    filter.price = {};

    if (minimumPrice !== undefined) {
      filter.price.$gte = minimumPrice;
    }

    if (maximumPrice !== undefined) {
      filter.price.$lte = maximumPrice;
    }
  }

  if (
    minimumPrice !== undefined
    && maximumPrice !== undefined
    && minimumPrice > maximumPrice
  ) {
    throw createQueryError('El precio minimo no puede superar al precio maximo');
  }

  if (query.inStock === 'true') {
    filter.stock = { $gt: 0 };
  } else if (query.inStock === 'false') {
    filter.stock = 0;
  } else if (query.inStock !== undefined) {
    throw createQueryError('El filtro inStock debe ser true o false');
  }

  const page = parsePositiveInteger(query.page, 1, 'La pagina no es valida');
  const limit = Math.min(
    parsePositiveInteger(query.limit, 12, 'El limite no es valido'),
    50,
  );

  if (query.sort && !sortOptions[query.sort]) {
    throw createQueryError('El orden solicitado no es valido');
  }

  return {
    filter,
    limit,
    page,
    skip: (page - 1) * limit,
    sort: sortOptions[query.sort] || sortOptions.newest,
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseOptionalNumber(value, message) {
  if (value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw createQueryError(message);
  }

  return parsed;
}

function parsePositiveInteger(value, fallback, message) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw createQueryError(message);
  }

  return parsed;
}

function createQueryError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  buildProductQuery,
};

function errorHandler(error, _req, res, _next) {
  if (error.code === 11000) {
    const duplicatedField = Object.keys(error.keyPattern || {})[0];
    const messages = {
      email: 'El correo ya esta registrado',
      name: 'La categoria ya existe',
      sku: 'El SKU ya esta registrado',
    };

    return res.status(409).json({
      message: messages[duplicatedField] || 'El registro ya existe',
    });
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({
      message: 'Datos no validos',
      errors,
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Identificador no valido' });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(error);

  return res.status(500).json({
    message: 'Error interno del servidor',
  });
}

module.exports = errorHandler;

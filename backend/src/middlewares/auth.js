const jwt = require('jsonwebtoken');

const User = require('../models/User');

async function protect(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticacion requerido' });
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error('JWT_SECRET no esta configurado'));
  }

  try {
    const token = authorization.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Usuario no autorizado' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token invalido o expirado' });
    }

    return next(error);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permisos para esta accion' });
    }

    return next();
  };
}

module.exports = {
  authorize,
  protect,
};

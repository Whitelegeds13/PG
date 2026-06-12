const User = require('../models/User');
const generateToken = require('../utils/generateToken');

function authResponse(user) {
  return {
    token: generateToken(user),
    user: user.toJSON(),
  };
}

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: 'Nombre, correo y contrasena son obligatorios',
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

  if (existingUser) {
    return res.status(409).json({ message: 'El correo ya esta registrado' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'cliente',
  });

  return res.status(201).json(authResponse(user));
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Correo y contrasena son obligatorios',
    });
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select('+password');

  if (!user || !user.active || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }

  return res.json(authResponse(user));
}

function getMe(req, res) {
  return res.json({ user: req.user });
}

module.exports = {
  getMe,
  login,
  register,
};

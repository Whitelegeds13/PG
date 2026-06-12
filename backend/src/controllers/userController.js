const User = require('../models/User');
const { validateUserUpdate } = require('../utils/userAdmin');

async function listUsers(_req, res) {
  const users = await User.find().sort({ createdAt: -1 });

  return res.json({ users });
}

async function updateUser(req, res) {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const updates = {
    role: req.body.role,
    active: req.body.active,
  };
  validateUserUpdate(req.user, user, updates);

  if (updates.role !== undefined) {
    user.role = updates.role;
  }

  if (updates.active !== undefined) {
    user.active = updates.active;
  }

  await user.save();

  return res.json({ user });
}

module.exports = {
  listUsers,
  updateUser,
};

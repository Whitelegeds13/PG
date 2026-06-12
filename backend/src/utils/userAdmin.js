const allowedRoles = ['cliente', 'administrador', 'soporte'];

function validateUserUpdate(currentUser, targetUser, updates) {
  if (updates.role !== undefined && !allowedRoles.includes(updates.role)) {
    throw createUserAdminError('El rol no es valido');
  }

  if (updates.active !== undefined && typeof updates.active !== 'boolean') {
    throw createUserAdminError('El estado activo debe ser verdadero o falso');
  }

  const isSelf = currentUser._id.toString() === targetUser._id.toString();

  if (isSelf && updates.active === false) {
    throw createUserAdminError('No puedes desactivar tu propia cuenta');
  }

  if (isSelf && updates.role && updates.role !== 'administrador') {
    throw createUserAdminError('No puedes quitarte el rol de administrador');
  }
}

function createUserAdminError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  validateUserUpdate,
};

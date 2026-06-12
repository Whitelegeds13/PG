const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { validateUserUpdate } = require('../src/utils/userAdmin');

const adminId = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';

describe('Administracion de usuarios', () => {
  const admin = { _id: adminId, role: 'administrador' };

  it('permite cambiar el rol y estado de otro usuario', () => {
    assert.doesNotThrow(() => validateUserUpdate(
      admin,
      { _id: otherId, role: 'cliente' },
      { role: 'soporte', active: true },
    ));
  });

  it('impide que un administrador se desactive o quite su rol', () => {
    assert.throws(
      () => validateUserUpdate(admin, admin, { active: false }),
      /propia cuenta/,
    );
    assert.throws(
      () => validateUserUpdate(admin, admin, { role: 'cliente' }),
      /quitarte el rol/,
    );
  });

  it('rechaza roles y estados invalidos', () => {
    assert.throws(
      () => validateUserUpdate(admin, { _id: otherId }, { role: 'superusuario' }),
      /rol no es valido/,
    );
    assert.throws(
      () => validateUserUpdate(admin, { _id: otherId }, { active: 'si' }),
      /verdadero o falso/,
    );
  });
});

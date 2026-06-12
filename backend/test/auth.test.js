const assert = require('node:assert/strict');
const { after, before, describe, it } = require('node:test');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'secreto-de-prueba-con-longitud-suficiente';
process.env.JWT_EXPIRES_IN = '1h';

const User = require('../src/models/User');
const { authorize, protect } = require('../src/middlewares/auth');
const generateToken = require('../src/utils/generateToken');

describe('Usuario', () => {
  it('asigna el rol cliente y normaliza el correo', async () => {
    const user = new User({
      name: 'Cliente Prueba',
      email: 'CLIENTE@EXAMPLE.COM',
      password: 'password123',
    });

    assert.equal(user.role, 'cliente');
    assert.equal(user.email, 'cliente@example.com');
    await user.validate();
  });

  it('rechaza roles desconocidos', async () => {
    const user = new User({
      name: 'Cliente Prueba',
      email: 'cliente@example.com',
      password: 'password123',
      role: 'superusuario',
    });

    await assert.rejects(user.validate(), /rol no es valido/);
  });

  it('compara una contrasena cifrada', async () => {
    const password = 'password123';
    const user = new User({
      name: 'Cliente Prueba',
      email: 'cliente@example.com',
      password: await bcrypt.hash(password, 4),
    });

    assert.equal(await user.comparePassword(password), true);
    assert.equal(await user.comparePassword('incorrecta'), false);
  });
});

describe('JWT y autorizacion', () => {
  const originalFindById = User.findById;

  after(() => {
    User.findById = originalFindById;
  });

  it('genera un token con identificador y rol', () => {
    const token = generateToken({
      _id: '507f1f77bcf86cd799439011',
      role: 'soporte',
    });
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    assert.equal(payload.sub, '507f1f77bcf86cd799439011');
    assert.equal(payload.role, 'soporte');
  });

  it('rechaza una peticion sin token', async () => {
    const response = createResponse();

    await protect({ headers: {} }, response, () => {
      throw new Error('next no debe ejecutarse');
    });

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, 'Token de autenticacion requerido');
  });

  it('acepta un token valido de un usuario activo', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      active: true,
      role: 'cliente',
    };
    User.findById = async () => user;
    const token = generateToken(user);
    const request = { headers: { authorization: `Bearer ${token}` } };
    const response = createResponse();
    let nextCalled = false;

    await protect(request, response, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(request.user, user);
  });

  it('permite solo los roles configurados', () => {
    const response = createResponse();
    let nextCalled = false;

    authorize('administrador')(
      { user: { role: 'cliente' } },
      response,
      () => {
        nextCalled = true;
      },
    );

    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 403);
  });
});

function createResponse() {
  return {
    body: undefined,
    statusCode: 200,
    json(body) {
      this.body = body;
      return this;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
  };
}

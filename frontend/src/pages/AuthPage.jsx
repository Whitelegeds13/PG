import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(form);
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate('/productos');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="form-card auth-card" onSubmit={submit}>
        <p className="eyebrow">{isRegister ? 'Nueva cuenta' : 'Bienvenido de vuelta'}</p>
        <h1>{isRegister ? 'Crear cuenta' : 'Iniciar sesion'}</h1>
        {error && <p className="alert error">{error}</p>}
        {isRegister && (
          <label>
            Nombre
            <input name="name" onChange={updateField} required value={form.name} />
          </label>
        )}
        <label>
          Correo
          <input name="email" onChange={updateField} required type="email" value={form.email} />
        </label>
        <label>
          Contrasena
          <input
            minLength="8"
            name="password"
            onChange={updateField}
            required
            type="password"
            value={form.password}
          />
        </label>
        <button className="button primary full" disabled={submitting} type="submit">
          {submitting ? 'Procesando...' : isRegister ? 'Registrarme' : 'Ingresar'}
        </button>
        <p className="form-switch">
          {isRegister ? 'Ya tienes una cuenta?' : 'Aun no tienes una cuenta?'}{' '}
          <Link to={isRegister ? '/login' : '/registro'}>
            {isRegister ? 'Ingresa aqui' : 'Registrate'}
          </Link>
        </p>
      </form>
    </main>
  );
}

export default AuthPage;

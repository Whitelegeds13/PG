import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function Layout() {
  const { logout, user } = useAuth();

  return (
    <div className="site-shell">
      <header className="site-header">
        <NavLink className="brand" to="/">
          <span className="brand-mark">PG</span>
          <span>Palacio Gamer</span>
        </NavLink>

        <nav className="main-nav">
          <NavLink to="/productos">Productos</NavLink>
          {user?.role === 'cliente' && <NavLink to="/carrito">Carrito</NavLink>}
          {['cliente', 'administrador'].includes(user?.role) && (
            <NavLink to="/pedidos">Pedidos</NavLink>
          )}
          {user && <NavLink to="/soporte">Soporte</NavLink>}
          {user?.role === 'administrador' && (
            <NavLink to="/administracion">Administracion</NavLink>
          )}
        </nav>

        <div className="session-actions">
          {user ? (
            <>
              <span className="user-chip">
                {user.name}
                <small>{user.role}</small>
              </span>
              <button className="button ghost small" onClick={logout} type="button">
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink className="button ghost small" to="/login">Ingresar</NavLink>
              <NavLink className="button primary small" to="/registro">Crear cuenta</NavLink>
            </>
          )}
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        Palacio Gamer · Ventas, inventario y soporte tecnico
      </footer>
    </div>
  );
}

export default Layout;

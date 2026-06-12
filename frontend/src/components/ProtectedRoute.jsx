import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ roles }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="page-state">Cargando sesion...</div>;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

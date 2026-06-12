import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import CartPage from './pages/CartPage';
import HomePage from './pages/HomePage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import TicketsPage from './pages/TicketsPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route element={<ProductsPage />} path="productos" />
            <Route element={<AuthPage mode="login" />} path="login" />
            <Route element={<AuthPage mode="register" />} path="registro" />

            <Route element={<ProtectedRoute roles={['cliente']} />}>
              <Route element={<CartPage />} path="carrito" />
            </Route>

            <Route element={<ProtectedRoute roles={['cliente', 'administrador']} />}>
              <Route element={<OrdersPage />} path="pedidos" />
            </Route>

            <Route element={<ProtectedRoute roles={['cliente', 'soporte', 'administrador']} />}>
              <Route element={<TicketsPage />} path="soporte" />
            </Route>

            <Route element={<ProtectedRoute roles={['administrador']} />}>
              <Route element={<AdminPage />} path="administracion" />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

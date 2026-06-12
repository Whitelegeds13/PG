import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const emptyAddress = {
  recipient: '',
  phone: '',
  address: '',
  city: '',
  reference: '',
};

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [address, setAddress] = useState(emptyAddress);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function createOrder(event) {
    event.preventDefault();
    try {
      await api.post('/orders', { shippingAddress: address });
      setAddress(emptyAddress);
      setMessage('Pedido creado. Ya puedes simular el pago.');
      loadOrders();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function pay(orderId, simulate) {
    try {
      await api.post(`/orders/${orderId}/pay`, { method: 'tarjeta', simulate });
      setMessage(simulate === 'approved' ? 'Pago aprobado' : 'Pago rechazado');
      loadOrders();
    } catch (error) {
      setMessage(getErrorMessage(error));
      loadOrders();
    }
  }

  async function advance(order) {
    const next = {
      pagado: 'en_preparacion',
      en_preparacion: 'enviado',
      enviado: 'entregado',
    }[order.status];

    if (!next) return;

    await api.patch(`/orders/${order._id}/status`, { status: next });
    loadOrders();
  }

  return (
    <main className="page content-section">
      <div className="page-heading">
        <div><p className="eyebrow">Compras</p><h1>{user.role === 'administrador' ? 'Gestion de pedidos' : 'Mis pedidos'}</h1></div>
      </div>
      {message && <button className="alert info dismissible" onClick={() => setMessage('')} type="button">{message}</button>}

      {user.role === 'cliente' && (
        <details className="admin-panel">
          <summary>Crear pedido con el carrito actual</summary>
          <form className="form-grid" onSubmit={createOrder}>
            {Object.keys(emptyAddress).map((field) => (
              <label className={field === 'address' ? 'wide' : ''} key={field}>
                {field}
                <input
                  onChange={(event) => setAddress({ ...address, [field]: event.target.value })}
                  required={field !== 'reference'}
                  value={address[field]}
                />
              </label>
            ))}
            <button className="button primary" type="submit">Crear pedido</button>
          </form>
        </details>
      )}

      <section className="stack">
        {orders.map((order) => (
          <article className="record-card" key={order._id}>
            <div className="record-header">
              <div><small>{order.orderNumber}</small><h2>S/ {order.total.toFixed(2)}</h2></div>
              <StatusBadge value={order.status} />
            </div>
            <div className="record-items">
              {order.items.map((item) => <span key={`${order._id}-${item.sku}`}>{item.quantity} × {item.name}</span>)}
            </div>
            <div className="record-actions">
              {user.role === 'cliente' && order.paymentStatus !== 'pagado' && (
                <>
                  <button className="button primary small" onClick={() => pay(order._id, 'approved')} type="button">Aprobar pago</button>
                  <button className="button ghost small" onClick={() => pay(order._id, 'rejected')} type="button">Simular rechazo</button>
                </>
              )}
              {user.role === 'administrador' && ['pagado', 'en_preparacion', 'enviado'].includes(order.status) && (
                <button className="button primary small" onClick={() => advance(order)} type="button">Avanzar estado</button>
              )}
            </div>
          </article>
        ))}
        {!orders.length && <div className="empty-state"><h2>No hay pedidos registrados</h2></div>}
      </section>
    </main>
  );
}

export default OrdersPage;

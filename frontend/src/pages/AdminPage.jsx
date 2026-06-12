import { useEffect, useState } from 'react';

import StatusBadge from '../components/StatusBadge';
import api, { getErrorMessage } from '../services/api';

function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [categoryDraft, setCategoryDraft] = useState({ name: '', description: '' });
  const [stockDrafts, setStockDrafts] = useState({});

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary'),
      api.get('/products/low-stock'),
      api.get('/users'),
      api.get('/categories'),
    ])
      .then(([reportResponse, stockResponse, userResponse, categoryResponse]) => {
        setSummary(reportResponse.data);
        setLowStock(stockResponse.data.products);
        setUsers(userResponse.data.users);
        setCategories(categoryResponse.data.categories);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

  async function loadDashboard(event) {
    event?.preventDefault();
    try {
      const params = Object.fromEntries(Object.entries(range).filter(([, value]) => value));
      const [reportResponse, stockResponse] = await Promise.all([
        api.get('/reports/summary', { params }),
        api.get('/products/low-stock'),
      ]);
      setSummary(reportResponse.data);
      setLowStock(stockResponse.data.products);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function updateUser(userId, changes) {
    try {
      const { data } = await api.patch(`/users/${userId}`, changes);
      setUsers(users.map((user) => user._id === userId ? data.user : user));
      setMessage('Usuario actualizado');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function createCategory(event) {
    event.preventDefault();
    try {
      const { data } = await api.post('/categories', categoryDraft);
      setCategories([...categories, data.category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryDraft({ name: '', description: '' });
      setMessage('Categoria creada');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function replenishStock(product) {
    const quantity = Number(stockDrafts[product._id]);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('Ingresa una cantidad entera mayor que cero');
      return;
    }

    try {
      await api.patch(`/products/${product._id}/stock`, {
        type: 'entrada',
        quantity,
        reason: 'Reposicion desde panel administrativo',
      });
      setStockDrafts({ ...stockDrafts, [product._id]: '' });
      setMessage('Inventario actualizado');
      loadDashboard();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  if (!summary) {
    return <main className="page-state">{error || 'Cargando reportes...'}</main>;
  }

  return (
    <main className="page content-section">
      <div className="page-heading">
        <div><p className="eyebrow">Panel administrativo</p><h1>Resumen del negocio</h1></div>
        <form className="date-filter" onSubmit={loadDashboard}>
          <input onChange={(event) => setRange({ ...range, from: event.target.value })} type="date" value={range.from} />
          <input onChange={(event) => setRange({ ...range, to: event.target.value })} type="date" value={range.to} />
          <button className="button secondary small" type="submit">Aplicar</button>
        </form>
      </div>
      {error && <button className="alert error dismissible" onClick={() => setError('')} type="button">{error}</button>}
      {message && <button className="alert info dismissible" onClick={() => setMessage('')} type="button">{message}</button>}

      <section className="metric-grid">
        <article><span>Ventas pagadas</span><strong>S/ {Number(summary.sales.totalSales || 0).toFixed(2)}</strong></article>
        <article><span>Pedidos pagados</span><strong>{summary.sales.paidOrders || 0}</strong></article>
        <article><span>Ticket promedio</span><strong>S/ {Number(summary.sales.averageTicket || 0).toFixed(2)}</strong></article>
        <article><span>Usuarios activos</span><strong>{summary.users.activeUsers}</strong></article>
        <article><span>Productos con stock bajo</span><strong>{summary.inventory.lowStockCount}</strong></article>
      </section>

      <div className="dashboard-grid">
        <section className="data-card">
          <h2>Productos mas vendidos</h2>
          {summary.topProducts.map((product) => (
            <p key={product._id}><span>{product.name}</span><strong>{product.quantity} uds.</strong></p>
          ))}
          {!summary.topProducts.length && <p className="muted">Sin ventas en el periodo.</p>}
        </section>
        <section className="data-card">
          <h2>Pedidos por estado</h2>
          {summary.ordersByStatus.map((item) => <p key={item._id}><StatusBadge value={item._id} /><strong>{item.count}</strong></p>)}
        </section>
        <section className="data-card">
          <h2>Tickets por estado</h2>
          {summary.ticketsByStatus.map((item) => <p key={item._id}><StatusBadge value={item._id} /><strong>{item.count}</strong></p>)}
        </section>
        <section className="data-card">
          <h2>Alertas de inventario</h2>
          {lowStock.map((product) => (
            <div className="stock-row" key={product._id}>
              <span>{product.name}<small>{product.stock} / {product.minimumStock}</small></span>
              <input
                min="1"
                onChange={(event) => setStockDrafts({ ...stockDrafts, [product._id]: event.target.value })}
                placeholder="+ stock"
                type="number"
                value={stockDrafts[product._id] || ''}
              />
              <button className="button secondary small" onClick={() => replenishStock(product)} type="button">Reponer</button>
            </div>
          ))}
          {!lowStock.length && <p className="muted">Inventario saludable.</p>}
        </section>
      </div>

      <section className="management-grid">
        <article className="data-card">
          <h2>Gestion de usuarios</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td><strong>{user.name}</strong><small>{user.email}</small></td>
                    <td>
                      <select onChange={(event) => updateUser(user._id, { role: event.target.value })} value={user.role}>
                        <option value="cliente">Cliente</option>
                        <option value="soporte">Soporte</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className={`button small ${user.active ? 'secondary' : 'ghost'}`}
                        onClick={() => updateUser(user._id, { active: !user.active })}
                        type="button"
                      >
                        {user.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="data-card">
          <h2>Categorias</h2>
          <form className="stack" onSubmit={createCategory}>
            <label>
              Nombre
              <input onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })} required value={categoryDraft.name} />
            </label>
            <label>
              Descripcion
              <textarea onChange={(event) => setCategoryDraft({ ...categoryDraft, description: event.target.value })} value={categoryDraft.description} />
            </label>
            <button className="button primary" type="submit">Crear categoria</button>
          </form>
          <div className="tag-list">
            {categories.map((category) => <span key={category._id}>{category.name}</span>)}
          </div>
        </article>
      </section>
    </main>
  );
}

export default AdminPage;

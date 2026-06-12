import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api, { getErrorMessage } from '../services/api';

function CartPage() {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInitialCart() {
      try {
        const { data } = await api.get('/cart');
        setCart(data.cart);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      }
    }

    loadInitialCart();
  }, []);

  async function update(productId, quantity) {
    try {
      const { data } = await api.patch(`/cart/items/${productId}`, { quantity });
      setCart(data.cart);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function remove(productId) {
    const { data } = await api.delete(`/cart/items/${productId}`);
    setCart(data.cart);
  }

  if (!cart) {
    return <main className="page-state">{error || 'Cargando carrito...'}</main>;
  }

  return (
    <main className="page content-section narrow">
      <div className="page-heading">
        <div><p className="eyebrow">Tu seleccion</p><h1>Carrito de compras</h1></div>
      </div>
      {error && <p className="alert error">{error}</p>}
      {!cart.items.length ? (
        <div className="empty-state">
          <h2>Tu carrito esta vacio</h2>
          <Link className="button primary" to="/productos">Explorar productos</Link>
        </div>
      ) : (
        <div className="split-layout">
          <section className="stack">
            {cart.items.map((item) => (
              <article className="line-item" key={item.product._id}>
                <div>
                  <h2>{item.product.name}</h2>
                  <p>{item.product.sku} · S/ {item.product.price.toFixed(2)}</p>
                  {!item.available && <span className="warning-text">Revisa la disponibilidad</span>}
                </div>
                <div className="quantity-control">
                  <button disabled={item.quantity === 1} onClick={() => update(item.product._id, item.quantity - 1)} type="button">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => update(item.product._id, item.quantity + 1)} type="button">+</button>
                </div>
                <strong>S/ {item.subtotal.toFixed(2)}</strong>
                <button className="text-button danger" onClick={() => remove(item.product._id)} type="button">Quitar</button>
              </article>
            ))}
          </section>
          <aside className="summary-card">
            <h2>Resumen</h2>
            <p><span>Articulos</span><strong>{cart.totalItems}</strong></p>
            <p className="summary-total"><span>Total</span><strong>S/ {cart.total.toFixed(2)}</strong></p>
            <Link className="button primary full" to="/pedidos">Continuar pedido</Link>
          </aside>
        </div>
      )}
    </main>
  );
}

export default CartPage;

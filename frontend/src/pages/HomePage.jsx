import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function HomePage() {
  const { user } = useAuth();

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Tecnologia y servicio en un solo lugar</p>
          <h1>Tu siguiente nivel empieza aqui.</h1>
          <p className="hero-text">
            Explora productos gamer, controla tus pedidos y recibe soporte
            tecnico especializado desde una sola plataforma.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/productos">Ver productos</Link>
            <Link className="button secondary" to={user ? '/soporte' : '/registro'}>
              {user ? 'Solicitar soporte' : 'Crear una cuenta'}
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="glow-card">
            <span className="glow-icon">PG</span>
            <strong>Palacio Gamer</strong>
            <p>Productos, pedidos y asistencia sin perder el control.</p>
          </div>
        </div>
      </section>

      <section className="feature-grid content-section">
        <article className="feature-card">
          <span>01</span>
          <h2>Catalogo inteligente</h2>
          <p>Busca por nombre, categoria, precio y disponibilidad.</p>
        </article>
        <article className="feature-card">
          <span>02</span>
          <h2>Compra organizada</h2>
          <p>Carrito persistente, pedidos trazables y pagos simulados.</p>
        </article>
        <article className="feature-card">
          <span>03</span>
          <h2>Soporte cercano</h2>
          <p>Tickets, mensajes y cotizaciones tecnicas en linea.</p>
        </article>
      </section>
    </main>
  );
}

export default HomePage;

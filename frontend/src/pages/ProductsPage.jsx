import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../services/api';

const emptyProduct = {
  name: '',
  sku: '',
  description: '',
  category: '',
  price: '',
  stock: '',
  minimumStock: '',
  imageUrl: '',
};

function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '', sort: 'newest', inStock: '' });
  const [draft, setDraft] = useState(emptyProduct);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ''),
      );
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(), 200);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  async function addToCart(productId) {
    try {
      await api.post('/cart/items', { productId, quantity: 1 });
      setMessage('Producto agregado al carrito');
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function createProduct(event) {
    event.preventDefault();
    try {
      await api.post('/products', {
        ...draft,
        price: Number(draft.price),
        stock: Number(draft.stock),
        minimumStock: Number(draft.minimumStock),
      });
      setDraft(emptyProduct);
      setMessage('Producto creado correctamente');
      loadProducts();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="page content-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Catalogo</p>
          <h1>Encuentra tu proximo equipo</h1>
        </div>
        <span className="result-count">{products.length} resultados</span>
      </div>

      {message && <button className="alert info dismissible" onClick={() => setMessage('')} type="button">{message}</button>}

      <section className="filter-bar">
        <input
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          placeholder="Buscar producto o SKU..."
          value={filters.search}
        />
        <select onChange={(event) => setFilters({ ...filters, category: event.target.value })} value={filters.category}>
          <option value="">Todas las categorias</option>
          {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
        </select>
        <select onChange={(event) => setFilters({ ...filters, inStock: event.target.value })} value={filters.inStock}>
          <option value="">Toda disponibilidad</option>
          <option value="true">En stock</option>
          <option value="false">Agotados</option>
        </select>
        <select onChange={(event) => setFilters({ ...filters, sort: event.target.value })} value={filters.sort}>
          <option value="newest">Mas recientes</option>
          <option value="price_asc">Menor precio</option>
          <option value="price_desc">Mayor precio</option>
          <option value="name_asc">Nombre A-Z</option>
        </select>
      </section>

      {user?.role === 'administrador' && (
        <details className="admin-panel">
          <summary>Agregar producto al inventario</summary>
          <form className="form-grid" onSubmit={createProduct}>
            {['name', 'sku', 'price', 'stock', 'minimumStock', 'imageUrl'].map((field) => (
              <label key={field}>
                {field}
                <input
                  name={field}
                  onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                  required={!['imageUrl'].includes(field)}
                  type={['price', 'stock', 'minimumStock'].includes(field) ? 'number' : 'text'}
                  value={draft[field]}
                />
              </label>
            ))}
            <label>
              Categoria
              <select onChange={(event) => setDraft({ ...draft, category: event.target.value })} required value={draft.category}>
                <option value="">Seleccionar</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </label>
            <label className="wide">
              Descripcion
              <textarea onChange={(event) => setDraft({ ...draft, description: event.target.value })} value={draft.description} />
            </label>
            <button className="button primary" type="submit">Crear producto</button>
          </form>
        </details>
      )}

      {loading ? <div className="page-state">Cargando productos...</div> : (
        <section className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product._id}>
              <div className="product-image">
                {product.imageUrl ? <img alt={product.name} src={product.imageUrl} /> : <span>{product.sku}</span>}
                {product.lowStock && <small>Stock bajo</small>}
              </div>
              <div className="product-body">
                <p className="product-category">{product.category?.name || 'Sin categoria'}</p>
                <h2>{product.name}</h2>
                <p className="product-description">{product.description || 'Producto gamer disponible en Palacio Gamer.'}</p>
                <div className="product-meta">
                  <strong>S/ {product.price.toFixed(2)}</strong>
                  <span>{product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}</span>
                </div>
                {user?.role === 'cliente' && (
                  <button
                    className="button primary full"
                    disabled={product.stock === 0}
                    onClick={() => addToCart(product._id)}
                    type="button"
                  >
                    Agregar al carrito
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default ProductsPage;

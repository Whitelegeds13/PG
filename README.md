# Palacio Gamer

Sistema web propuesto para mejorar la gestion de ventas, inventario y soporte
tecnico de Palacio Gamer.

## Estado del proyecto

Version funcional de los modulos definidos para la tesis:

- Backend base con Node.js y Express.
- Frontend base con React y Vite.
- Conexion configurable a MongoDB Atlas mediante Mongoose.
- Variables de entorno de ejemplo.
- Scripts de desarrollo y compilacion.
- Registro e inicio de sesion con JWT.
- Roles `cliente`, `administrador` y `soporte`.
- Rutas protegidas y control de acceso por rol.
- Categorias y productos.
- Entradas, salidas y ajustes de inventario con historial.
- Consulta administrativa de productos con stock bajo.
- Busqueda, filtros, ordenamiento y paginacion del catalogo.
- Carrito persistente para clientes con validacion de stock.
- Pedidos con copia historica de productos y precios.
- Pagos simulados aprobados o rechazados.
- Descuento transaccional de inventario al aprobar el pago.
- Tickets de soporte, mensajes, asignacion y estados.
- Cotizaciones tecnicas con respuesta del cliente.
- Reportes administrativos de ventas, pedidos, pagos, soporte e inventario.
- Interfaz React responsive con navegacion y permisos por rol.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Una cuenta y un cluster en MongoDB Atlas para probar la conexion real.

## Estructura

```text
palacio-gamer/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middlewares/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- app.js
|   |   `-- server.js
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- App.jsx
|   |   |-- index.css
|   |   `-- main.jsx
|   |-- .env.example
|   |-- index.html
|   |-- package.json
|   `-- vite.config.js
|-- .gitignore
`-- README.md
```

## Instalacion

Desde la raiz del proyecto:

```powershell
cd backend
npm.cmd install
Copy-Item .env.example .env

cd ..\frontend
npm.cmd install
Copy-Item .env.example .env
```

Edita `backend/.env` y reemplaza `MONGODB_URI` con la cadena de conexion de
MongoDB Atlas. No publiques el archivo `.env`.

Las transacciones de pedidos y pagos requieren un cluster de MongoDB Atlas o
una instalacion de MongoDB configurada como replica set.

## Ejecucion en desarrollo

Abre dos terminales.

Backend:

```powershell
cd backend
npm.cmd run dev
```

Frontend:

```powershell
cd frontend
npm.cmd run dev
```

Luego abre `http://localhost:5173`. El backend responde en
`http://localhost:5000/api/health`.

La ruta de salud funciona aunque MongoDB no este conectado. El estado de la
base de datos se muestra en la respuesta para facilitar la configuracion
inicial.

## Scripts disponibles

Backend:

- `npm.cmd run dev`: inicia el servidor con recarga automatica.
- `npm.cmd run seed`: crea cuentas iniciales y datos de demostracion.
- `npm.cmd start`: inicia el servidor en modo normal.
- `npm.cmd test`: ejecuta las pruebas del backend.

Frontend:

- `npm.cmd run dev`: inicia Vite.
- `npm.cmd run build`: genera la compilacion de produccion.
- `npm.cmd run preview`: sirve localmente la compilacion.
- `npm.cmd run lint`: revisa el codigo con ESLint.

## API de autenticacion

Registro de clientes:

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Cliente Prueba",
  "email": "cliente@example.com",
  "password": "password123"
}
```

Inicio de sesion:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "cliente@example.com",
  "password": "password123"
}
```

Perfil del usuario autenticado:

```http
GET /api/auth/me
Authorization: Bearer TU_TOKEN
```

Listado exclusivo para administradores:

```http
GET /api/users
Authorization: Bearer TOKEN_DE_ADMINISTRADOR
```

El registro publico siempre crea usuarios con rol `cliente`. Los roles
`administrador` y `soporte` deben asignarse de manera controlada directamente
en la base de datos hasta que exista un modulo administrativo.

## API de catalogo e inventario

Lectura publica:

```http
GET /api/categories
GET /api/products
GET /api/products/:id
```

Operaciones de administrador:

```http
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id

POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
```

Ejemplo de producto:

```json
{
  "name": "Teclado mecanico",
  "sku": "TEC-001",
  "description": "Teclado para juegos",
  "category": "ID_DE_LA_CATEGORIA",
  "price": 249.9,
  "stock": 10,
  "minimumStock": 3,
  "imageUrl": "https://example.com/teclado.jpg"
}
```

Movimiento de inventario:

```http
PATCH /api/products/:id/stock
Authorization: Bearer TOKEN_DE_ADMINISTRADOR
Content-Type: application/json

{
  "type": "salida",
  "quantity": 2,
  "reason": "Venta en tienda"
}
```

Los tipos permitidos son `entrada`, `salida` y `ajuste`. En un ajuste,
`quantity` representa la nueva existencia total.

```http
GET /api/products/:id/stock-movements
GET /api/products/low-stock
Authorization: Bearer TOKEN_DE_ADMINISTRADOR
```

Un producto aparece como stock bajo cuando `stock` es menor o igual que
`minimumStock`. El borrado de productos es logico: el producto queda inactivo.

## Busqueda y filtros

`GET /api/products` admite estos parametros:

- `search`: busca en nombre, descripcion y SKU.
- `category`: identificador de categoria.
- `minPrice` y `maxPrice`: rango de precio.
- `inStock`: `true` para disponibles o `false` para agotados.
- `sort`: `newest`, `oldest`, `price_asc`, `price_desc`, `name_asc` o
  `name_desc`.
- `page`: pagina solicitada.
- `limit`: resultados por pagina, con maximo de 50.

Ejemplo:

```http
GET /api/products?search=teclado&minPrice=50&maxPrice=300&inStock=true&sort=price_asc&page=1&limit=12
```

La respuesta incluye `products` y un objeto `pagination`.

## API de carrito

Todas las rutas requieren JWT de un usuario con rol `cliente`.

```http
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:productId
DELETE /api/cart/items/:productId
DELETE /api/cart
```

Agregar un producto:

```http
POST /api/cart/items
Authorization: Bearer TOKEN_DEL_CLIENTE
Content-Type: application/json

{
  "productId": "ID_DEL_PRODUCTO",
  "quantity": 2
}
```

Actualizar cantidad:

```http
PATCH /api/cart/items/ID_DEL_PRODUCTO
Authorization: Bearer TOKEN_DEL_CLIENTE
Content-Type: application/json

{
  "quantity": 3
}
```

El carrito no reserva inventario. Cada operacion valida el stock actual y
devuelve subtotales, total, cantidad de articulos y disponibilidad.

## API de pedidos y pagos

Crear un pedido desde el carrito:

```http
POST /api/orders
Authorization: Bearer TOKEN_DEL_CLIENTE
Content-Type: application/json

{
  "shippingAddress": {
    "recipient": "Cliente Prueba",
    "phone": "999999999",
    "address": "Av. Principal 123",
    "city": "Lima",
    "reference": "Frente al parque"
  }
}
```

Al crear el pedido se copian nombres, SKU y precios para conservar el historial,
y se vacia el carrito. El inventario se descuenta solamente cuando el pago es
aprobado.

```http
GET /api/orders
GET /api/orders/:id
Authorization: Bearer TOKEN
```

Los clientes ven solo sus pedidos. Los administradores pueden consultar todos.

Pago simulado:

```http
POST /api/orders/:id/pay
Authorization: Bearer TOKEN_DEL_CLIENTE
Content-Type: application/json

{
  "method": "tarjeta",
  "simulate": "approved"
}
```

`method` acepta `tarjeta` o `transferencia`. `simulate` acepta `approved` o
`rejected`. Un pago aprobado descuenta stock, registra movimientos y evita un
segundo pago mediante una transaccion de MongoDB.

Actualizacion administrativa del estado:

```http
PATCH /api/orders/:id/status
Authorization: Bearer TOKEN_DE_ADMINISTRADOR
Content-Type: application/json

{
  "status": "en_preparacion"
}
```

El flujo permitido es `pagado`, `en_preparacion`, `enviado` y `entregado`.

## API de soporte

```http
GET    /api/tickets
POST   /api/tickets
GET    /api/tickets/:id
POST   /api/tickets/:id/messages
PATCH  /api/tickets/:id/assign
PATCH  /api/tickets/:id/status
POST   /api/tickets/:id/quote
PATCH  /api/tickets/:id/quote
```

Los clientes crean tickets, escriben mensajes y responden cotizaciones. Los
usuarios de soporte y administradores gestionan asignaciones, estados y
cotizaciones.

Ejemplo de cotizacion:

```json
{
  "diagnosis": "La fuente de poder debe ser reemplazada",
  "items": [
    {
      "description": "Fuente de poder 650W",
      "quantity": 1,
      "unitPrice": 280
    }
  ],
  "laborCost": 80,
  "validUntil": "2026-07-12"
}
```

## API de reportes

```http
GET /api/reports/summary
GET /api/reports/summary?from=2026-06-01&to=2026-06-30
Authorization: Bearer TOKEN_DE_ADMINISTRADOR
```

El resumen incluye ventas pagadas, ticket promedio, pedidos y pagos por estado,
tickets por estado, usuarios activos, alertas de stock y productos mas vendidos.

## Interfaz web

La aplicacion React incluye:

- Inicio, registro e inicio de sesion.
- Catalogo con busqueda y filtros.
- Creacion de productos para administradores.
- Carrito y creacion de pedidos para clientes.
- Pagos simulados y seguimiento de pedidos.
- Centro de soporte con mensajes y cotizaciones.
- Panel administrativo con reportes y alertas de inventario.

Las rutas y opciones visibles cambian segun el rol autenticado.

## Datos y roles iniciales

Configura en `backend/.env` las variables `SEED_ADMIN_*` y `SEED_SUPPORT_*`
del archivo de ejemplo. Luego ejecuta:

```powershell
cd backend
npm.cmd run seed
```

El comando es idempotente: crea o verifica el administrador, el usuario de
soporte, tres categorias y productos de demostracion sin duplicarlos.

El registro publico siempre crea usuarios `cliente`. Una vez autenticado, el
administrador puede cambiar roles y activar o desactivar cuentas desde el panel
web o mediante:

```http
PATCH /api/users/:id
Authorization: Bearer TOKEN_DE_ADMINISTRADOR

{
  "role": "soporte",
  "active": true
}
```

Un administrador no puede desactivar su propia cuenta ni quitarse su propio
rol administrativo.

Valores admitidos:

```text
cliente
administrador
soporte
```

## Verificacion

```powershell
cd backend
npm.cmd test

cd ..\frontend
npm.cmd run lint
npm.cmd run build
```

La suite automatizada cubre autenticacion, roles, catalogo, inventario,
busqueda, carrito, pedidos, pagos, tickets, cotizaciones y rangos de reportes.

## Mejoras futuras

1. Recuperacion de contrasena y verificacion de correo.
2. Carga real de imagenes y almacenamiento externo.
3. Pasarela de pagos real.
4. Notificaciones por correo o mensajeria.
5. Pruebas integrales conectadas a una base de datos temporal.

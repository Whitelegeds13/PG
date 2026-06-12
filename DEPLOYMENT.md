# Despliegue HTTPS en Render

El proyecto se despliega como un unico servicio:

- Express publica la API bajo `/api`.
- Express sirve la compilacion de React en las demas rutas.
- Render entrega una URL `https://*.onrender.com`.
- Render administra y renueva automaticamente el certificado TLS.

## Requisitos

1. Repositorio Git alojado en GitHub, GitLab o Bitbucket.
2. Cuenta de Render conectada al proveedor Git.
3. Cadena de conexion de MongoDB Atlas con la base `palacio_gamer`.
4. Acceso de red de Atlas permitido para Render.

## Despliegue con Blueprint

1. Publica este repositorio en tu proveedor Git.
2. En Render selecciona `New` y luego `Blueprint`.
3. Conecta el repositorio.
4. Render detectara `render.yaml`.
5. Introduce `MONGODB_URI` cuando Render la solicite.
6. Confirma la creacion del servicio.

`JWT_SECRET` se genera automaticamente y nunca se guarda en Git.

## Configuracion de Atlas

En MongoDB Atlas:

1. Abre `Network Access`.
2. Permite las IP de salida de Render o, para una prueba inicial, permite
   `0.0.0.0/0`.
3. Conserva un usuario de base de datos con acceso solo a la base necesaria.
4. Cambia cualquier credencial que haya sido compartida fuera de Atlas.

## Verificacion

Cuando Render indique `Live`, abre:

```text
https://NOMBRE-DEL-SERVICIO.onrender.com/
https://NOMBRE-DEL-SERVICIO.onrender.com/api/health
```

La ruta de salud debe responder con `status: ok` y `database: connected`.

## Dominio propio

Render permite añadir un dominio en `Settings > Custom Domains`. Despues de
configurar los registros DNS indicados por Render, la plataforma emite el
certificado HTTPS sin configuracion adicional.

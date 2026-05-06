# 🎪 Cirquera - Documentación de la API (Backend)

Bienvenido a la documentación de la API de **Cirquera**, la plataforma profesional para el sector del circo. Esta API maneja toda la lógica laboral y social de la aplicación.

## 🚀 Información General

- **URL Base:** `http://localhost:5000/api`
- **Autenticación:** JWT vía Bearer Token (`Authorization: Bearer <token>`)
- **Formato:** JSON

---

## 👤 Usuarios (`/users`)

Gestión de registros, login y perfiles profesionales.

- `POST /register`: Registro de nuevos usuarios (Talent o Company).
- `POST /login`: Autenticación y obtención de token.
- `GET /`: Lista de usuarios con filtros (rol, habilidades, ubicación).
- `GET /profile/:id`: Obtener el detalle completo de un perfil.
- `PUT /profile/:id`: Actualizar datos del perfil (bio, experiencia, portafolio).

## 💼 Empleos (`/jobs`)

Bolsa de trabajo para el sector circense.

- `POST /`: Publicar una nueva oferta (Solo empresas).
- `GET /`: Listar todas las ofertas activas con filtros.
- `GET /:id`: Detalle de una oferta específica.
- `PUT /:id`: Editar una oferta existente.
- `DELETE /:id`: Eliminar/Desactivar una oferta.

## 📝 Publicaciones y Feed (`/posts`)

Red social para artistas y compañías.

- `POST /`: Crear una nueva publicación (texto y archivos multimedia).
- `GET /`: Obtener el feed global de publicaciones.
- `GET /:id`: Ver un post específico con sus comentarios.
- `PUT /:id/like`: Dar o quitar "me gusta" a un post.
- `POST /:id/comment`: Añadir un comentario a una publicación.
- `DELETE /:id`: Eliminar una publicación.

## 📄 Aplicaciones (`/applications`)

Gestión de solicitudes de empleo.

- `POST /`: El talento aplica a una oferta de trabajo.
- `GET /`: Listar aplicaciones (filtrable por trabajo o artista).
- `PUT /:id`: Cambiar el estado de la aplicación (aceptar/rechazar).
- `DELETE /:id`: Retirar una aplicación.

## 🤝 Seguimiento (`/follows`)

Conexiones entre usuarios.

- `POST /`: Seguir a un usuario. (Compañías automático, Talento requiere aprobación).
- `PUT /:id/accept`: Aceptar una solicitud de seguimiento.
- `DELETE /:id`: Dejar de seguir o rechazar solicitud.
- `GET /:userId`: Listar seguidores o seguidos.

## 💬 Chat y Mensajes (`/chats` / `/messages`)

Comunicación directa entre profesionales.

- `POST /`: Iniciar o acceder a un chat entre dos usuarios.
- `GET /:userId`: Listar todas las sesiones de chat de un usuario.
- `POST /message`: Enviar un mensaje nuevo.
- `GET /messages/:chatId`: Obtener el historial de mensajes de un chat.

## 🔔 Notificaciones (`/notifications`)

Alertas de actividad.

- `GET /:userId`: Obtener las notificaciones del usuario (likes, follows, aplicaciones).
- `PUT /:id/read`: Marcar una notificación como leída.

## 📁 Multimedia (`/upload`)

Subida de archivos a la carpeta `uploads/`.

- `POST /`: Sube un archivo (imagen o vídeo) y devuelve la URL para guardarla en el perfil o post.

---

## 🛠️ Notas Técnicas

- **Hasheo:** Las contraseñas están protegidas con `bcryptjs`.
- **Media:** La carpeta `uploads/` se sirve estáticamente para acceder a las fotos y vídeos.
- **Middleware:** Las rutas privadas están protegidas por el middleware `protect`.

## 🛡️ Panel de Administración (`/admin`)

Endpoints añadidos para que el frontend Laravel pueda consumir el panel admin sin acceder directamente a MongoDB. Todas las rutas, salvo el login admin, requieren `Authorization: Bearer <token>` de un usuario con `role: "admin"`.

### Autenticación admin

- `POST /api/admin/auth/login`: Login exclusivo para cuentas de usuario con rol `admin`.

### Dashboard

- `GET /api/admin/dashboard`: Métricas agregadas de cuentas, empresas, ofertas, publicaciones, aplicaciones, reportes y categorías.

### Usuarios / cuentas

- `GET /api/admin/users`: Lista paginada de talentos, admins y compañías. Filtros: `role`, `status`, `q`, `page`, `limit`.
- `GET /api/admin/users/export`: Exportación CSV de cuentas.
- `POST /api/admin/users`: Crea talento, admin o compañía según `role`.
- `GET /api/admin/users/:id`: Detalle de una cuenta.
- `PUT|PATCH /api/admin/users/:id`: Actualiza una cuenta.
- `PATCH /api/admin/users/:id/status`: Suspende/reactiva una cuenta; acepta `status` o alterna si no se envía.
- `DELETE /api/admin/users/:id`: Elimina una cuenta. No permite eliminar el propio admin autenticado.

### Ofertas

- `GET /api/admin/jobs`: Lista paginada de ofertas. Filtros: `status`, `q`, `page`, `limit`.
- `POST /api/admin/jobs`: Crea una oferta; `status: approved` activa la oferta automáticamente.
- `GET /api/admin/jobs/:id`: Detalle de una oferta.
- `PUT|PATCH /api/admin/jobs/:id`: Actualiza una oferta.
- `PATCH /api/admin/jobs/:id/status`: Cambia el estado `pending|approved|rejected` y sincroniza `isActive`.
- `DELETE /api/admin/jobs/:id`: Elimina una oferta.

### Reportes y moderación

- `GET /api/admin/reports`: Lista reportes. Filtro: `status`.
- `POST /api/admin/reports`: Crea un reporte sobre `user`, `company`, `job` o `post`.
- `PATCH /api/admin/reports/:id/resolve`: Cierra un reporte como `resolved` o `dismissed`.
- `DELETE /api/admin/reports/:id/target`: Aplica la acción de moderación sobre el objetivo del reporte.
- `DELETE /api/admin/reports/:id`: Elimina un reporte.

### Categorías y habilidades

- `GET /api/admin/categories`: Lista categorías e incluye `allSkills` y `skillUsage`.
- `POST /api/admin/categories`: Crea una categoría.
- `GET /api/admin/categories/:id`: Detalle de categoría.
- `PUT|PATCH /api/admin/categories/:id`: Actualiza categoría.
- `DELETE /api/admin/categories/:id`: Elimina categoría.
- `POST /api/admin/categories/:id/skills`: Añade habilidad.
- `DELETE /api/admin/categories/:id/skills/:skill`: Elimina habilidad.

También se han añadido alias en español para facilitar la conexión con las rutas actuales del panel: `/usuarios`, `/ofertas`, `/reportes`, `/categorias`, `/estado`, `/resolver`, `/objetivo` y `/habilidades` bajo `/api/admin`.

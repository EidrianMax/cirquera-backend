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

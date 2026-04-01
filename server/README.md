# TaskFlow Server — API REST

> Backend de TaskFlow construido con **Node.js** y **Express**. Persistencia en memoria (sin base de datos).

---

## 📋 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/tasks` | Obtiene todas las tareas |
| `GET` | `/api/v1/tasks/:id` | Obtiene una tarea por ID |
| `POST` | `/api/v1/tasks` | Crea una nueva tarea |
| `PUT` | `/api/v1/tasks/:id` | Actualiza una tarea existente |
| `DELETE` | `/api/v1/tasks/:id` | Elimina una tarea por ID |

---

## 📦 Esquema de datos

### Task
```json
{
  "id": "string",
  "text": "string",
  "category": "string",
  "priority": "string",
  "dueDate": "string | null",
  "completed": "boolean",
  "createdAt": "ISO8601 string",
  "completedAt": "ISO8601 string | null"
}
```

### Campos obligatorios y opcionales

| Campo | POST | PUT | Validación |
|-------|------|-----|------------|
| `text` | **Requerido** | Opcional | 1-120 caracteres, no vacío |
| `category` | Opcional | Opcional | Cualquier string (def: "General") |
| `priority` | Opcional | Opcional | `urgent`, `progress`, `optional` (def: "optional") |
| `dueDate` | Opcional | Opcional | ISO date string o `null` |
| `completed` | Opcional | Opcional | Boolean (def: `false`) |

---

## 🧪 Ejemplos de requests

### Crear tarea
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"text": "Nueva tarea", "priority": "urgent", "category": "Trabajo"}'
```

### Actualizar tarea (completar)
```bash
curl -X PUT http://localhost:3000/api/v1/tasks/123456789 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Editar texto
```bash
curl -X PUT http://localhost:3000/api/v1/tasks/123456789 \
  -H "Content-Type: application/json" \
  -d '{"text": "Texto actualizado"}'
```

### Eliminar tarea
```bash
curl -X DELETE http://localhost:3000/api/v1/tasks/123456789
```

---

## ⚠️ Códigos de error

### 400 Bad Request
- `text` vacío o no proporcionado
- `priority` con valor inválido

### 404 Not Found
- Tarea con ID especificado no existe

### 500 Internal Server Error
- Error inesperado del servidor

### Respuestas de error
```json
{ "error": "El campo \"text\" es obligatorio y debe ser una cadena no vacía." }
{ "error": "Tarea no encontrada." }
{ "error": "Error interno del servidor." }
```

---

## 🏗️ Estructura del servidor

```
server/
├── src/
│   ├── index.js           # Entry point, Express app
│   ├── config/
│   │   └── env.js         # Configuración de variables de entorno
│   ├── routes/
│   │   └── task.routes.js # Definición de rutas
│   ├── controllers/
│   │   └── task.controller.js  # Handlers de endpoints
│   └── services/
│       └── task.service.js     # Lógica de negocio
├── .env                    # Variables de entorno
├── package.json
└── README.md              # Este archivo
```

---

## 🔧 Configuración

### Variables de entorno (`.env`)
```
PORT=3000
```

### Dependencias
- `express` — Framework web
- `cors` — Cross-Origin Resource Sharing
- `dotenv` — Carga de variables de entorno

---

## 🚀 Ejecución

### Desarrollo
```bash
cd server
npm run dev
```
Inicia el servidor con **nodemon** (reinicio automático en cambios).

### Producción
```bash
cd server
npm start
```

### Tests de API
```bash
cd server
node test-api.js
```
Ejecuta un test exhaustivo de todos los endpoints.

---

## 🔄 CORS

El servidor permite conexiones desde:
- `http://localhost:5500` (Live Server de VS Code)
- `https://taskflow-project-psi-mocha.vercel.app` (Deploy en Vercel)

---

## 📝 Notas técnicas

1. **Persistencia en memoria**: Las tareas se almacenan en un array en memoria. Se pierden al reiniciar el servidor.
2. **IDs**: Se generan con `Date.now().toString()`, únicos dentro de la sesión.
3. **Validaciones**: Se realizan tanto en el controlador (HTTP) como en el servicio (lógica de negocio).
4. **Errores**: El middleware de errores centralizado traduce `NOT_FOUND` a 404 y otros errores a 500.
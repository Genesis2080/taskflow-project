# TaskFlow — Gestor de Tareas Full Stack

Aplicación web de productividad con arquitectura cliente-servidor.
Frontend en HTML/CSS/JS puro · Backend en Node.js + Express.

---

## Arquitectura general
```
taskflow-project/
├── server/                  # Backend Node.js
│   └── src/
│       ├── config/env.js    # Carga y valida variables de entorno
│       ├── services/        # Lógica de negocio pura
│       ├── controllers/     # Traducción HTTP ↔ servicios
│       ├── routes/          # Mapa de endpoints
│       └── index.js         # Punto de entrada + middlewares
├── src/
│   └── api/client.js        # Capa de red del frontend
├── index.html
├── style.css
└── app.js
```

---

## Backend

### Arrancar el servidor
```bash
cd server
npm run dev
# → Servidor escuchando en http://localhost:3000
```

### Middlewares implementados

| Middleware | Función |
|---|---|
| `cors()` | Permite peticiones desde el frontend en otro origen |
| `express.json()` | Parsea el body de las peticiones como JSON |
| Error handler `(err,req,res,next)` | Captura cualquier error no controlado, lo clasifica y responde de forma segura |

El middleware de errores evalúa `err.message`: si es `'NOT_FOUND'` devuelve 404; para cualquier otro error registra la traza con `console.error` y devuelve 500 sin filtrar detalles técnicos al cliente.

### Endpoints de la API

| Método | Ruta | Descripción | Código éxito |
|---|---|---|---|
| GET | `/api/v1/tasks` | Lista todas las tareas | 200 |
| POST | `/api/v1/tasks` | Crea una tarea nueva | 201 |
| DELETE | `/api/v1/tasks/:id` | Elimina una tarea por ID | 204 |

### Ejemplos de uso

**Obtener tareas:**
```bash
curl http://localhost:3000/api/v1/tasks
```

**Crear tarea:**
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"text": "Revisar pull requests"}'
```

**Eliminar tarea:**
```bash
curl -X DELETE http://localhost:3000/api/v1/tasks/1234567890
```

### Códigos de error

| Código | Cuándo ocurre |
|---|---|
| 400 | Body inválido (falta `text` o está vacío) |
| 404 | Se intenta eliminar un ID inexistente |
| 500 | Error interno no controlado |

---

## Frontend

### Variables de entorno y persistencia

Las tareas se obtienen y sincronizan con el servidor. Solo se mantiene en `localStorage`:
- `taskflow_darkMode` — preferencia de tema visual
- `taskflow_completedDays` — historial local para estadísticas

### Estados de red gestionados

- **Carga** — spinner animado mientras la petición viaja al servidor
- **Éxito** — renderizado normal de la lista
- **Error** — banner rojo en la parte superior con el mensaje del fallo
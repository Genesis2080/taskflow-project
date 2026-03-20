# Arquitectura del proyecto

## Visión general

TaskFlow sigue una arquitectura **cliente-servidor** con separación estricta de responsabilidades en ambos lados.

```
┌─────────────────────────────────┐     HTTP/REST     ┌──────────────────────────────┐
│           CLIENT                │ ◄───────────────► │           SERVER              │
│                                 │                   │                              │
│  app.js (orquestador)           │                   │  index.js (entrada)          │
│    ├── src/api/client.js        │                   │    ├── routes/               │
│    ├── src/audio/sounds.js      │                   │    ├── controllers/          │
│    ├── src/services/stats.js    │                   │    ├── services/             │
│    └── src/ui/                  │                   │    └── config/               │
│         ├── render.js           │                   │                              │
│         ├── toast.js            │                   │                              │
│         └── theme.js            │                   │                              │
└─────────────────────────────────┘                   └──────────────────────────────┘
```

---

## Frontend

### Principios de diseño

**Módulos ES6** — cada archivo usa `export`/`import` nativos del navegador. No hay bundler (Webpack, Vite) para mantener la simplicidad, pero la estructura es compatible con migrar a uno en el futuro.

**Un solo estado global** — el array `tasks` y las variables de control (`activeFilter`, `statsOpen`, `pendingUndo`) viven únicamente en `app.js`. Ningún módulo secundario muta el estado directamente; reciben datos como parámetros y devuelven resultados.

**Separación DOM / lógica / red** — `render.js` nunca hace fetch. `client.js` nunca toca el DOM. `stats.service.js` es lógica pura que podría ejecutarse en Node.js sin cambios.

### Flujo de una acción

```
Usuario pulsa "+ Añadir tarea"
        ↓
app.js: handleAddTask()
        ↓
api/client.js: apiCreateTask()   ← fetch POST al servidor
        ↓
Servidor responde con la tarea creada (JSON)
        ↓
app.js: tasks.push(newTask)      ← actualiza estado
        ↓
app.js: refresh()
        ↓
ui/render.js: renderTaskList()   ← actualiza DOM
```

---

## Backend

### Arquitectura por capas

```
Petición HTTP
     ↓
  Rutas (task.routes.js)
  └── ¿a qué controlador va?
     ↓
  Controlador (task.controller.js)
  └── ¿son válidos los datos?
  └── ¿qué código HTTP devuelvo?
     ↓
  Servicio (task.service.js)
  └── lógica pura
  └── trabaja con el array en memoria
     ↓
  Middleware de errores (index.js)
  └── captura cualquier error no controlado
  └── clasifica: 404 si NOT_FOUND, 500 para el resto
```

### Middlewares

| Middleware | Tipo | Función |
|---|---|---|
| `cors()` | Tercero | Permite peticiones desde el frontend en otro origen |
| `express.json()` | Built-in | Parsea el body como JSON y lo pone en `req.body` |
| `(err, req, res, next)` | Propio | Manejador global de errores al final de la cadena |

El middleware de errores evalúa `err.message`:
- `'NOT_FOUND'` → 404 con mensaje legible
- cualquier otro → `console.error(err)` + 500 con mensaje genérico (sin filtrar detalles técnicos)

---

## Decisiones técnicas

**¿Por qué no localStorage para las tareas?**
localStorage es sincrónico, limitado a 5 MB y no se comparte entre dispositivos ni usuarios. Con un servidor real, los datos persisten y podrían ser accesibles desde cualquier navegador una vez implementada la autenticación.

**¿Por qué `type="module"` en el HTML?**
Permite usar `import`/`export` nativos sin transpilación. El navegador carga los módulos en orden correcto automáticamente y cada archivo tiene su propio ámbito (no hay variables globales accidentales).

**¿Por qué el array en memoria en el servidor?**
Es temporal hasta conectar una base de datos real (próxima fase). La arquitectura de servicios está diseñada para que el cambio sea mínimo: solo se modifica `task.service.js`, los controladores y rutas no cambian.
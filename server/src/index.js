const express    = require('express');
const cors       = require('cors');
const { PORT }   = require('./config/env');
const taskRoutes = require('./routes/task.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Servidor funcionando' });
});

// ── Middleware global de errores ──────────────────────────────
// IMPORTANTE: debe ir al final, después de todas las rutas.
// Express lo identifica por tener exactamente 4 parámetros.
app.use((err, req, res, next) => {

  // Error conocido: el servicio lanzó 'NOT_FOUND'
  if (err.message === 'NOT_FOUND') {
    return res.status(404).json({
      error: 'El recurso solicitado no existe.',
    });
  }

  // Error desconocido: lo registramos en consola pero no
  // filtramos detalles técnicos al cliente por seguridad
  console.error(err);
  res.status(500).json({
    error: 'Error interno del servidor.',
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
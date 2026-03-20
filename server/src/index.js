const express    = require('express');
const cors       = require('cors');
const { PORT }   = require('./config/env');
const taskRoutes = require('./routes/task.routes');

const app = express();

// CORS debe ir primero, antes de cualquier ruta
app.use(cors({
  origin: [
    "http://localhost:5500",
    "https://taskflow-project-psi-mocha.vercel.app",  // sin barra al final
  ]
}));

app.use(express.json());

app.use('/api/v1/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Servidor funcionando' });
});

app.use((err, req, res, next) => {
  if (err.message === 'NOT_FOUND') {
    return res.status(404).json({ error: 'El recurso solicitado no existe.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
// Vercel server entry point
const express = require('express');
const cors = require('cors');
const taskRoutes = require('../server/src/routes/task.routes');

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5500",
    "https://taskflow-project-psi-mocha.vercel.app",
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

module.exports = app;
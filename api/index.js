const express = require('express');
const cors = require('cors');

let tasks = [];

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5500",
    "https://taskflow-project-psi-mocha.vercel.app",
  ]
}));

app.use(express.json());

// GET all tasks
app.get('/api/v1/tasks', (req, res) => {
  res.status(200).json(tasks);
});

// GET single task
app.get('/api/v1/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada.' });
  res.status(200).json(task);
});

// POST create task
app.post('/api/v1/tasks', (req, res) => {
  const { text, category, priority, dueDate, completed } = req.body;
  
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'El campo "text" es obligatorio y debe ser una cadena no vacía.' });
  }
  
  const validPriorities = ['urgent', 'progress', 'optional'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: `Prioridad inválida. Valores permitidos: ${validPriorities.join(', ')}` });
  }
  
  const nuevaTarea = {
    id: Date.now().toString(),
    text: text.trim(),
    category: category || 'General',
    priority: priority || 'optional',
    dueDate: dueDate || null,
    completed: completed || false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  
  tasks.push(nuevaTarea);
  res.status(201).json(nuevaTarea);
});

// PUT update task
app.put('/api/v1/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { text, category, priority, dueDate, completed } = req.body;
  
  const tarea = tasks.find(t => t.id === id);
  if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada.' });
  
  if (text !== undefined && (typeof text !== 'string' || text.trim() === '')) {
    return res.status(400).json({ error: 'El campo "text" debe ser una cadena no vacía.' });
  }
  
  const validPriorities = ['urgent', 'progress', 'optional'];
  if (priority !== undefined && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: `Prioridad inválida. Valores permitidos: ${validPriorities.join(', ')}` });
  }
  
  if (text !== undefined) tarea.text = text.trim();
  if (category !== undefined) tarea.category = category;
  if (priority !== undefined) tarea.priority = priority;
  if (dueDate !== undefined) tarea.dueDate = dueDate;
  if (completed !== undefined) {
    const wasCompleted = tarea.completed;
    tarea.completed = completed;
    if (completed && !wasCompleted) {
      tarea.completedAt = new Date().toISOString();
    } else if (!completed && wasCompleted) {
      tarea.completedAt = null;
    }
  }
  
  res.status(200).json(tarea);
});

// DELETE task
app.delete('/api/v1/tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = tasks.findIndex(t => t.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'El recurso solicitado no existe.' });
  }
  
  tasks.splice(index, 1);
  res.status(204).send();
});

module.exports = app;
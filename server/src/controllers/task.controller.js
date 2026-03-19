const taskService = require('../services/task.service');

function getTasks(req, res) {
  const tasks = taskService.obtenerTodas();
  res.status(200).json(tasks);
}

function createTask(req, res) {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({
      error: 'El campo "text" es obligatorio y debe ser una cadena no vacía.',
    });
  }

  const nuevaTarea = taskService.crearTarea({ text: text.trim() });
  res.status(201).json(nuevaTarea);
}

// ← Añadimos "next" como tercer parámetro
function deleteTask(req, res, next) {
  const { id } = req.params;

  try {
    taskService.eliminarTarea(id);
    res.status(204).send();
  } catch (error) {
    // Ya no manejamos nada aquí: pasamos el error hacia arriba
    next(error);
  }
}

module.exports = { getTasks, createTask, deleteTask };
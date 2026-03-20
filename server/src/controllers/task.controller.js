/**
 * @fileoverview Controlador de tareas.
 * Valida los datos de la petición y llama al servicio correspondiente.
 */

const taskService = require('../services/task.service');

/**
 * GET /api/v1/tasks
 */
function getTasks(req, res) {
  const tasks = taskService.obtenerTodas();
  res.status(200).json(tasks);
}

/**
 * POST /api/v1/tasks
 * Body esperado: { text, category, priority, dueDate, completed }
 */
function createTask(req, res) {
  const { text, category, priority, dueDate, completed } = req.body;

  // Validación: text es obligatorio
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({
      error: 'El campo "text" es obligatorio y debe ser una cadena no vacía.',
    });
  }

  // Validación: priority debe ser uno de los valores permitidos
  const validPriorities = ['urgent', 'progress', 'optional'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({
      error: `Prioridad inválida. Valores permitidos: ${validPriorities.join(', ')}`,
    });
  }

  const nuevaTarea = taskService.crearTarea({
    text:      text.trim(),
    category:  category  || 'General',
    priority:  priority  || 'optional',
    dueDate:   dueDate   || null,
    completed: completed || false,
  });

  res.status(201).json(nuevaTarea);
}

/**
 * DELETE /api/v1/tasks/:id
 */
function deleteTask(req, res, next) {
  const { id } = req.params;

  try {
    taskService.eliminarTarea(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { getTasks, createTask, deleteTask };
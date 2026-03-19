const taskService = require('../services/task.service');

/**
 * GET /api/v1/tasks
 * Devuelve todas las tareas.
 */
function getTasks(req, res) {
  const tasks = taskService.obtenerTodas();
  res.status(200).json(tasks);
}

/**
 * POST /api/v1/tasks
 * Crea una nueva tarea.
 * Body esperado: { "text": "nombre de la tarea" }
 */
function createTask(req, res) {
  const { text } = req.body;

  // Validación defensiva: el campo text es obligatorio
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({
      error: 'El campo "text" es obligatorio y debe ser una cadena no vacía.',
    });
  }

  const nuevaTarea = taskService.crearTarea({ text: text.trim() });
  res.status(201).json(nuevaTarea);
}

/**
 * DELETE /api/v1/tasks/:id
 * Elimina una tarea por ID.
 */
function deleteTask(req, res) {
  const { id } = req.params;

  try {
    taskService.eliminarTarea(id);
    res.status(204).send(); // 204 = éxito sin contenido en la respuesta
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({
        error: `No existe ninguna tarea con el ID "${id}".`,
      });
    }

    // Error inesperado
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = { getTasks, createTask, deleteTask };
/**
 * @fileoverview Servicio de tareas.
 * Lógica pura: no conoce HTTP ni Express.
 * Persistencia simulada en memoria (array).
 */

let tasks = [];

/**
 * Devuelve todas las tareas.
 * @returns {Task[]}
 */
function obtenerTodas() {
  return tasks;
}

/**
 * Crea una nueva tarea con todos sus campos.
 * @param {{ text: string, category: string, priority: string, dueDate: string|null, completed: boolean }} data
 * @returns {Task}
 */
function crearTarea(data) {
  const nuevaTarea = {
    id:          Date.now().toString(),
    text:        data.text,
    category:    data.category  || 'General',
    priority:    data.priority  || 'optional',
    dueDate:     data.dueDate   || null,
    completed:   data.completed || false,
    createdAt:   new Date().toISOString(),
    completedAt: null,
  };

  tasks.push(nuevaTarea);
  return nuevaTarea;
}

/**
 * Elimina una tarea por ID.
 * @param {string} id
 * @throws {Error} NOT_FOUND si el ID no existe
 */
function eliminarTarea(id) {
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    throw new Error('NOT_FOUND');
  }

  tasks.splice(index, 1);
}

module.exports = { obtenerTodas, crearTarea, eliminarTarea };
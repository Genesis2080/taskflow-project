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

/**
 * Obtiene una tarea por ID.
 * @param {string} id
 * @returns {Task|undefined}
 */
function obtenerPorId(id) {
  return tasks.find(t => t.id === id);
}

/**
 * Actualiza una tarea por ID.
 * @param {string} id
 * @param {Partial<Task>} data
 * @returns {Task}
 * @throws {Error} NOT_FOUND si el ID no existe
 */
function actualizarTarea(id, data) {
  const tarea = tasks.find(t => t.id === id);
  if (!tarea) {
    throw new Error('NOT_FOUND');
  }
  
  if (data.text !== undefined) tarea.text = data.text;
  if (data.category !== undefined) tarea.category = data.category;
  if (data.priority !== undefined) tarea.priority = data.priority;
  if (data.dueDate !== undefined) tarea.dueDate = data.dueDate;
  if (data.completed !== undefined) {
    const wasCompleted = tarea.completed;
    tarea.completed = data.completed;
    if (data.completed && !wasCompleted) {
      tarea.completedAt = new Date().toISOString();
    } else if (!data.completed && wasCompleted) {
      tarea.completedAt = null;
    }
  }
  
  return tarea;
}

module.exports = { obtenerTodas, obtenerPorId, crearTarea, actualizarTarea, eliminarTarea };
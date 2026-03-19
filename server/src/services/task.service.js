// Persistencia simulada en memoria
// Cuando reinicies el servidor, este array se vacía (es normal por ahora)
let tasks = [];

/**
 * Devuelve todas las tareas.
 * @returns {Array} lista de tareas
 */
function obtenerTodas() {
  return tasks;
}

/**
 * Crea una nueva tarea y la añade al array.
 * @param {Object} data - debe contener al menos { text }
 * @returns {Object} la tarea creada
 */
function crearTarea(data) {
  const nuevaTarea = {
    id:        Date.now().toString(), // ID único basado en timestamp
    text:      data.text,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(nuevaTarea);
  return nuevaTarea;
}

/**
 * Elimina una tarea por su ID.
 * @param {string} id
 * @throws {Error} si el ID no existe
 */
function eliminarTarea(id) {
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    throw new Error('NOT_FOUND');
  }

  tasks.splice(index, 1);
}

module.exports = { obtenerTodas, crearTarea, eliminarTarea };
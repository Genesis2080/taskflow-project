// src/api/client.js

const API_URL = 'http://localhost:3000/api/v1/tasks';

/**
 * Obtiene todas las tareas del servidor.
 * @returns {Promise<Array>}
 */
async function fetchTasks() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Error al obtener tareas: ${response.status}`);
  }

  return response.json();
}

/**
 * Crea una nueva tarea en el servidor.
 * @param {Object} taskData - { text, category, priority, dueDate }
 * @returns {Promise<Object>} la tarea creada
 */
async function createTask(taskData) {
  const response = await fetch(API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear la tarea');
  }

  return response.json();
}

/**
 * Elimina una tarea por su ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
async function deleteTask(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar la tarea');
  }
}
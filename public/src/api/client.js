/**
 * @fileoverview Capa de red del frontend.
 * Único punto de contacto con el servidor. Ningún otro módulo
 * llama a fetch directamente.
 */

const API_URL = import.meta.env?.VITE_API_URL || "/api/v1/tasks";

/**
 * Obtiene todas las tareas del servidor.
 * @returns {Promise<Task[]>}
 */
export async function apiFetchTasks() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`Error al obtener tareas: ${response.status}`);
  return response.json();
}

/**
 * Crea una tarea en el servidor.
 * @param {Object} taskData
 * @returns {Promise<Task>}
 */
export async function apiCreateTask(taskData) {
  const response = await fetch(API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(taskData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Error al crear la tarea");
  }
  return response.json();
}

/**
 * Elimina una tarea en el servidor.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function apiDeleteTask(id) {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    const err = await response.json();
    throw new Error(err.error || "Error al eliminar la tarea");
  }
}

/**
 * Actualiza una tarea en el servidor.
 * @param {string} id
 * @param {Object} taskData
 * @returns {Promise<Task>}
 */
export async function apiUpdateTask(id, taskData) {
  const response = await fetch(`${API_URL}/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(taskData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Error al actualizar la tarea");
  }
  return response.json();
}
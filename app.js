/**
 * @fileoverview TaskFlow – Gestor de Tareas
 * Lógica principal: gestión de tareas, filtros, persistencia y tema.
 *
 * Mejoras respecto a la versión anterior:
 *  - Constantes centralizadas (STORAGE_KEYS, PRIORITY_CONFIG, FILTER_VALUES)
 *  - Validación del formulario con feedback visual
 *  - Nombres de variables descriptivos (camelCase consistente)
 *  - Separación de responsabilidades por función
 *  - JSDoc en todas las funciones públicas
 *  - Eliminación de duplicidades en renderizado de badges
 *  - Toggle de dark-mode sin necesidad de reemplazar clases manualmente
 *  - Edición inline con doble clic (Enter/blur guarda, Escape cancela)
 */

"use strict";

// ─── Constantes ─────────────────────────────────────────────────────────────

/** Claves usadas para persistencia en localStorage */
const STORAGE_KEYS = {
  TASKS:     "taskflow_tasks",
  DARK_MODE: "taskflow_darkMode",
};

/** Valores de filtro disponibles */
const FILTER_VALUES = { ALL: "all", PENDING: "pending", COMPLETED: "completed" };

/**
 * Configuración de prioridades: clase CSS del badge y etiqueta visible.
 * @type {Record<string, {badgeClass: string, label: string}>}
 */
const PRIORITY_CONFIG = {
  urgent:   { badgeClass: "badge badge-urgent",   label: "🔴 Urgente"     },
  progress: { badgeClass: "badge badge-progress", label: "🟡 En progreso" },
  optional: { badgeClass: "badge badge-optional", label: "🟢 Opcional"    },
};

// ─── Estado de la aplicación ─────────────────────────────────────────────────

/** @type {Task[]} Lista de tareas cargadas desde storage */
let tasks = loadTasksFromStorage();

/** @type {string} Filtro actualmente activo */
let activeFilter = FILTER_VALUES.ALL;

// ─── Tipos (JSDoc) ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} Task
 * @property {string}  id        - Identificador único (timestamp + random)
 * @property {string}  text      - Texto de la tarea
 * @property {string}  category  - Categoría seleccionada
 * @property {string}  priority  - Prioridad: "urgent" | "progress" | "optional"
 * @property {boolean} completed - Estado de completado
 * @property {number}  createdAt - Timestamp de creación
 */

// ─── Persistencia ────────────────────────────────────────────────────────────

/**
 * Carga las tareas desde localStorage.
 * @returns {Task[]} Array de tareas (vacío si no existe o hay error de parseo)
 */
function loadTasksFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || [];
  } catch {
    console.warn("TaskFlow: no se pudo parsear el storage. Se reinicia la lista.");
    return [];
  }
}

/**
 * Persiste el array de tareas en localStorage.
 */
function persistTasks() {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

// ─── Creación de tareas ───────────────────────────────────────────────────────

/**
 * Genera un ID único para cada tarea.
 * @returns {string} Identificador único
 */
function generateTaskId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Valida el texto de la tarea y muestra feedback visual.
 * @param {string} text - Texto introducido por el usuario
 * @returns {boolean} `true` si el texto es válido
 */
function validateTaskInput(text) {
  const input     = document.getElementById("taskInput");
  const errorMsg  = document.getElementById("inputError");
  const isValid   = text.length > 0 && text.length <= 120;

  input.classList.toggle("error", !isValid);
  errorMsg.style.display = isValid ? "none" : "block";
  return isValid;
}

/**
 * Lee el formulario, valida y crea una nueva tarea.
 * Si la validación falla, muestra el error y no añade la tarea.
 */
function handleAddTask() {
  const input    = document.getElementById("taskInput");
  const text     = input.value.trim();

  if (!validateTaskInput(text)) {
    input.focus();
    return;
  }

  /** @type {Task} */
  const newTask = {
    id:        generateTaskId(),
    text,
    category:  document.getElementById("categorySelector").value,
    priority:  document.getElementById("prioritySelector").value,
    completed: false,
    createdAt: Date.now(),
  };

  tasks.push(newTask);
  input.value = "";
  input.classList.remove("error");
  document.getElementById("inputError").style.display = "none";

  persistTasks();
  renderTaskList();
}

// ─── Mutaciones de tarea ─────────────────────────────────────────────────────

/**
 * Alterna el estado completado de una tarea por su ID.
 * @param {string} taskId - ID de la tarea a alternar
 */
function toggleTaskCompletion(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  task.completed = !task.completed;
  persistTasks();
  renderTaskList();
}

/**
 * Elimina una tarea del array por su ID.
 * @param {string} taskId - ID de la tarea a eliminar
 */
function deleteTask(taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  persistTasks();
  renderTaskList();
}

/**
 * Actualiza el texto de una tarea por su ID.
 * @param {string} taskId  - ID de la tarea a actualizar
 * @param {string} newText - Nuevo texto (ya saneado)
 */
function updateTaskText(taskId, newText) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  task.text = newText;
  persistTasks();
}

// ─── Edición inline ───────────────────────────────────────────────────────────

/**
 * Activa el modo edición inline sobre el <span> de texto de una tarea.
 * - Enter / blur  → guarda si el texto es válido y no está vacío
 * - Escape        → cancela y restaura el texto original
 *
 * @param {HTMLElement} textSpan - El <span class="task-text"> del item
 * @param {Task}        task     - La tarea asociada
 */
function enableInlineEdit(textSpan, task) {
  // Evitar doble activación si ya hay un input abierto
  if (textSpan.querySelector("input")) return;

  const originalText = task.text;

  // Construir el input de edición
  const editInput = document.createElement("input");
  editInput.type        = "text";
  editInput.value       = originalText;
  editInput.maxLength   = 120;
  editInput.className   = "field edit-inline-input";
  editInput.setAttribute("aria-label", "Editar tarea");

  // Reemplazar el contenido del span por el input
  textSpan.textContent = "";
  textSpan.appendChild(editInput);
  textSpan.classList.add("editing");

  // Enfocar y situar el cursor al final
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  /** Guarda los cambios si el nuevo texto es válido */
  function saveEdit() {
    const newText = editInput.value.trim();

    if (newText && newText !== originalText) {
      updateTaskText(task.id, newText);
    }

    // Restaurar el span con el texto vigente (guardado o el original)
    textSpan.classList.remove("editing");
    textSpan.textContent = escapeHTML(newText || originalText);
  }

  /** Cancela la edición sin modificar el modelo */
  function cancelEdit() {
    textSpan.classList.remove("editing");
    textSpan.textContent = escapeHTML(originalText);
  }

  // ── Eventos del input ────────────────────────────────────────
  editInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  });

  // blur: guardar al perder el foco (clic fuera)
  editInput.addEventListener("blur", saveEdit, { once: true });
}

// ─── Filtrado ────────────────────────────────────────────────────────────────

/**
 * Devuelve las tareas según el filtro activo.
 * @returns {Task[]} Tareas filtradas
 */
function getFilteredTasks() {
  switch (activeFilter) {
    case FILTER_VALUES.PENDING:   return tasks.filter(t => !t.completed);
    case FILTER_VALUES.COMPLETED: return tasks.filter(t =>  t.completed);
    default:                      return [...tasks];
  }
}

// ─── Renderizado ─────────────────────────────────────────────────────────────

/**
 * Construye el HTML de los badges de categoría y prioridad para una tarea.
 * @param {Task} task - La tarea a la que pertenecen los badges
 * @returns {string} Fragmento HTML con los badges
 */
function buildBadgesHTML(task) {
  const { badgeClass, label } = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.optional;
  return `
    <span class="badge badge-cat">${task.category}</span>
    <span class="${badgeClass}">${label}</span>
  `;
}

/**
 * Crea el elemento <li> para una tarea y enlaza sus eventos.
 * El texto admite doble clic para edición inline.
 * @param {Task} task - Datos de la tarea
 * @returns {HTMLLIElement} Elemento de lista listo para insertar
 */
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task-item${task.completed ? " done" : ""}`;
  li.setAttribute("role", "listitem");
  li.dataset.id = task.id;

  li.innerHTML = `
    <div class="flex flex-col gap-1 min-w-0">
      <span class="task-text font-medium text-sm leading-snug truncate" title="Doble clic para editar">${escapeHTML(task.text)}</span>
      <div class="flex flex-wrap gap-1">${buildBadgesHTML(task)}</div>
    </div>
    <div class="flex gap-1 flex-shrink-0 mt-0.5">
      <button class="task-action btn-complete" aria-label="Marcar como ${task.completed ? 'pendiente' : 'completada'}">✔</button>
      <button class="task-action btn-delete"   aria-label="Eliminar tarea">✖</button>
    </div>
  `;

  const textSpan = li.querySelector(".task-text");

  // ── Edición inline con doble clic ────────────────────────────
  textSpan.addEventListener("dblclick", () => {
    // No permitir edición en tareas completadas
    if (task.completed) return;
    enableInlineEdit(textSpan, task);
  });

  li.querySelector(".btn-complete").addEventListener("click", () => toggleTaskCompletion(task.id));
  li.querySelector(".btn-delete").addEventListener("click",   () => deleteTask(task.id));

  return li;
}

/**
 * Escapa caracteres HTML especiales para prevenir XSS.
 * @param {string} str - Cadena a escapar
 * @returns {string} Cadena segura para insertar en el DOM
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Renderiza la lista completa de tareas según el filtro activo.
 * Muestra un estado vacío si no hay resultados.
 */
function renderTaskList() {
  const taskList      = document.getElementById("taskList");
  const taskCounter   = document.getElementById("taskCounter");
  const filteredTasks = getFilteredTasks();

  taskList.innerHTML = "";

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `
      <li class="empty-state">
        <span class="emoji">📭</span>
        ${activeFilter === FILTER_VALUES.COMPLETED
          ? "Todavía no has completado ninguna tarea."
          : "No hay tareas aquí. ¡Añade una!"}
      </li>`;
  } else {
    filteredTasks.forEach(task => {
      const li = createTaskElement(task);
      taskList.appendChild(li);
      // Pequeño delay para que la animación CSS se dispare
      requestAnimationFrame(() => requestAnimationFrame(() => li.classList.add("show")));
    });
  }

  taskCounter.textContent = tasks.filter(t => !t.completed).length;
}

// ─── Filtros ─────────────────────────────────────────────────────────────────

/**
 * Actualiza el filtro activo y vuelve a renderizar la lista.
 * @param {string} filterValue - Valor del filtro seleccionado
 */
function applyFilter(filterValue) {
  activeFilter = filterValue;
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filterValue);
  });
  renderTaskList();
}

// ─── Dark mode ───────────────────────────────────────────────────────────────

/**
 * Aplica el estado del dark mode (clase en <html>) y actualiza el botón.
 * @param {boolean} isDark - `true` para activar el modo oscuro
 */
function applyDarkMode(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  document.getElementById("darkIcon").textContent  = isDark ? "☀️" : "🌙";
  document.getElementById("darkLabel").textContent = isDark ? "Día"  : "Noche";
  localStorage.setItem(STORAGE_KEYS.DARK_MODE, isDark);
}

/**
 * Alterna el dark mode entre activo e inactivo.
 */
function toggleDarkMode() {
  const isDark = !document.documentElement.classList.contains("dark");
  applyDarkMode(isDark);
}

// ─── Inicialización ───────────────────────────────────────────────────────────

/**
 * Punto de entrada: enlaza eventos y realiza el render inicial.
 */
function init() {
  // Restaurar dark mode
  applyDarkMode(localStorage.getItem(STORAGE_KEYS.DARK_MODE) === "true");

  // Botón añadir
  document.getElementById("addBtn").addEventListener("click", handleAddTask);

  // Enter en el input
  document.getElementById("taskInput").addEventListener("keydown", e => {
    if (e.key === "Enter") handleAddTask();
  });

  // Limpiar error al escribir
  document.getElementById("taskInput").addEventListener("input", () => {
    const input = document.getElementById("taskInput");
    if (input.classList.contains("error") && input.value.trim()) {
      input.classList.remove("error");
      document.getElementById("inputError").style.display = "none";
    }
  });

  // Botones de filtro
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
  });

  // Toggle dark mode
  document.getElementById("darkModeBtn").addEventListener("click", toggleDarkMode);

  // Render inicial
  renderTaskList();
}

document.addEventListener("DOMContentLoaded", init);
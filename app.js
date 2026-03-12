/**
 * @fileoverview TaskFlow – Gestor de Tareas
 *
 * Funcionalidades:
 *  - Constantes centralizadas (STORAGE_KEYS, PRIORITY_CONFIG, FILTER_VALUES)
 *  - Validación del formulario con feedback visual
 *  - Edición inline con doble clic (Enter/blur guarda, Escape cancela)
 *  - Panel de estadísticas de productividad (desplegable):
 *      · Tareas completadas hoy
 *      · Racha de días activos consecutivos
 *      · Mini gráfico de barras de los últimos 7 días
 *      · Tasa de completado global con barra de progreso
 */

"use strict";

// ─── Constantes ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  TASKS:          "taskflow_tasks",
  DARK_MODE:      "taskflow_darkMode",
  COMPLETED_DAYS: "taskflow_completedDays", // { "YYYY-MM-DD": count }
};

const FILTER_VALUES = { ALL: "all", PENDING: "pending", COMPLETED: "completed" };

/**
 * @type {Record<string, {badgeClass: string, label: string}>}
 */
const PRIORITY_CONFIG = {
  urgent:   { badgeClass: "badge badge-urgent",   label: "🔴 Urgente"     },
  progress: { badgeClass: "badge badge-progress", label: "🟡 En progreso" },
  optional: { badgeClass: "badge badge-optional", label: "🟢 Opcional"    },
};

// ─── Estado ──────────────────────────────────────────────────────────────────

/** @type {Task[]} */
let tasks = loadTasksFromStorage();

/** @type {string} */
let activeFilter = FILTER_VALUES.ALL;

/** @type {boolean} */
let statsOpen = false;

// ─── Tipos ───────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Task
 * @property {string}      id          - Identificador único
 * @property {string}      text        - Texto de la tarea
 * @property {string}      category    - Categoría seleccionada
 * @property {string}      priority    - "urgent" | "progress" | "optional"
 * @property {boolean}     completed   - Estado de completado
 * @property {number}      createdAt   - Timestamp de creación
 * @property {number|null} completedAt - Timestamp de completado (null si pendiente)
 */

// ─── Persistencia ────────────────────────────────────────────────────────────

function loadTasksFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || [];
  } catch {
    console.warn("TaskFlow: no se pudo parsear el storage.");
    return [];
  }
}

function persistTasks() {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

/**
 * Carga el historial de completados por día { "YYYY-MM-DD": count }.
 * @returns {Record<string, number>}
 */
function loadCompletedDays() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_DAYS)) || {};
  } catch {
    return {};
  }
}

/**
 * @param {Record<string, number>} data
 */
function persistCompletedDays(data) {
  localStorage.setItem(STORAGE_KEYS.COMPLETED_DAYS, JSON.stringify(data));
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

/**
 * Devuelve "YYYY-MM-DD" para un timestamp dado (o hoy si se omite).
 * @param {number} [ts]
 * @returns {string}
 */
function dateKey(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toISOString().slice(0, 10);
}

/**
 * Nombre corto del día en español para un dateKey.
 * @param {string} key
 * @returns {string}
 */
function shortDayName(key) {
  const names = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return names[new Date(key + "T12:00:00").getDay()];
}

// ─── Creación de tareas ───────────────────────────────────────────────────────

function generateTaskId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function validateTaskInput(text) {
  const input    = document.getElementById("taskInput");
  const errorMsg = document.getElementById("inputError");
  const isValid  = text.length > 0 && text.length <= 120;
  input.classList.toggle("error", !isValid);
  errorMsg.style.display = isValid ? "none" : "block";
  return isValid;
}

function handleAddTask() {
  const input = document.getElementById("taskInput");
  const text  = input.value.trim();
  if (!validateTaskInput(text)) { input.focus(); return; }

  /** @type {Task} */
  const newTask = {
    id:          generateTaskId(),
    text,
    category:    document.getElementById("categorySelector").value,
    priority:    document.getElementById("prioritySelector").value,
    completed:   false,
    createdAt:   Date.now(),
    completedAt: null,
  };

  tasks.push(newTask);
  input.value = "";
  input.classList.remove("error");
  document.getElementById("inputError").style.display = "none";

  persistTasks();
  renderTaskList();
  if (statsOpen) renderStats();
}

// ─── Mutaciones ───────────────────────────────────────────────────────────────

/**
 * Alterna completado y actualiza el historial diario.
 * @param {string} taskId
 */
function toggleTaskCompletion(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed   = !task.completed;
  task.completedAt = task.completed ? Date.now() : null;

  if (task.completed) {
    const days = loadCompletedDays();
    const key  = dateKey();
    days[key]  = (days[key] || 0) + 1;
    persistCompletedDays(days);
  }

  persistTasks();
  renderTaskList();
  if (statsOpen) renderStats();
}

/**
 * @param {string} taskId
 */
function deleteTask(taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  persistTasks();
  renderTaskList();
  if (statsOpen) renderStats();
}

/**
 * @param {string} taskId
 * @param {string} newText
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
 * Enter / blur → guarda · Escape → cancela
 *
 * @param {HTMLElement} textSpan
 * @param {Task}        task
 */
function enableInlineEdit(textSpan, task) {
  if (textSpan.querySelector("input")) return;

  const originalText = task.text;
  const editInput    = document.createElement("input");

  editInput.type      = "text";
  editInput.value     = originalText;
  editInput.maxLength = 120;
  editInput.className = "field edit-inline-input";
  editInput.setAttribute("aria-label", "Editar tarea");

  textSpan.textContent = "";
  textSpan.appendChild(editInput);
  textSpan.classList.add("editing");

  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  function saveEdit() {
    const newText = editInput.value.trim();
    if (newText && newText !== originalText) updateTaskText(task.id, newText);
    textSpan.classList.remove("editing");
    textSpan.textContent = escapeHTML(newText || originalText);
  }

  function cancelEdit() {
    textSpan.classList.remove("editing");
    textSpan.textContent = escapeHTML(originalText);
  }

  editInput.addEventListener("keydown", e => {
    if (e.key === "Enter")  { e.preventDefault(); saveEdit();   }
    if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
  });
  editInput.addEventListener("blur", saveEdit, { once: true });
}

// ─── Filtrado ────────────────────────────────────────────────────────────────

function getFilteredTasks() {
  switch (activeFilter) {
    case FILTER_VALUES.PENDING:   return tasks.filter(t => !t.completed);
    case FILTER_VALUES.COMPLETED: return tasks.filter(t =>  t.completed);
    default:                      return [...tasks];
  }
}

// ─── Estadísticas ─────────────────────────────────────────────────────────────

/** @returns {number} Tareas completadas hoy */
function countCompletedToday() {
  const today = dateKey();
  return tasks.filter(t => t.completed && t.completedAt && dateKey(t.completedAt) === today).length;
}

/** @returns {number} Racha de días consecutivos con ≥1 completada */
function calcStreak() {
  const days  = loadCompletedDays();
  const today = new Date();
  let streak  = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days[key] && days[key] > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

/**
 * Datos de los últimos 7 días para el gráfico.
 * @returns {{ key: string, label: string, count: number }[]}
 */
function buildWeekData() {
  const days   = loadCompletedDays();
  const today  = new Date();
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d   = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ key, label: shortDayName(key), count: days[key] || 0 });
  }
  return result;
}

/** @returns {number} Tasa de completado global 0-100 */
function calcCompletionRate() {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
}

/**
 * Renderiza el contenido del panel de estadísticas en #statsPanel.
 */
function renderStats() {
  const panel = document.getElementById("statsPanel");
  if (!panel) return;

  const today    = countCompletedToday();
  const streak   = calcStreak();
  const weekData = buildWeekData();
  const rate     = calcCompletionRate();
  const maxCount = Math.max(...weekData.map(d => d.count), 1);
  const todayKey = dateKey();

  const barsHTML = weekData.map(d => {
    const heightPct = Math.round((d.count / maxCount) * 100);
    const isToday   = d.key === todayKey;
    return `
      <div class="stats-bar-col">
        <span class="stats-bar-count">${d.count > 0 ? d.count : ""}</span>
        <div class="stats-bar-track">
          <div class="stats-bar-fill${isToday ? " today" : ""}"
               style="height:${heightPct}%"
               title="${d.count} completada(s)"></div>
        </div>
        <span class="stats-bar-label${isToday ? " today" : ""}">${d.label}</span>
      </div>`;
  }).join("");

  panel.innerHTML = `
    <div class="stats-kpis">
      <div class="stats-kpi">
        <span class="stats-kpi-value">${today}</span>
        <span class="stats-kpi-label">Hoy</span>
      </div>
      <div class="stats-kpi-divider"></div>
      <div class="stats-kpi">
        <span class="stats-kpi-value">${streak > 0 ? "🔥&nbsp;" : ""}${streak}</span>
        <span class="stats-kpi-label">Racha (días)</span>
      </div>
      <div class="stats-kpi-divider"></div>
      <div class="stats-kpi">
        <span class="stats-kpi-value">${rate}%</span>
        <span class="stats-kpi-label">Completado</span>
      </div>
    </div>

    <p class="stats-chart-label">Últimos 7 días</p>
    <div class="stats-chart">${barsHTML}</div>

    <div class="stats-progress-wrap">
      <div class="stats-progress-track">
        <div class="stats-progress-fill" style="width:${rate}%"></div>
      </div>
      <span class="stats-progress-text">
        ${tasks.filter(t => t.completed).length} / ${tasks.length} tareas completadas
      </span>
    </div>
  `;
}

/**
 * Abre o cierra el panel de estadísticas.
 */
function toggleStats() {
  statsOpen = !statsOpen;
  const panel = document.getElementById("statsPanel");
  const btn   = document.getElementById("statsBtn");
  const icon  = document.getElementById("statsIcon");

  panel.classList.toggle("open", statsOpen);
  btn.classList.toggle("active", statsOpen);
  icon.textContent = statsOpen ? "▲" : "📊";

  if (statsOpen) renderStats();
}

// ─── Renderizado de lista ─────────────────────────────────────────────────────

function buildBadgesHTML(task) {
  const { badgeClass, label } = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.optional;
  return `
    <span class="badge badge-cat">${task.category}</span>
    <span class="${badgeClass}">${label}</span>
  `;
}

/** @param {Task} task @returns {HTMLLIElement} */
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task-item${task.completed ? " done" : ""}`;
  li.setAttribute("role", "listitem");
  li.dataset.id = task.id;

  li.innerHTML = `
    <div class="flex flex-col gap-1 min-w-0">
      <span class="task-text font-medium text-sm leading-snug truncate"
            title="Doble clic para editar">${escapeHTML(task.text)}</span>
      <div class="flex flex-wrap gap-1">${buildBadgesHTML(task)}</div>
    </div>
    <div class="flex gap-1 flex-shrink-0 mt-0.5">
      <button class="task-action btn-complete"
              aria-label="Marcar como ${task.completed ? "pendiente" : "completada"}">✔</button>
      <button class="task-action btn-delete" aria-label="Eliminar tarea">✖</button>
    </div>
  `;

  const textSpan = li.querySelector(".task-text");
  textSpan.addEventListener("dblclick", () => {
    if (!task.completed) enableInlineEdit(textSpan, task);
  });

  li.querySelector(".btn-complete").addEventListener("click", () => toggleTaskCompletion(task.id));
  li.querySelector(".btn-delete").addEventListener("click",   () => deleteTask(task.id));

  return li;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
      requestAnimationFrame(() => requestAnimationFrame(() => li.classList.add("show")));
    });
  }

  taskCounter.textContent = tasks.filter(t => !t.completed).length;
}

// ─── Filtros ─────────────────────────────────────────────────────────────────

function applyFilter(filterValue) {
  activeFilter = filterValue;
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filterValue);
  });
  renderTaskList();
}

// ─── Dark mode ───────────────────────────────────────────────────────────────

function applyDarkMode(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  document.getElementById("darkIcon").textContent  = isDark ? "☀️" : "🌙";
  document.getElementById("darkLabel").textContent = isDark ? "Día"  : "Noche";
  localStorage.setItem(STORAGE_KEYS.DARK_MODE, isDark);
}

function toggleDarkMode() {
  applyDarkMode(!document.documentElement.classList.contains("dark"));
}

// ─── Inicialización ───────────────────────────────────────────────────────────

function init() {
  applyDarkMode(localStorage.getItem(STORAGE_KEYS.DARK_MODE) === "true");

  document.getElementById("addBtn").addEventListener("click", handleAddTask);

  document.getElementById("taskInput").addEventListener("keydown", e => {
    if (e.key === "Enter") handleAddTask();
  });

  document.getElementById("taskInput").addEventListener("input", () => {
    const input = document.getElementById("taskInput");
    if (input.classList.contains("error") && input.value.trim()) {
      input.classList.remove("error");
      document.getElementById("inputError").style.display = "none";
    }
  });

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
  });

  document.getElementById("darkModeBtn").addEventListener("click", toggleDarkMode);
  document.getElementById("statsBtn").addEventListener("click", toggleStats);

  renderTaskList();
}

document.addEventListener("DOMContentLoaded", init);
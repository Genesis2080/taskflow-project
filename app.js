/**
 * @fileoverview TaskFlow – Gestor de Tareas (Fase D)
 *
 * Cambios respecto a la versión anterior:
 *  - Eliminado localStorage de tareas (las tareas viven en el servidor)
 *  - Las tareas se cargan desde la API al arrancar (fetchTasks)
 *  - handleAddTask, deleteTask y toggleTaskCompletion son async
 *  - Tres estados de red: carga (spinner), éxito (lista), error (banner)
 *  - Se mantiene localStorage solo para darkMode y completedDays
 */

"use strict";

// ─── Constantes ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  // TASKS eliminado: las tareas ahora viven en el servidor
  DARK_MODE:      "taskflow_darkMode",
  COMPLETED_DAYS: "taskflow_completedDays",
};

const FILTER_VALUES = { ALL: "all", PENDING: "pending", COMPLETED: "completed" };

/** @type {Record<string,{badgeClass:string,label:string}>} */
const PRIORITY_CONFIG = {
  urgent:   { badgeClass: "badge badge-urgent",   label: "🔴 Urgente"     },
  progress: { badgeClass: "badge badge-progress", label: "🟡 En progreso" },
  optional: { badgeClass: "badge badge-optional", label: "🟢 Opcional"    },
};

const DUE_STATUS = {
  OVERDUE:  "overdue",
  CRITICAL: "critical",
  WARNING:  "warning",
  OK:       "ok",
};

const UNDO_TIMEOUT_MS = 5000;

// ─── Estado ──────────────────────────────────────────────────────────────────

/** @type {Task[]} Cargado desde el servidor, no desde localStorage */
let tasks = [];

/** @type {string} */
let activeFilter = FILTER_VALUES.ALL;

/** @type {boolean} */
let statsOpen = false;

/** @type {AudioContext|null} */
let audioCtx = null;

/**
 * @type {{ tasks: Task[], index?: number, timerId: number } | null}
 */
let pendingUndo = null;

// ─── Tipos ───────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Task
 * @property {string}      id
 * @property {string}      text
 * @property {string}      category
 * @property {string}      priority
 * @property {boolean}     completed
 * @property {number}      createdAt
 * @property {number|null} completedAt
 * @property {string|null} dueDate
 */

// ─── Capa de red (client.js inline) ──────────────────────────────────────────
// Si prefieres, mueve estas funciones a src/api/client.js y carga ese archivo
// con <script src="src/api/client.js"> antes de app.js en el HTML.

const API_URL = "http://localhost:3000/api/v1/tasks";

/**
 * Obtiene todas las tareas del servidor.
 * @returns {Promise<Task[]>}
 */
async function apiFetchTasks() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`Error al obtener tareas: ${response.status}`);
  return response.json();
}

/**
 * Crea una tarea en el servidor.
 * @param {Object} taskData
 * @returns {Promise<Task>}
 */
async function apiCreateTask(taskData) {
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
async function apiDeleteTask(id) {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    const err = await response.json();
    throw new Error(err.error || "Error al eliminar la tarea");
  }
}

// ─── Estados de red ───────────────────────────────────────────────────────────

/**
 * Muestra u oculta el spinner de carga sobre la lista.
 * @param {boolean} isLoading
 */
function setLoadingState(isLoading) {
  const taskList = document.getElementById("taskList");
  const loader   = document.getElementById("loadingIndicator");
  taskList.style.opacity = isLoading ? "0.4" : "1";
  loader.style.display   = isLoading ? "flex" : "none";
}

/**
 * Muestra un banner de error de red durante 5 segundos.
 * @param {string} message
 */
function showNetworkError(message) {
  const banner = document.getElementById("networkError");
  banner.textContent = `⚠️ ${message}`;
  banner.classList.add("show");
  setTimeout(() => banner.classList.remove("show"), 5000);
}

// ─── Persistencia local (solo estadísticas y tema) ────────────────────────────

/** @returns {Record<string,number>} */
function loadCompletedDays() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_DAYS)) || {};
  } catch { return {}; }
}

/** @param {Record<string,number>} data */
function persistCompletedDays(data) {
  localStorage.setItem(STORAGE_KEYS.COMPLETED_DAYS, JSON.stringify(data));
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

/** @param {number} [ts] @returns {string} */
function dateKey(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toISOString().slice(0, 10);
}

/** @param {string} key @returns {string} */
function shortDayName(key) {
  const names = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return names[new Date(key + "T12:00:00").getDay()];
}

/** @param {string} dueDateStr @returns {number} */
function daysUntilDue(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + "T00:00:00");
  return Math.round((due - today) / 86_400_000);
}

/** @param {number} days @returns {string} */
function getDueStatus(days) {
  if (days < 0)  return DUE_STATUS.OVERDUE;
  if (days <= 1) return DUE_STATUS.CRITICAL;
  if (days <= 6) return DUE_STATUS.WARNING;
  return DUE_STATUS.OK;
}

/** @param {string} dueDateStr @returns {{ label:string, statusClass:string }} */
function buildDueBadgeInfo(dueDateStr) {
  const days   = daysUntilDue(dueDateStr);
  const status = getDueStatus(days);
  let label;
  if (days < 0)        label = `Vencida hace ${Math.abs(days)}d`;
  else if (days === 0) label = "Vence hoy";
  else if (days === 1) label = "Vence mañana";
  else                 label = `${days}d restantes`;
  return { label, statusClass: `badge-due badge-due-${status}` };
}

// ─── Audio ────────────────────────────────────────────────────────────────────

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playNote(ctx, frequency, startTime, duration, peakGain, type = "sine") {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  const attack  = 0.012;
  const release = duration * 0.55;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + attack);
  gain.gain.setValueAtTime(peakGain, startTime + duration - release);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playCompleteSound() {
  try {
    const ctx = getAudioContext();
    const t   = ctx.currentTime;
    const v   = 0.18;
    playNote(ctx, 523.25, t,        0.28, v,        "triangle");
    playNote(ctx, 659.25, t + 0.07, 0.26, v * 0.90, "triangle");
    playNote(ctx, 783.99, t + 0.14, 0.30, v * 0.85, "triangle");
    playNote(ctx, 1046.5, t + 0.22, 0.18, v * 0.45, "sine");
  } catch (e) { console.warn("TaskFlow: playCompleteSound", e); }
}

function playUncompleteSound() {
  try {
    const ctx = getAudioContext();
    const t   = ctx.currentTime;
    const v   = 0.10;
    playNote(ctx, 440,    t,        0.20, v,        "sine");
    playNote(ctx, 349.23, t + 0.10, 0.20, v * 0.75, "sine");
  } catch (e) { console.warn("TaskFlow: playUncompleteSound", e); }
}

function playCompleteAllSound() {
  try {
    const ctx = getAudioContext();
    const t   = ctx.currentTime;
    const v   = 0.15;
    playNote(ctx, 523.25, t,        0.22, v,        "triangle");
    playNote(ctx, 659.25, t + 0.05, 0.22, v * 0.9,  "triangle");
    playNote(ctx, 783.99, t + 0.10, 0.22, v * 0.85, "triangle");
    playNote(ctx, 1046.5, t + 0.16, 0.30, v * 0.7,  "triangle");
    playNote(ctx, 1318.5, t + 0.22, 0.38, v * 0.55, "sine");
  } catch (e) { console.warn("TaskFlow: playCompleteAllSound", e); }
}

// ─── Validación del formulario ────────────────────────────────────────────────

function validateTaskInput(text) {
  const input    = document.getElementById("taskInput");
  const errorMsg = document.getElementById("inputError");
  const isValid  = text.length > 0 && text.length <= 120;
  input.classList.toggle("error", !isValid);
  errorMsg.style.display = isValid ? "none" : "block";
  return isValid;
}

// ─── Añadir tarea (async) ─────────────────────────────────────────────────────

async function handleAddTask() {
  const input = document.getElementById("taskInput");
  const text  = input.value.trim();
  if (!validateTaskInput(text)) { input.focus(); return; }

  const dueDateRaw = document.getElementById("dueDateInput").value;

  try {
    setLoadingState(true);

    const newTask = await apiCreateTask({
      text,
      category:  document.getElementById("categorySelector").value,
      priority:  document.getElementById("prioritySelector").value,
      dueDate:   dueDateRaw || null,
      completed: false,
    });

    tasks.push(newTask);
    input.value = "";
    document.getElementById("dueDateInput").value = "";
    input.classList.remove("error");
    document.getElementById("inputError").style.display = "none";

    renderTaskList();
    updateBulkButtons();
    if (statsOpen) renderStats();

  } catch (err) {
    showNetworkError(err.message);
  } finally {
    setLoadingState(false);
  }
}

// ─── Completar tarea (local, sin endpoint PUT por ahora) ──────────────────────

function toggleTaskCompletion(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed   = !task.completed;
  task.completedAt = task.completed ? Date.now() : null;

  if (task.completed) {
    playCompleteSound();
    const days = loadCompletedDays();
    const key  = dateKey();
    days[key]  = (days[key] || 0) + 1;
    persistCompletedDays(days);
  } else {
    playUncompleteSound();
  }

  renderTaskList();
  updateBulkButtons();
  if (statsOpen) renderStats();
}

// ─── Completar todas ──────────────────────────────────────────────────────────

function completeAllTasks() {
  const pending = tasks.filter(t => !t.completed);
  if (pending.length === 0) return;

  const now  = Date.now();
  const days = loadCompletedDays();
  const key  = dateKey();

  pending.forEach(task => {
    task.completed   = true;
    task.completedAt = now;
    days[key] = (days[key] || 0) + 1;
  });

  persistCompletedDays(days);
  playCompleteAllSound();
  renderTaskList();
  updateBulkButtons();
  if (statsOpen) renderStats();
}

// ─── Eliminar tarea (async) ───────────────────────────────────────────────────

async function deleteTask(taskId) {
  if (pendingUndo) commitDelete();

  const index = tasks.findIndex(t => t.id === taskId);
  if (index === -1) return;

  const [removedTask] = tasks.splice(index, 1);

  try {
    await apiDeleteTask(removedTask.id);
  } catch (err) {
    // El servidor falló: revertimos el borrado local
    tasks.splice(index, 0, removedTask);
    showNetworkError(err.message);
    renderTaskList();
    return;
  }

  const timerId = setTimeout(commitDelete, UNDO_TIMEOUT_MS);
  pendingUndo   = { tasks: [removedTask], index, timerId };

  renderTaskList();
  updateBulkButtons();
  if (statsOpen) renderStats();

  const preview = removedTask.text.length > 32
    ? removedTask.text.slice(0, 32) + "…"
    : removedTask.text;
  showUndoToast(`"${preview}" eliminada`);
}

// ─── Eliminar todas (async) ───────────────────────────────────────────────────

async function deleteAllTasks() {
  if (tasks.length === 0) return;
  if (pendingUndo) commitDelete();

  const snapshot = [...tasks];
  tasks = [];

  // Eliminar cada tarea en el servidor en paralelo
  try {
    await Promise.all(snapshot.map(t => apiDeleteTask(t.id)));
  } catch (err) {
    // Si alguna falla, restauramos todo
    tasks = snapshot;
    showNetworkError("No se pudieron eliminar todas las tareas.");
    renderTaskList();
    return;
  }

  const timerId = setTimeout(commitDelete, UNDO_TIMEOUT_MS);
  pendingUndo   = { tasks: snapshot, timerId };

  renderTaskList();
  updateBulkButtons();
  if (statsOpen) renderStats();
  showUndoToast(`${snapshot.length} tarea${snapshot.length !== 1 ? "s" : ""} eliminada${snapshot.length !== 1 ? "s" : ""}`);
}

// ─── Undo ─────────────────────────────────────────────────────────────────────

function commitDelete() {
  if (!pendingUndo) return;
  clearTimeout(pendingUndo.timerId);
  pendingUndo = null;
  hideUndoToast();
}

async function undoDelete() {
  if (!pendingUndo) return;
  clearTimeout(pendingUndo.timerId);

  const { tasks: restoredTasks, index } = pendingUndo;
  pendingUndo = null;

  try {
    // Recrear las tareas en el servidor
    const recreated = await Promise.all(
      restoredTasks.map(t => apiCreateTask({
        text:      t.text,
        category:  t.category,
        priority:  t.priority,
        dueDate:   t.dueDate,
        completed: t.completed,
      }))
    );

    if (typeof index === "number") {
      tasks.splice(index, 0, recreated[0]);
    } else {
      tasks = recreated;
    }
  } catch (err) {
    showNetworkError("No se pudo deshacer la eliminación.");
  }

  renderTaskList();
  updateBulkButtons();
  if (statsOpen) renderStats();
  hideUndoToast();
}

function showUndoToast(message) {
  const toast = document.getElementById("undoToast");
  const msg   = document.getElementById("undoMsg");
  const bar   = document.getElementById("undoProgressBar");

  msg.textContent = message;

  bar.style.transition = "none";
  bar.style.width      = "100%";
  bar.getBoundingClientRect();
  bar.style.transition = `width ${UNDO_TIMEOUT_MS}ms linear`;
  bar.style.width      = "0%";

  toast.classList.add("show");
}

function hideUndoToast() {
  document.getElementById("undoToast").classList.remove("show");
}

// ─── Botones de acción masiva ─────────────────────────────────────────────────

function updateBulkButtons() {
  const hasTasks   = tasks.length > 0;
  const hasPending = tasks.some(t => !t.completed);
  document.getElementById("completeAllBtn").classList.toggle("hidden", !hasPending);
  document.getElementById("deleteAllBtn").classList.toggle("hidden", !hasTasks);
}

// ─── Edición inline ───────────────────────────────────────────────────────────

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
    if (newText && newText !== originalText) {
      const t = tasks.find(t => t.id === task.id);
      if (t) t.text = newText;
    }
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

function countCompletedToday() {
  const today = dateKey();
  return tasks.filter(t => t.completed && t.completedAt && dateKey(t.completedAt) === today).length;
}

function calcStreak() {
  const days  = loadCompletedDays();
  const today = new Date();
  let streak  = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days[key] && days[key] > 0) { streak++; }
    else if (i > 0) { break; }
  }
  return streak;
}

function buildWeekData() {
  const days   = loadCompletedDays();
  const today  = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ key, label: shortDayName(key), count: days[key] || 0 });
  }
  return result;
}

function calcCompletionRate() {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
}

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

  let dueBadge = "";
  if (task.dueDate && !task.completed) {
    const { label: dueLabel, statusClass } = buildDueBadgeInfo(task.dueDate);
    const isOverdue = getDueStatus(daysUntilDue(task.dueDate)) === DUE_STATUS.OVERDUE;
    dueBadge = `<span class="${statusClass}${isOverdue ? " pulse" : ""}"
                      aria-label="Fecha límite: ${dueLabel}">📅 ${dueLabel}</span>`;
  } else if (task.dueDate && task.completed) {
    dueBadge = `<span class="badge badge-due badge-due-done">📅 ${task.dueDate}</span>`;
  }

  return `
    <span class="badge badge-cat">${task.category}</span>
    <span class="${badgeClass}">${label}</span>
    ${dueBadge}
  `;
}

function getDueBorderClass(task) {
  if (!task.dueDate || task.completed) return "";
  return `due-border-${getDueStatus(daysUntilDue(task.dueDate))}`;
}

function createTaskElement(task) {
  const li             = document.createElement("li");
  const dueBorderClass = getDueBorderClass(task);
  li.className = `task-item${task.completed ? " done" : ""}${dueBorderClass ? " " + dueBorderClass : ""}`;
  li.setAttribute("role", "listitem");
  li.dataset.id = task.id;

  li.innerHTML = `
    <div class="flex flex-col gap-1 min-w-0">
      <span class="task-text font-medium text-sm leading-snug"
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

async function init() {
  applyDarkMode(localStorage.getItem(STORAGE_KEYS.DARK_MODE) === "true");

  // Carga inicial de tareas desde el servidor
  try {
    setLoadingState(true);
    tasks = await apiFetchTasks();
  } catch (err) {
    showNetworkError("No se pudo conectar con el servidor.");
  } finally {
    setLoadingState(false);
  }

  renderTaskList();
  updateBulkButtons();

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
  document.getElementById("undoBtn").addEventListener("click", undoDelete);
  document.getElementById("completeAllBtn").addEventListener("click", completeAllTasks);
  document.getElementById("deleteAllBtn").addEventListener("click", deleteAllTasks);

  document.addEventListener("click", () => getAudioContext(), { once: true });
}

document.addEventListener("DOMContentLoaded", init);
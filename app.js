/**
 * @fileoverview TaskFlow – Gestor de Tareas
 *
 * Funcionalidades acumuladas:
 *  - Gestión de tareas (añadir, completar, eliminar)
 *  - Filtros (todas, pendientes, completadas)
 *  - Persistencia en localStorage
 *  - Dark mode
 *  - Edición inline con doble clic (Enter/blur guarda · Escape cancela)
 *  - Panel de estadísticas de productividad (desplegable)
 *  - Fechas límite con alertas visuales
 *  - Sonido de completado (Web Audio API, sin dependencias)
 *      · Acorde mayor ascendente (Do-Mi-Sol) al marcar completada
 *      · Descenso suave de dos notas al desmarcar
 *      · AudioContext precalentado en el primer clic del usuario
 */

"use strict";

// ─── Constantes ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  TASKS:          "taskflow_tasks",
  DARK_MODE:      "taskflow_darkMode",
  COMPLETED_DAYS: "taskflow_completedDays",
};

const FILTER_VALUES = { ALL: "all", PENDING: "pending", COMPLETED: "completed" };

/** @type {Record<string, {badgeClass:string, label:string}>} */
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

// ─── Estado ──────────────────────────────────────────────────────────────────

/** @type {Task[]} */
let tasks = loadTasksFromStorage();

/** @type {string} */
let activeFilter = FILTER_VALUES.ALL;

/** @type {boolean} */
let statsOpen = false;

/** @type {AudioContext|null} Se inicializa tras el primer gesto del usuario */
let audioCtx = null;

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
 * @property {string|null} dueDate     - "YYYY-MM-DD" o null
 */

// ─── Persistencia ────────────────────────────────────────────────────────────

function loadTasksFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || [];
  } catch {
    console.warn("TaskFlow: error al leer el storage.");
    return [];
  }
}

function persistTasks() {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

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

/**
 * Devuelve el AudioContext, creándolo si aún no existe.
 * Los navegadores requieren que se instancie tras un gesto del usuario.
 * @returns {AudioContext}
 */
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

/**
 * Toca una nota con envolvente ADSR sencilla.
 *
 * @param {AudioContext}                              ctx
 * @param {number}                                    frequency  - Hz
 * @param {number}                                    startTime  - segundos desde ctx.currentTime
 * @param {number}                                    duration   - segundos totales
 * @param {number}                                    peakGain   - volumen pico (0–1)
 * @param {"sine"|"triangle"|"square"|"sawtooth"}    [type]
 */
function playNote(ctx, frequency, startTime, duration, peakGain, type = "sine") {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  // Attack corto → sustain breve → release exponencial
  const attack  = 0.012;
  const release = duration * 0.55;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + attack);
  gain.gain.setValueAtTime(peakGain, startTime + duration - release);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * Sonido de tarea COMPLETADA.
 * Acorde Do mayor arpegiado (Do5 → Mi5 → Sol5) con brillo final en Do6.
 * Timbre cálido usando osciladores triangle.
 */
function playCompleteSound() {
  try {
    const ctx = getAudioContext();
    const t   = ctx.currentTime;
    const v   = 0.18;

    playNote(ctx, 523.25, t,        0.28, v,         "triangle"); // Do5
    playNote(ctx, 659.25, t + 0.07, 0.26, v * 0.90,  "triangle"); // Mi5
    playNote(ctx, 783.99, t + 0.14, 0.30, v * 0.85,  "triangle"); // Sol5
    playNote(ctx, 1046.5, t + 0.22, 0.18, v * 0.45,  "sine");     // Do6 (brillo)
  } catch (err) {
    console.warn("TaskFlow: error en playCompleteSound.", err);
  }
}

/**
 * Sonido de tarea DES-COMPLETADA.
 * Descenso de dos notas (La4 → Fa4), discreto y neutro.
 */
function playUncompleteSound() {
  try {
    const ctx = getAudioContext();
    const t   = ctx.currentTime;
    const v   = 0.10;

    playNote(ctx, 440,    t,        0.20, v,        "sine"); // La4
    playNote(ctx, 349.23, t + 0.10, 0.20, v * 0.75, "sine"); // Fa4
  } catch (err) {
    console.warn("TaskFlow: error en playUncompleteSound.", err);
  }
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
  const input      = document.getElementById("taskInput");
  const text       = input.value.trim();
  if (!validateTaskInput(text)) { input.focus(); return; }

  const dueDateRaw = document.getElementById("dueDateInput").value;

  /** @type {Task} */
  const newTask = {
    id:          generateTaskId(),
    text,
    category:    document.getElementById("categorySelector").value,
    priority:    document.getElementById("prioritySelector").value,
    completed:   false,
    createdAt:   Date.now(),
    completedAt: null,
    dueDate:     dueDateRaw || null,
  };

  tasks.push(newTask);
  input.value = "";
  document.getElementById("dueDateInput").value = "";
  input.classList.remove("error");
  document.getElementById("inputError").style.display = "none";

  persistTasks();
  renderTaskList();
  if (statsOpen) renderStats();
}

// ─── Mutaciones ───────────────────────────────────────────────────────────────

/** @param {string} taskId */
function toggleTaskCompletion(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed   = !task.completed;
  task.completedAt = task.completed ? Date.now() : null;

  // ── Sonido según dirección ────────────────────────────────
  if (task.completed) {
    playCompleteSound();
    const days = loadCompletedDays();
    const key  = dateKey();
    days[key]  = (days[key] || 0) + 1;
    persistCompletedDays(days);
  } else {
    playUncompleteSound();
  }

  persistTasks();
  renderTaskList();
  if (statsOpen) renderStats();
}

/** @param {string} taskId */
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

/** @returns {{ key:string, label:string, count:number }[]} */
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

/** @param {Task} task @returns {string} */
function buildBadgesHTML(task) {
  const { badgeClass, label } = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.optional;

  let dueBadge = "";
  if (task.dueDate && !task.completed) {
    const { label: dueLabel, statusClass } = buildDueBadgeInfo(task.dueDate);
    const isOverdue = getDueStatus(daysUntilDue(task.dueDate)) === DUE_STATUS.OVERDUE;
    dueBadge = `<span class="${statusClass}${isOverdue ? " pulse" : ""}"
                      aria-label="Fecha límite: ${dueLabel}">
                  📅 ${dueLabel}
                </span>`;
  } else if (task.dueDate && task.completed) {
    dueBadge = `<span class="badge badge-due badge-due-done">📅 ${task.dueDate}</span>`;
  }

  return `
    <span class="badge badge-cat">${task.category}</span>
    <span class="${badgeClass}">${label}</span>
    ${dueBadge}
  `;
}

/** @param {Task} task @returns {string} */
function getDueBorderClass(task) {
  if (!task.dueDate || task.completed) return "";
  return `due-border-${getDueStatus(daysUntilDue(task.dueDate))}`;
}

/** @param {Task} task @returns {HTMLLIElement} */
function createTaskElement(task) {
  const li             = document.createElement("li");
  const dueBorderClass = getDueBorderClass(task);
  li.className = `task-item${task.completed ? " done" : ""}${dueBorderClass ? " " + dueBorderClass : ""}`;
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

  // Precalentar el AudioContext con el primer clic en el documento,
  // evita el delay perceptible en la primera reproducción.
  document.addEventListener("click", () => getAudioContext(), { once: true });

  renderTaskList();
}

document.addEventListener("DOMContentLoaded", init);
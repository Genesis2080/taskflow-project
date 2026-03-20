/**
 * @fileoverview TaskFlow – app.js
 * Orquestador principal adaptado al layout de sidebar.
 */

import { apiFetchTasks, apiCreateTask, apiDeleteTask } from "./src/api/client.js";
import { getAudioContext, playCompleteSound, playUncompleteSound, playCompleteAllSound } from "./src/audio/sounds.js";
import { dateKey, countCompletedToday, calcStreak, buildWeekData, calcCompletionRate } from "./src/services/stats.service.js";
import { showUndoToast } from "./src/ui/toast.js";

// ─── Estado ──────────────────────────────────────────────────────────────────

/** @type {Task[]} */
let tasks = [];

/** @type {"all"|"pending"|"completed"} vista activa */
let activeView = "all";

/** @type {string|null} filtro de categoría activo */
let activeCat = null;

/** @type {"all"|"pending"|"completed"} filtro de estado en la lista */
let activeFilter = "all";

/** @type {{ tasks: Task[], index?: number, cancel: Function } | null} */
let pendingUndo = null;

const COMPLETED_DAYS_KEY = "taskflow_completedDays";
const DARK_MODE_KEY      = "taskflow_darkMode";

// ─── Persistencia local ───────────────────────────────────────────────────────

function loadCompletedDays() {
  try { return JSON.parse(localStorage.getItem(COMPLETED_DAYS_KEY)) || {}; }
  catch { return {}; }
}
function persistCompletedDays(data) {
  localStorage.setItem(COMPLETED_DAYS_KEY, JSON.stringify(data));
}

// ─── Dark mode ────────────────────────────────────────────────────────────────

function applyDarkMode(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  const icon  = document.getElementById("darkIcon");
  const label = document.getElementById("darkLabel");
  if (isDark) {
    icon.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M7.5 1V2.5M7.5 12.5V14M1 7.5H2.5M12.5 7.5H14M3.1 3.1L4.2 4.2M10.8 10.8L11.9 11.9M11.9 3.1L10.8 4.2M4.2 10.8L3.1 11.9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
    label.textContent = "Modo día";
  } else {
    icon.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12.5 9.5A5.5 5.5 0 015.5 2.5a5.5 5.5 0 100 10 5.5 5.5 0 007-3z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
    label.textContent = "Modo noche";
  }
  localStorage.setItem(DARK_MODE_KEY, isDark);
}

function toggleDarkMode() {
  applyDarkMode(!document.documentElement.classList.contains("dark"));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function daysUntilDue(dueDateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dueDateStr + "T00:00:00");
  return Math.round((due - today) / 86_400_000);
}

function getDueStatus(days) {
  if (days < 0)  return "overdue";
  if (days <= 1) return "critical";
  if (days <= 6) return "warning";
  return "ok";
}

function getTasksForList() {
  let list = activeCat
    ? tasks.filter(t => t.category === activeCat)
    : [...tasks];
  if (activeFilter === "pending")   list = list.filter(t => !t.completed);
  if (activeFilter === "completed") list = list.filter(t =>  t.completed);
  return list;
}

// ─── Actualizar UI ────────────────────────────────────────────────────────────

function updateBadges() {
  document.getElementById("badge-all").textContent     = tasks.length;
  document.getElementById("badge-pending").textContent = tasks.filter(t => !t.completed).length;
  ["Trabajo","Personal","Estudio","General"].forEach(cat => {
    const el = document.getElementById(`cat-${cat}`);
    if (el) el.textContent = tasks.filter(t => t.category === cat).length;
  });
}

function updateStats() {
  const total    = tasks.length;
  const pending  = tasks.filter(t => !t.completed).length;
  const done     = total - pending;
  const rate     = total > 0 ? Math.round((done / total) * 100) : 0;
  const days     = loadCompletedDays();
  const streak   = calcStreak(days);

  document.getElementById("statTotal").textContent   = total;
  document.getElementById("statPending").textContent = pending;
  document.getElementById("statDone").textContent    = done;
  document.getElementById("statProgress").style.width = `${rate}%`;
  document.getElementById("statStreak").textContent  = streak > 0 ? `🔥 ${streak}` : streak;

  const completeAllBtn = document.getElementById("completeAllBtn");
  const deleteAllBtn   = document.getElementById("deleteAllBtn");
  completeAllBtn.style.display = tasks.some(t => !t.completed) ? "flex" : "none";
  deleteAllBtn.style.display   = tasks.length > 0 ? "flex" : "none";
}

function setLoadingState(isLoading) {
  const list   = document.getElementById("taskList");
  const loader = document.getElementById("loadingIndicator");
  list.style.opacity    = isLoading ? "0.4" : "1";
  loader.style.display  = isLoading ? "flex" : "none";
}

function showNetworkError(message) {
  const banner = document.getElementById("networkError");
  banner.textContent = `⚠️ ${message}`;
  banner.classList.add("show");
  setTimeout(() => banner.classList.remove("show"), 5000);
}

// ─── Renderizado de lista ─────────────────────────────────────────────────────

function buildBadgesHTML(task) {
  const PRIORITY = {
    urgent:   { cls: "badge-urgent",   lbl: "🔴 Urgente"     },
    progress: { cls: "badge-progress", lbl: "🟡 En progreso" },
    optional: { cls: "badge-optional", lbl: "🟢 Opcional"    },
  };
  const p = PRIORITY[task.priority] || PRIORITY.optional;

  let dueBadge = "";
  if (task.dueDate && !task.completed) {
    const days   = daysUntilDue(task.dueDate);
    const status = getDueStatus(days);
    let label;
    if (days < 0)        label = `Vencida hace ${Math.abs(days)}d`;
    else if (days === 0) label = "Vence hoy";
    else if (days === 1) label = "Vence mañana";
    else                 label = `${days}d restantes`;
    const pulse = status === "overdue" ? " pulse" : "";
    dueBadge = `<span class="badge badge-due badge-due-${status}${pulse}">📅 ${label}</span>`;
  } else if (task.dueDate && task.completed) {
    dueBadge = `<span class="badge badge-due badge-due-done">📅 ${task.dueDate}</span>`;
  }

  return `
    <span class="badge badge-cat">${escapeHTML(task.category || "General")}</span>
    <span class="badge ${p.cls}">${p.lbl}</span>
    ${dueBadge}
  `;
}

function createTaskElement(task) {
  const li = document.createElement("li");
  const dueClass = (() => {
    if (!task.dueDate || task.completed) return "";
    return `due-border-${getDueStatus(daysUntilDue(task.dueDate))}`;
  })();

  li.className = `task-item${task.completed ? " done" : ""}${dueClass ? " " + dueClass : ""}`;
  li.dataset.id = task.id;

  li.innerHTML = `
    <div class="task-check${task.completed ? " done" : ""}" role="checkbox" aria-checked="${task.completed}" tabindex="0"></div>
    <div class="task-body">
      <div class="task-name">
        <span class="task-name-span" title="Doble clic para editar">${escapeHTML(task.text)}</span>
      </div>
      <div class="task-meta">${buildBadgesHTML(task)}</div>
    </div>
    <div class="task-actions">
      <button class="task-action-btn delete" aria-label="Eliminar tarea">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2L11 11M11 2L2 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
  `;

  li.querySelector(".task-check").addEventListener("click", () => toggleTaskCompletion(task.id));
  li.querySelector(".task-action-btn.delete").addEventListener("click", e => { e.stopPropagation(); deleteTask(task.id); });

  const nameSpan = li.querySelector(".task-name-span");
  nameSpan.addEventListener("dblclick", () => {
    if (!task.completed) enableInlineEdit(nameSpan, task);
  });

  return li;
}

function renderTaskList() {
  const ul     = document.getElementById("taskList");
  const list   = getTasksForList();
  ul.innerHTML = "";

  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.innerHTML = `<span class="emoji">📭</span><span>${
      activeFilter === "completed" ? "Todavía no has completado ninguna tarea." : "No hay tareas aquí. ¡Añade una!"
    }</span>`;
    ul.appendChild(li);
    return;
  }

  list.forEach(task => {
    const li = createTaskElement(task);
    ul.appendChild(li);
    requestAnimationFrame(() => requestAnimationFrame(() => li.classList.add("show")));
  });
}

function renderStatsPanel() {
  const panel = document.getElementById("statsPanel");
  const days  = loadCompletedDays();
  const rate  = calcCompletionRate(tasks);
  const weekData = buildWeekData(days);
  const maxCount = Math.max(...weekData.map(d => d.count), 1);
  const todayKey = dateKey();

  const barsHTML = weekData.map(d => {
    const h       = Math.round((d.count / maxCount) * 100);
    const isToday = d.key === todayKey;
    return `
      <div class="stats-bar-col">
        <span class="stats-bar-count">${d.count || ""}</span>
        <div class="stats-bar-track">
          <div class="stats-bar-fill${isToday ? " today" : ""}" style="height:${h}%"></div>
        </div>
        <span class="stats-bar-label${isToday ? " today" : ""}">${d.label}</span>
      </div>`;
  }).join("");

  panel.innerHTML = `
    <div class="stats-kpis">
      <div class="stats-kpi">
        <div class="stats-kpi-value">${countCompletedToday(tasks)}</div>
        <div class="stats-kpi-label">Hoy</div>
      </div>
      <div class="stats-kpi">
        <div class="stats-kpi-value">${calcStreak(days) > 0 ? "🔥 " : ""}${calcStreak(days)}</div>
        <div class="stats-kpi-label">Racha (días)</div>
      </div>
      <div class="stats-kpi">
        <div class="stats-kpi-value">${rate}%</div>
        <div class="stats-kpi-label">Completado</div>
      </div>
    </div>
    <div>
      <div class="stats-chart-label">Últimos 7 días</div>
      <div class="stats-chart">${barsHTML}</div>
    </div>
    <div class="stats-progress-wrap">
      <div class="stats-progress-track">
        <div class="stats-progress-fill" style="width:${rate}%"></div>
      </div>
      <span class="stats-progress-text">${tasks.filter(t=>t.completed).length} / ${tasks.length} completadas</span>
    </div>
  `;
}

function refresh() {
  renderTaskList();
  updateBadges();
  updateStats();
  if (activeView === "stats") renderStatsPanel();
}

// ─── Vistas del sidebar ───────────────────────────────────────────────────────

const VIEW_TITLES = {
  all:       "Todas las tareas",
  pending:   "Pendientes",
  completed: "Completadas",
  stats:     "Estadísticas",
};

function switchView(view) {
  activeView  = view;
  activeCat   = null;
  activeFilter = view === "stats" ? "all" : (view === "all" ? "all" : view);

  document.getElementById("topbarTitle").textContent = VIEW_TITLES[view] || view;

  // Nav items activos
  document.querySelectorAll(".nav-item[data-view]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  document.querySelectorAll(".cat-item").forEach(btn => btn.classList.remove("active"));

  // Filtros
  document.querySelectorAll(".filter-pill").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === (view === "stats" ? "all" : activeFilter));
  });

  // Mostrar / ocultar panels
  const taskList   = document.getElementById("taskList");
  const statsPanel = document.getElementById("statsPanel");
  const filterBar  = document.querySelector(".filter-bar");

  if (view === "stats") {
    taskList.style.display   = "none";
    statsPanel.style.display = "flex";
    filterBar.style.display  = "none";
    renderStatsPanel();
  } else {
    taskList.style.display   = "flex";
    statsPanel.style.display = "none";
    filterBar.style.display  = "flex";
    refresh();
  }
}

function switchCat(cat) {
  activeCat  = cat;
  activeView = "all";
  activeFilter = "all";

  document.getElementById("topbarTitle").textContent = cat;
  document.querySelectorAll(".nav-item[data-view]").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".cat-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.cat === cat);
  });
  document.querySelectorAll(".filter-pill").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === "all");
  });

  document.getElementById("taskList").style.display   = "flex";
  document.getElementById("statsPanel").style.display = "none";
  document.querySelector(".filter-bar").style.display = "flex";
  refresh();
}

// ─── Formulario nueva tarea ───────────────────────────────────────────────────

function toggleAddBar(show) {
  const bar = document.getElementById("addBar");
  bar.style.display = show ? "block" : "none";
  if (show) {
    document.getElementById("taskInput").focus();
  } else {
    document.getElementById("taskInput").value = "";
    document.getElementById("dueDateInput").value = "";
    document.getElementById("inputError").style.display = "none";
    document.getElementById("taskInput").classList.remove("error");
  }
}

function validateTaskInput(text) {
  const input    = document.getElementById("taskInput");
  const errorMsg = document.getElementById("inputError");
  const isValid  = text.length > 0 && text.length <= 120;
  input.classList.toggle("error", !isValid);
  errorMsg.style.display = isValid ? "none" : "block";
  return isValid;
}

async function handleAddTask() {
  const text     = document.getElementById("taskInput").value.trim();
  const category = document.getElementById("categorySelector").value;
  const priority = document.getElementById("prioritySelector").value;
  const dueDate  = document.getElementById("dueDateInput").value || null;

  if (!validateTaskInput(text)) {
    document.getElementById("taskInput").focus();
    return;
  }

  try {
    setLoadingState(true);
    const newTask = await apiCreateTask({ text, category, priority, dueDate, completed: false });
    tasks.push(newTask);
    toggleAddBar(false);
    refresh();
  } catch (err) {
    showNetworkError(err.message);
  } finally {
    setLoadingState(false);
  }
}

// ─── Completar / desmarcar ────────────────────────────────────────────────────

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
  refresh();
}

// ─── Completar todas ──────────────────────────────────────────────────────────

function completeAllTasks() {
  const pending = tasks.filter(t => !t.completed);
  if (!pending.length) return;
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
  refresh();
}

// ─── Eliminar tarea ───────────────────────────────────────────────────────────

async function deleteTask(taskId) {
  if (pendingUndo) pendingUndo.cancel();

  const index = tasks.findIndex(t => t.id === taskId);
  if (index === -1) return;

  const [removed] = tasks.splice(index, 1);

  try {
    await apiDeleteTask(removed.id);
  } catch (err) {
    tasks.splice(index, 0, removed);
    showNetworkError(err.message);
    refresh();
    return;
  }

  const preview = removed.text.length > 32 ? removed.text.slice(0, 32) + "…" : removed.text;
  const { cancel } = showUndoToast(`"${preview}" eliminada`, () => { pendingUndo = null; });
  pendingUndo = { tasks: [removed], index, cancel };
  refresh();
}

// ─── Eliminar todas ───────────────────────────────────────────────────────────

async function deleteAllTasks() {
  if (!tasks.length) return;
  if (pendingUndo) pendingUndo.cancel();

  const snapshot = [...tasks];
  tasks = [];

  try {
    await Promise.all(snapshot.map(t => apiDeleteTask(t.id)));
  } catch (err) {
    tasks = snapshot;
    showNetworkError("No se pudieron eliminar todas las tareas.");
    refresh();
    return;
  }

  const count = snapshot.length;
  const { cancel } = showUndoToast(
    `${count} tarea${count !== 1 ? "s" : ""} eliminada${count !== 1 ? "s" : ""}`,
    () => { pendingUndo = null; }
  );
  pendingUndo = { tasks: snapshot, cancel };
  refresh();
}

// ─── Undo ─────────────────────────────────────────────────────────────────────

async function undoDelete() {
  if (!pendingUndo) return;
  pendingUndo.cancel();

  const { tasks: restored, index } = pendingUndo;
  pendingUndo = null;

  try {
    const recreated = await Promise.all(
      restored.map(t => apiCreateTask({
        text: t.text, category: t.category,
        priority: t.priority, dueDate: t.dueDate, completed: t.completed,
      }))
    );
    typeof index === "number"
      ? tasks.splice(index, 0, recreated[0])
      : (tasks = recreated);
  } catch (err) {
    showNetworkError("No se pudo deshacer la eliminación.");
  }
  refresh();
}

// ─── Edición inline ───────────────────────────────────────────────────────────

function enableInlineEdit(nameSpan, task) {
  if (nameSpan.querySelector("input")) return;

  const original  = task.text;
  const editInput = document.createElement("input");
  editInput.type      = "text";
  editInput.value     = original;
  editInput.maxLength = 120;
  editInput.className = "edit-inline-input";

  nameSpan.textContent = "";
  nameSpan.appendChild(editInput);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  function save() {
    const newText = editInput.value.trim();
    if (newText && newText !== original) {
      const t = tasks.find(t => t.id === task.id);
      if (t) t.text = newText;
    }
    nameSpan.textContent = escapeHTML(newText || original);
  }
  function cancel() { nameSpan.textContent = escapeHTML(original); }

  editInput.addEventListener("keydown", e => {
    if (e.key === "Enter")  { e.preventDefault(); save();   }
    if (e.key === "Escape") { e.preventDefault(); cancel(); }
  });
  editInput.addEventListener("blur", save, { once: true });
}

// ─── Inicialización ───────────────────────────────────────────────────────────

async function init() {
  // Dark mode
  applyDarkMode(localStorage.getItem(DARK_MODE_KEY) === "true");

  // Cargar tareas
  try {
    setLoadingState(true);
    tasks = await apiFetchTasks();
  } catch {
    showNetworkError("No se pudo conectar con el servidor.");
  } finally {
    setLoadingState(false);
  }

  refresh();

  // Sidebar toggle
  document.getElementById("toggleSidebar").addEventListener("click", () => {
    document.getElementById("app").classList.toggle("collapsed");
  });

  // Nav del sidebar
  document.querySelectorAll(".nav-item[data-view]").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  // Categorías
  document.querySelectorAll(".cat-item[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => switchCat(btn.dataset.cat));
  });

  // Filtros de estado
  document.querySelectorAll(".filter-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll(".filter-pill").forEach(b => b.classList.toggle("active", b === btn));
      renderTaskList();
    });
  });

  // Dark mode
  document.getElementById("darkModeBtn").addEventListener("click", toggleDarkMode);

  // Nueva tarea
  document.getElementById("newTaskBtn").addEventListener("click", () => toggleAddBar(true));
  document.getElementById("cancelAddBtn").addEventListener("click", () => toggleAddBar(false));
  document.getElementById("addBtn").addEventListener("click", handleAddTask);
  document.getElementById("taskInput").addEventListener("keydown", e => {
    if (e.key === "Enter") handleAddTask();
    if (e.key === "Escape") toggleAddBar(false);
  });
  document.getElementById("taskInput").addEventListener("input", () => {
    const input = document.getElementById("taskInput");
    if (input.classList.contains("error") && input.value.trim()) {
      input.classList.remove("error");
      document.getElementById("inputError").style.display = "none";
    }
  });

  // Acciones masivas
  document.getElementById("completeAllBtn").addEventListener("click", completeAllTasks);
  document.getElementById("deleteAllBtn").addEventListener("click", deleteAllTasks);
  document.getElementById("undoBtn").addEventListener("click", undoDelete);

  // Audio
  document.addEventListener("click", () => getAudioContext(), { once: true });
}

document.addEventListener("DOMContentLoaded", init);
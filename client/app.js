/**
 * @fileoverview TaskFlow – Punto de entrada principal.
 */

import { apiFetchTasks, apiCreateTask, apiDeleteTask } from "./src/api/client.js";
import { getAudioContext, playCompleteSound, playUncompleteSound, playCompleteAllSound } from "./src/audio/sounds.js";
import { dateKey, countCompletedToday, calcStreak, buildWeekData, calcCompletionRate } from "./src/services/stats.service.js";
import { renderTaskList, renderStats, setLoadingState, showNetworkError, updateBulkButtons, escapeHTML } from "./src/ui/render.js";
import { showUndoToast } from "./src/ui/toast.js";
import { restoreDarkMode, toggleDarkMode } from "./src/ui/theme.js";

// ─── Estado global ────────────────────────────────────────────────────────────

/** @type {Task[]} */
let tasks = [];

/** @type {"all"|"pending"|"completed"} */
let activeFilter = "all";

/** @type {boolean} */
let statsOpen = false;

/** @type {{ tasks: Task[], index?: number, cancel: Function } | null} */
let pendingUndo = null;

const COMPLETED_DAYS_KEY = "taskflow_completedDays";

// ─── Helpers de estado ────────────────────────────────────────────────────────

function loadCompletedDays() {
  try { return JSON.parse(localStorage.getItem(COMPLETED_DAYS_KEY)) || {}; }
  catch { return {}; }
}

function persistCompletedDays(data) {
  localStorage.setItem(COMPLETED_DAYS_KEY, JSON.stringify(data));
}

function getFilteredTasks() {
  if (activeFilter === "pending")   return tasks.filter(t => !t.completed);
  if (activeFilter === "completed") return tasks.filter(t =>  t.completed);
  return [...tasks];
}

function refresh() {
  renderTaskList(getFilteredTasks(), tasks, activeFilter, {
    onToggle: toggleTaskCompletion,
    onDelete: deleteTask,
    onEdit:   enableInlineEdit,
  });
  updateBulkButtons(tasks);
  if (statsOpen) refreshStats();
}

function refreshStats() {
  const days = loadCompletedDays();
  renderStats({
    today:     countCompletedToday(tasks),
    streak:    calcStreak(days),
    weekData:  buildWeekData(days),
    rate:      calcCompletionRate(tasks),
    completed: tasks.filter(t => t.completed).length,
    total:     tasks.length,
  });
}

// ─── Validación ───────────────────────────────────────────────────────────────

function validateTaskInput(text) {
  const input    = document.getElementById("taskInput");
  const errorMsg = document.getElementById("inputError");
  const isValid  = text.length > 0 && text.length <= 120;
  input.classList.toggle("error", !isValid);
  errorMsg.style.display = isValid ? "none" : "block";
  return isValid;
}

// ─── Añadir tarea ─────────────────────────────────────────────────────────────

async function handleAddTask() {
  const taskInput       = document.getElementById("taskInput");
  const categorySelect  = document.getElementById("categorySelector");
  const prioritySelect  = document.getElementById("prioritySelector");
  const dueDateInput    = document.getElementById("dueDateInput");

  const text     = taskInput.value.trim();
  const category = categorySelect.value;
  const priority = prioritySelect.value;
  const dueDate  = dueDateInput.value || null;

  if (!validateTaskInput(text)) { taskInput.focus(); return; }

  // Verificar que los selectores tienen valor antes de enviar
  if (!category || !priority) {
    showNetworkError("Por favor selecciona categoría y prioridad.");
    return;
  }

  const payload = { text, category, priority, dueDate, completed: false };

  try {
    setLoadingState(true);

    const newTask = await apiCreateTask(payload);

    tasks.push(newTask);
    taskInput.value    = "";
    dueDateInput.value = "";
    taskInput.classList.remove("error");
    document.getElementById("inputError").style.display = "none";

    refresh();

  } catch (err) {
    showNetworkError(err.message);
  } finally {
    setLoadingState(false);
  }
}

// ─── Completar tarea ──────────────────────────────────────────────────────────

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
  refresh();
}

// ─── Eliminar tarea ───────────────────────────────────────────────────────────

async function deleteTask(taskId) {
  if (pendingUndo) pendingUndo.cancel();

  const index = tasks.findIndex(t => t.id === taskId);
  if (index === -1) return;

  const [removedTask] = tasks.splice(index, 1);

  try {
    await apiDeleteTask(removedTask.id);
  } catch (err) {
    tasks.splice(index, 0, removedTask);
    showNetworkError(err.message);
    refresh();
    return;
  }

  const preview = removedTask.text.length > 32
    ? removedTask.text.slice(0, 32) + "…"
    : removedTask.text;

  const { cancel } = showUndoToast(`"${preview}" eliminada`, () => {
    pendingUndo = null;
  });

  pendingUndo = { tasks: [removedTask], index, cancel };
  refresh();
}

// ─── Eliminar todas ───────────────────────────────────────────────────────────

async function deleteAllTasks() {
  if (tasks.length === 0) return;
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

  const { tasks: restoredTasks, index } = pendingUndo;
  pendingUndo = null;

  try {
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

  refresh();
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

// ─── Filtros ──────────────────────────────────────────────────────────────────

function applyFilter(filterValue) {
  activeFilter = filterValue;
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filterValue);
  });
  refresh();
}

// ─── Estadísticas ─────────────────────────────────────────────────────────────

function toggleStats() {
  statsOpen = !statsOpen;
  const panel = document.getElementById("statsPanel");
  const btn   = document.getElementById("statsBtn");
  const icon  = document.getElementById("statsIcon");
  panel.classList.toggle("open", statsOpen);
  btn.classList.toggle("active", statsOpen);
  icon.textContent = statsOpen ? "▲" : "📊";
  if (statsOpen) refreshStats();
}

// ─── Inicialización ───────────────────────────────────────────────────────────

async function init() {
  restoreDarkMode();

  try {
    setLoadingState(true);
    tasks = await apiFetchTasks();
  } catch {
    showNetworkError("No se pudo conectar con el servidor.");
  } finally {
    setLoadingState(false);
  }

  refresh();

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
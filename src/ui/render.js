/**
 * @fileoverview Módulo de renderizado DOM.
 * Todas las funciones que construyen o actualizan elementos HTML.
 */

// ─── Constantes de presentación ──────────────────────────────────────────────

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
  
  // ─── Helpers de fecha para badges ────────────────────────────────────────────
  
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
  
  /** @param {Task} task @returns {string} */
  function getDueBorderClass(task) {
    if (!task.dueDate || task.completed) return "";
    return `due-border-${getDueStatus(daysUntilDue(task.dueDate))}`;
  }
  
  // ─── Escape XSS ──────────────────────────────────────────────────────────────
  
  /** @param {string} str @returns {string} */
  export function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // ─── Badges ───────────────────────────────────────────────────────────────────
  
  /** @param {Task} task @returns {string} */
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
  
  // ─── Elemento de tarea ────────────────────────────────────────────────────────
  
  /**
   * Crea el <li> de una tarea y enlaza sus callbacks.
   * @param {Task}     task
   * @param {Function} onToggle   - (taskId) => void
   * @param {Function} onDelete   - (taskId) => void
   * @param {Function} onEdit     - (textSpan, task) => void
   * @returns {HTMLLIElement}
   */
  export function createTaskElement(task, { onToggle, onDelete, onEdit }) {
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
      if (!task.completed) onEdit(textSpan, task);
    });
  
    li.querySelector(".btn-complete").addEventListener("click", () => onToggle(task.id));
    li.querySelector(".btn-delete").addEventListener("click",   () => onDelete(task.id));
  
    return li;
  }
  
  // ─── Lista completa ───────────────────────────────────────────────────────────
  
  /**
   * Renderiza la lista de tareas filtrada.
   * @param {Task[]}   filteredTasks
   * @param {Task[]}   allTasks           - para el contador de pendientes
   * @param {string}   activeFilter
   * @param {Object}   callbacks          - { onToggle, onDelete, onEdit }
   */
  export function renderTaskList(filteredTasks, allTasks, activeFilter, callbacks) {
    const taskList    = document.getElementById("taskList");
    const taskCounter = document.getElementById("taskCounter");
  
    taskList.innerHTML = "";
  
    if (filteredTasks.length === 0) {
      taskList.innerHTML = `
        <li class="empty-state">
          <span class="emoji">📭</span>
          ${activeFilter === "completed"
            ? "Todavía no has completado ninguna tarea."
            : "No hay tareas aquí. ¡Añade una!"}
        </li>`;
    } else {
      filteredTasks.forEach(task => {
        const li = createTaskElement(task, callbacks);
        taskList.appendChild(li);
        requestAnimationFrame(() => requestAnimationFrame(() => li.classList.add("show")));
      });
    }
  
    taskCounter.textContent = allTasks.filter(t => !t.completed).length;
  }
  
  // ─── Panel de estadísticas ────────────────────────────────────────────────────
  
  /**
   * Renderiza el panel de estadísticas.
   * @param {{ today:number, streak:number, weekData:Array, rate:number, completed:number, total:number }} stats
   */
  export function renderStats({ today, streak, weekData, rate, completed, total }) {
    const panel    = document.getElementById("statsPanel");
    if (!panel) return;
  
    const maxCount = Math.max(...weekData.map(d => d.count), 1);
    const todayKey = new Date().toISOString().slice(0, 10);
  
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
        <span class="stats-progress-text">${completed} / ${total} tareas completadas</span>
      </div>
    `;
  }
  
  // ─── Estados de red ───────────────────────────────────────────────────────────
  
  /**
   * Muestra u oculta el spinner de carga.
   * @param {boolean} isLoading
   */
  export function setLoadingState(isLoading) {
    const taskList = document.getElementById("taskList");
    const loader   = document.getElementById("loadingIndicator");
    taskList.style.opacity = isLoading ? "0.4" : "1";
    loader.style.display   = isLoading ? "flex" : "none";
  }
  
  /**
   * Muestra un banner de error durante 5 segundos.
   * @param {string} message
   */
  export function showNetworkError(message) {
    const banner = document.getElementById("networkError");
    banner.textContent = `⚠️ ${message}`;
    banner.classList.add("show");
    setTimeout(() => banner.classList.remove("show"), 5000);
  }
  
  // ─── Botones de acción masiva ─────────────────────────────────────────────────
  
  /**
   * Actualiza la visibilidad de los botones masivos.
   * @param {Task[]} tasks
   */
  export function updateBulkButtons(tasks) {
    const hasTasks   = tasks.length > 0;
    const hasPending = tasks.some(t => !t.completed);
    document.getElementById("completeAllBtn").classList.toggle("hidden", !hasPending);
    document.getElementById("deleteAllBtn").classList.toggle("hidden", !hasTasks);
  }
/**
 * @fileoverview Servicio de estadísticas de productividad.
 * Lógica pura: no toca el DOM ni hace peticiones de red.
 * Recibe el array de tareas y el historial de días como parámetros.
 */

/**
 * Devuelve "YYYY-MM-DD" para un timestamp (o hoy si se omite).
 * @param {number} [ts]
 * @returns {string}
 */
export function dateKey(ts) {
    const d = ts ? new Date(ts) : new Date();
    return d.toISOString().slice(0, 10);
  }
  
  /**
   * Nombre corto del día en español para un dateKey.
   * @param {string} key
   * @returns {string}
   */
  export function shortDayName(key) {
    const names = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return names[new Date(key + "T12:00:00").getDay()];
  }
  
  /**
   * Tareas completadas hoy.
   * @param {Task[]} tasks
   * @returns {number}
   */
  export function countCompletedToday(tasks) {
    const today = dateKey();
    return tasks.filter(
      t => t.completed && t.completedAt && dateKey(t.completedAt) === today
    ).length;
  }
  
  /**
   * Racha de días consecutivos con al menos 1 tarea completada.
   * @param {Record<string,number>} completedDays
   * @returns {number}
   */
  export function calcStreak(completedDays) {
    const today = new Date();
    let streak  = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (completedDays[key] && completedDays[key] > 0) { streak++; }
      else if (i > 0) { break; }
    }
    return streak;
  }
  
  /**
   * Datos de los últimos 7 días para el gráfico de barras.
   * @param {Record<string,number>} completedDays
   * @returns {{ key:string, label:string, count:number }[]}
   */
  export function buildWeekData(completedDays) {
    const today  = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ key, label: shortDayName(key), count: completedDays[key] || 0 });
    }
    return result;
  }
  
  /**
   * Tasa de completado global 0-100.
   * @param {Task[]} tasks
   * @returns {number}
   */
  export function calcCompletionRate(tasks) {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  }
/**
 * @fileoverview Módulo de tema (dark/light mode).
 */

const DARK_MODE_KEY = "taskflow_darkMode";

/**
 * Aplica el estado del dark mode y actualiza el botón.
 * @param {boolean} isDark
 */
export function applyDarkMode(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  document.getElementById("darkIcon").textContent  = isDark ? "☀️" : "🌙";
  document.getElementById("darkLabel").textContent = isDark ? "Día"  : "Noche";
  localStorage.setItem(DARK_MODE_KEY, isDark);
}

/** Alterna entre modo oscuro y claro. */
export function toggleDarkMode() {
  applyDarkMode(!document.documentElement.classList.contains("dark"));
}

/** Restaura el tema guardado al arrancar. */
export function restoreDarkMode() {
  applyDarkMode(localStorage.getItem(DARK_MODE_KEY) === "true");
}
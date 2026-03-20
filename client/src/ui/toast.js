/**
 * @fileoverview Módulo del toast de undo.
 * Gestiona la aparición, animación y ocultación del toast.
 */

const UNDO_TIMEOUT_MS = 5000;

/**
 * Muestra el toast con un mensaje y la barra de progreso animada.
 * @param {string}   message       - Texto a mostrar
 * @param {Function} onCommit      - Callback cuando expira el tiempo
 * @returns {{ cancel: Function }} - Objeto con función para cancelar el timer
 */
export function showUndoToast(message, onCommit) {
  const toast = document.getElementById("undoToast");
  const msg   = document.getElementById("undoMsg");
  const bar   = document.getElementById("undoProgressBar");

  msg.textContent = message;

  // Reiniciar animación de la barra
  bar.style.transition = "none";
  bar.style.width      = "100%";
  bar.getBoundingClientRect(); // forzar reflow
  bar.style.transition = `width ${UNDO_TIMEOUT_MS}ms linear`;
  bar.style.width      = "0%";

  toast.classList.add("show");

  const timerId = setTimeout(() => {
    onCommit();
    hideUndoToast();
  }, UNDO_TIMEOUT_MS);

  return {
    cancel: () => {
      clearTimeout(timerId);
      hideUndoToast();
    },
  };
}

/** Oculta el toast. */
export function hideUndoToast() {
  document.getElementById("undoToast").classList.remove("show");
}
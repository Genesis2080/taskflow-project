/**
 * @fileoverview Módulo de audio.
 * Toda la lógica de Web Audio API encapsulada aquí.
 * Ningún otro módulo conoce OscillatorNode ni GainNode.
 */

/** @type {AudioContext|null} */
let audioCtx = null;

/**
 * Devuelve el AudioContext, creándolo tras el primer gesto del usuario.
 * @returns {AudioContext}
 */
export function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

/**
 * Toca una nota con envolvente ADSR.
 * @param {AudioContext}                           ctx
 * @param {number}                                 frequency
 * @param {number}                                 startTime
 * @param {number}                                 duration
 * @param {number}                                 peakGain
 * @param {"sine"|"triangle"|"square"|"sawtooth"} [type]
 */
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

/** Acorde Do mayor arpegiado al completar una tarea. */
export function playCompleteSound() {
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

/** Descenso suave al desmarcar una tarea. */
export function playUncompleteSound() {
  try {
    const ctx = getAudioContext();
    const t   = ctx.currentTime;
    const v   = 0.10;
    playNote(ctx, 440,    t,        0.20, v,        "sine");
    playNote(ctx, 349.23, t + 0.10, 0.20, v * 0.75, "sine");
  } catch (e) { console.warn("TaskFlow: playUncompleteSound", e); }
}

/** Fanfare ascendente al completar todas las tareas. */
export function playCompleteAllSound() {
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
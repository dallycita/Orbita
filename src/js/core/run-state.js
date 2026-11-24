/**
 * Estado compartido de la partida: contadores, tutorial, gestos, rachas, reloj del juego (`t`) y
 * listas de efectos en pantalla. Solo declara variables; las cambian muchos archivos.
 */
import { GOAL } from '../data/levels.js';

// winT: segundos desde que se ganó; perfCount: saltos perfectos; attempts: intentos guardados
let winT = 0;
let perfCount = 0;
let attempts = 0;
// Tutorial: los primeros 10 anillos de la huida, una cosa a la vez.
// TUT_TYPES da el tipo de cada anillo y TUT_TIPS el consejo que se muestra en él.
const TUT_GOAL = 10;
const TUT_TYPES = [
  'vacio',
  'vacio',
  'vacio',
  'uno',
  'uno',
  'muralla',
  'respiracion',
  'escalera',
  'escalera',
  'barrera',
  'vacio',
];
const TUT_TIPS = [
  'Toca para saltar al anillo de arriba.',
  '¡Eso! Una vez más.',
  'Espera a que el hueco pase sobre ti y salta.',
  'Bien. El agujero negro no espera: no te quedes quieto.',
  'Muralla: espera uno de sus huecos.',
  'Respiración: salta cuando se encojan.',
  'Escalera: los huecos están alineados. Salta seguido.',
  '¡Sigue!',
  'Una barrera sin huecos. Desliza hacia arriba para el salto doble.',
];
let tutorial = false;
let tutorialDone = true; // el tutorial no se impone al empezar: se aprende jugando
/**
 * Meta de la partida actual.
 *
 * @returns {number} Nivel de anillo que hay que alcanzar (TUT_GOAL en el tutorial).
 */
const curGoal = () => (tutorial ? TUT_GOAL : GOAL);
// brillo de cada marca de carga del poder al llenarse, de 0 a 1
const pipFlash = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let readyT = 0;
let chargeFlash = 0;
let readyHintDone = false;
// gest: gesto en curso; pending: salto pedido que espera 0,09 s por si el gesto es un
// deslizamiento (salto doble); pendingT: segundos que lleva esperando
let gest = null;
let pending = false;
let pendingT = 0;
let hintsShown = 0;
let showHint = false;
let hintT = 0;
let swallow = null;
let holeFlare = 0;
let streak = 0;
let jumpClear = 999;
let culprit = null;
let culpritT = 0;
let landPop = 0;
// holgura máxima con los asteroides para que un salto cuente como perfecto
const PERFECT = 12;
// t: reloj del juego, en segundos; timeScale y slowTimer: cámara lenta
let t = 0;
let timeScale = 1;
let slowTimer = 0;
let shake = 0;
let flash = 0;
let pulse = 0;
let deadT = 0;
let canRestart = false;
let particles = [];
let trail = [];
let texts = [];
let burns = [];
// sunLevel: nivel de anillo hasta donde llega el agujero negro; lastEaten: último anillo tragado
let sunLevel = -1.6;
let lastEaten = -2;
// restos que caen en espiral hacia el agujero negro (ángulo en radianes y distancia)
let debris;
// duración base de un salto entre anillos, en segundos (jumpDur la ajusta según el planeta)
const JUMP_DUR = 0.12;

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initRunState() {
  try {
    attempts = parseInt(localStorage.getItem('orbita_p1_intentos') || '0', 10) || 0;
  } catch (e) {
    attempts = 0;
  }
  try {
    readyHintDone = localStorage.getItem('orbita_p1_poderlisto') === '1';
  } catch (e) {}
  try {
    hintsShown = parseInt(localStorage.getItem('orbita_p1_pista') || '0', 10) || 0;
  } catch (e) {
    hintsShown = 0;
  }
  debris = Array.from({ length: 60 }, () => ({
    a: Math.random() * Math.PI * 2,
    r: 60 + Math.random() * 180,
  }));
}

/**
 * Cambia `attempts` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setAttempts(value) {
  attempts = value;
  return value;
}

/**
 * Cambia `burns` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setBurns(value) {
  burns = value;
  return value;
}

/**
 * Cambia `canRestart` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCanRestart(value) {
  canRestart = value;
  return value;
}

/**
 * Cambia `chargeFlash` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setChargeFlash(value) {
  chargeFlash = value;
  return value;
}

/**
 * Cambia `culprit` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCulprit(value) {
  culprit = value;
  return value;
}

/**
 * Cambia `culpritT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCulpritT(value) {
  culpritT = value;
  return value;
}

/**
 * Cambia `deadT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setDeadT(value) {
  deadT = value;
  return value;
}

/**
 * Cambia `flash` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setFlash(value) {
  flash = value;
  return value;
}

/**
 * Cambia `gest` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setGest(value) {
  gest = value;
  return value;
}

/**
 * Cambia `hintT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHintT(value) {
  hintT = value;
  return value;
}

/**
 * Cambia `hintsShown` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHintsShown(value) {
  hintsShown = value;
  return value;
}

/**
 * Cambia `holeFlare` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHoleFlare(value) {
  holeFlare = value;
  return value;
}

/**
 * Cambia `jumpClear` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setJumpClear(value) {
  jumpClear = value;
  return value;
}

/**
 * Cambia `landPop` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLandPop(value) {
  landPop = value;
  return value;
}

/**
 * Cambia `lastEaten` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLastEaten(value) {
  lastEaten = value;
  return value;
}

/**
 * Cambia `particles` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setParticles(value) {
  particles = value;
  return value;
}

/**
 * Cambia `pending` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPending(value) {
  pending = value;
  return value;
}

/**
 * Cambia `pendingT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPendingT(value) {
  pendingT = value;
  return value;
}

/**
 * Cambia `perfCount` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPerfCount(value) {
  perfCount = value;
  return value;
}

/**
 * Cambia `pulse` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPulse(value) {
  pulse = value;
  return value;
}

/**
 * Cambia `readyHintDone` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setReadyHintDone(value) {
  readyHintDone = value;
  return value;
}

/**
 * Cambia `readyT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setReadyT(value) {
  readyT = value;
  return value;
}

/**
 * Cambia `shake` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setShake(value) {
  shake = value;
  return value;
}

/**
 * Cambia `showHint` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setShowHint(value) {
  showHint = value;
  return value;
}

/**
 * Cambia `slowTimer` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setSlowTimer(value) {
  slowTimer = value;
  return value;
}

/**
 * Cambia `streak` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setStreak(value) {
  streak = value;
  return value;
}

/**
 * Cambia `sunLevel` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setSunLevel(value) {
  sunLevel = value;
  return value;
}

/**
 * Cambia `swallow` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setSwallow(value) {
  swallow = value;
  return value;
}

/**
 * Cambia `t` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setT(value) {
  t = value;
  return value;
}

/**
 * Cambia `texts` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setTexts(value) {
  texts = value;
  return value;
}

/**
 * Cambia `timeScale` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setTimeScale(value) {
  timeScale = value;
  return value;
}

/**
 * Cambia `trail` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setTrail(value) {
  trail = value;
  return value;
}

/**
 * Cambia `tutorial` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setTutorial(value) {
  tutorial = value;
  return value;
}

/**
 * Cambia `tutorialDone` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setTutorialDone(value) {
  tutorialDone = value;
  return value;
}

/**
 * Cambia `winT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setWinT(value) {
  winT = value;
  return value;
}

export {
  JUMP_DUR,
  PERFECT,
  TUT_TIPS,
  TUT_TYPES,
  attempts,
  burns,
  canRestart,
  chargeFlash,
  culprit,
  culpritT,
  curGoal,
  deadT,
  debris,
  flash,
  gest,
  hintT,
  hintsShown,
  holeFlare,
  jumpClear,
  landPop,
  lastEaten,
  particles,
  pending,
  pendingT,
  perfCount,
  pipFlash,
  pulse,
  readyHintDone,
  readyT,
  shake,
  showHint,
  slowTimer,
  streak,
  sunLevel,
  swallow,
  t,
  texts,
  timeScale,
  trail,
  tutorial,
  tutorialDone,
  winT,
};

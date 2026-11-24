/**
 * Estado compartido de la partida: contadores, tutorial, gestos, rachas, reloj del juego (`t`) y
 * listas de efectos en pantalla. Solo declara variables; las cambian muchos archivos.
 */
import { GOAL } from '../data/levels.js';
import { records, setAttempts } from './state.js';

// winT: segundos desde que se ganó; perfCount: saltos perfectos; attempts: intentos guardados
const outcome = {
  winT: 0,
  perfCount: 0,
  streak: 0,
  jumpClear: 999,
  culprit: null,
  culpritT: 0,
  deadT: 0,
  canRestart: false,
};
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
const tutorialState = {
  tutorial: false,
  tutorialDone: true,
  readyHintDone: false,
  hintsShown: 0,
  showHint: false,
  hintT: 0,
};
// el tutorial no se impone al empezar: se aprende jugando
/**
 * Meta de la partida actual.
 *
 * @returns {number} Nivel de anillo que hay que alcanzar (TUT_GOAL en el tutorial).
 */
const curGoal = () => (tutorialState.tutorial ? TUT_GOAL : GOAL);
// brillo de cada marca de carga del poder al llenarse, de 0 a 1
const pipFlash = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const effects = {
  readyT: 0,
  chargeFlash: 0,
  holeFlare: 0,
  landPop: 0,
  shake: 0,
  flash: 0,
  pulse: 0,
  particles: [],
  trail: [],
  texts: [],
  burns: [],
  debris: undefined,
};
// gest: gesto en curso; pending: salto pedido que espera 0,09 s por si el gesto es un
// deslizamiento (salto doble); pendingT: segundos que lleva esperando
const input = {
  gest: null,
  pending: false,
  pendingT: 0,
};
const hole = {
  swallow: null,
  sunLevel: -1.6,
  lastEaten: -2,
};
// holgura máxima con los asteroides para que un salto cuente como perfecto
const PERFECT = 12;
// t: reloj del juego, en segundos; timeScale y slowTimer: cámara lenta
const time = {
  t: 0,
  timeScale: 1,
  slowTimer: 0,
};
// sunLevel: nivel de anillo hasta donde llega el agujero negro; lastEaten: último anillo tragado
// restos que caen en espiral hacia el agujero negro (ángulo en radianes y distancia)
// duración base de un salto entre anillos, en segundos (jumpDur la ajusta según el planeta)
const JUMP_DUR = 0.12;

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initRunState() {
  try {
    setAttempts(parseInt(localStorage.getItem('orbita_p1_intentos') || '0', 10) || 0);
  } catch (e) {
    setAttempts(0);
  }
  try {
    tutorialState.readyHintDone = localStorage.getItem('orbita_p1_poderlisto') === '1';
  } catch (e) {}
  try {
    tutorialState.hintsShown = parseInt(localStorage.getItem('orbita_p1_pista') || '0', 10) || 0;
  } catch (e) {
    tutorialState.hintsShown = 0;
  }
  effects.debris = Array.from({ length: 60 }, () => ({
    a: Math.random() * Math.PI * 2,
    r: 60 + Math.random() * 180,
  }));
}

/**
 * Cambia `burns` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setBurns(value) {
  effects.burns = value;
  return value;
}

/**
 * Cambia `canRestart` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCanRestart(value) {
  outcome.canRestart = value;
  return value;
}

/**
 * Cambia `chargeFlash` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setChargeFlash(value) {
  effects.chargeFlash = value;
  return value;
}

/**
 * Cambia `culprit` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCulprit(value) {
  outcome.culprit = value;
  return value;
}

/**
 * Cambia `culpritT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCulpritT(value) {
  outcome.culpritT = value;
  return value;
}

/**
 * Cambia `deadT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setDeadT(value) {
  outcome.deadT = value;
  return value;
}

/**
 * Cambia `flash` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setFlash(value) {
  effects.flash = value;
  return value;
}

/**
 * Cambia `gest` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setGest(value) {
  input.gest = value;
  return value;
}

/**
 * Cambia `hintT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHintT(value) {
  tutorialState.hintT = value;
  return value;
}

/**
 * Cambia `hintsShown` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHintsShown(value) {
  tutorialState.hintsShown = value;
  return value;
}

/**
 * Cambia `holeFlare` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHoleFlare(value) {
  effects.holeFlare = value;
  return value;
}

/**
 * Cambia `jumpClear` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setJumpClear(value) {
  outcome.jumpClear = value;
  return value;
}

/**
 * Cambia `landPop` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLandPop(value) {
  effects.landPop = value;
  return value;
}

/**
 * Cambia `lastEaten` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLastEaten(value) {
  hole.lastEaten = value;
  return value;
}

/**
 * Cambia `particles` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setParticles(value) {
  effects.particles = value;
  return value;
}

/**
 * Cambia `pending` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPending(value) {
  input.pending = value;
  return value;
}

/**
 * Cambia `pendingT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPendingT(value) {
  input.pendingT = value;
  return value;
}

/**
 * Cambia `perfCount` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPerfCount(value) {
  outcome.perfCount = value;
  return value;
}

/**
 * Cambia `pulse` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPulse(value) {
  effects.pulse = value;
  return value;
}

/**
 * Cambia `readyHintDone` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setReadyHintDone(value) {
  tutorialState.readyHintDone = value;
  return value;
}

/**
 * Cambia `readyT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setReadyT(value) {
  effects.readyT = value;
  return value;
}

/**
 * Cambia `shake` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setShake(value) {
  effects.shake = value;
  return value;
}

/**
 * Cambia `showHint` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setShowHint(value) {
  tutorialState.showHint = value;
  return value;
}

/**
 * Cambia `slowTimer` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setSlowTimer(value) {
  time.slowTimer = value;
  return value;
}

/**
 * Cambia `streak` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setStreak(value) {
  outcome.streak = value;
  return value;
}

/**
 * Cambia `sunLevel` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setSunLevel(value) {
  hole.sunLevel = value;
  return value;
}

/**
 * Cambia `swallow` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setSwallow(value) {
  hole.swallow = value;
  return value;
}

/**
 * Cambia `t` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setT(value) {
  time.t = value;
  return value;
}

/**
 * Cambia `texts` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setTexts(value) {
  effects.texts = value;
  return value;
}

/**
 * Cambia `timeScale` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setTimeScale(value) {
  time.timeScale = value;
  return value;
}

/**
 * Cambia `trail` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setTrail(value) {
  effects.trail = value;
  return value;
}

/**
 * Cambia `tutorial` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setTutorial(value) {
  tutorialState.tutorial = value;
  return value;
}

/**
 * Cambia `tutorialDone` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setTutorialDone(value) {
  tutorialState.tutorialDone = value;
  return value;
}

/**
 * Cambia `winT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setWinT(value) {
  outcome.winT = value;
  return value;
}

export {
  JUMP_DUR,
  PERFECT,
  TUT_TIPS,
  TUT_TYPES,
  curGoal,
  effects,
  hole,
  input,
  outcome,
  pipFlash,
  time,
  tutorialState,
};

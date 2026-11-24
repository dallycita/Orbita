/**
 * Recorridos fijos de los niveles 1 a 3: qué tipo de anillo hay en cada posición, y el generador
 * aleatorio con semilla fija que hace que cada partida sea igual.
 */
import { run } from '../core/state.js';
import { TUT_TYPES, tutorialState } from '../core/run-state.js';
import { courseMaps } from './beat.js';
import { COURSE, COURSE2, COURSE3, courseMap, courseMap2, courseMap3 } from '../data/courses.js';
import { GOAL } from '../data/levels.js';

// Generador con semilla fija: el recorrido es siempre el mismo, como un nivel de Geometry Dash.
const SEED = 20261007;
let rngState = SEED;
/**
 * Número aleatorio repetible (algoritmo mulberry32) a partir de `rngState`.
 *
 * @returns {number} Número entre 0 (incluido) y 1 (excluido).
 */
function rng() {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let x = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}
/**
 * Tipo del anillo `k` en el nivel actual (o en el tutorial); la salida (`GOAL`) es una muralla.
 *
 * @param {number} k Nivel de anillo.
 * @returns {string} Tipo de anillo.
 */
const ringType = k =>
  tutorialState.tutorial
    ? TUT_TYPES[k] || 'vacio'
    : k === GOAL
      ? 'muralla'
      : (run.lvl >= 3
          ? courseMaps[run.lvl]
          : run.lvl === 2
            ? courseMap3
            : run.lvl === 1
              ? courseMap2
              : courseMap)[Math.min(k, 59)];
// Tipos de anillo ya presentados al jugador, guardados en `orbita_p1_vistos`.
let seenTypes = {};

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initCourses() {
  for (const [n, ty] of COURSE3) {
    for (let i = 0; i < n; i++) {
      courseMap3.push(ty);
    }
  }
  while (courseMap3.length < 60) {
    courseMap3.push('clasico');
  }
  for (const [n, ty] of COURSE2) {
    for (let i = 0; i < n; i++) {
      courseMap2.push(ty);
    }
  }
  while (courseMap2.length < 60) {
    courseMap2.push('clasico');
  }
  (function buildCourse() {
    for (const [n, ty] of COURSE) {
      for (let i = 0; i < n; i++) {
        courseMap.push(ty);
      }
    }
    while (courseMap.length < 60) {
      courseMap.push('clasico');
    }
  })();
  try {
    seenTypes = JSON.parse(localStorage.getItem('orbita_p1_vistos') || '{}') || {};
  } catch (e) {
    seenTypes = {};
  }
}

/**
 * Cambia `rngState` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setRngState(value) {
  rngState = value;
  return value;
}

/**
 * Cambia `seenTypes` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setSeenTypes(value) {
  seenTypes = value;
  return value;
}

export { SEED, ringType, rng, rngState, seenTypes };

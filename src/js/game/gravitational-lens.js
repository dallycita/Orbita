/**
 * Espacio doblado: un agujero de gusano flota delante del jugador y actúa como lente gravitacional.
 * Lo que pasa cerca (anillos, asteroides, el planeta) se ve empujado hacia afuera de la esfera, se
 * estira en arcos y corre más rápido por su borde; dentro se ve el cielo del otro lado.
 * Dato real: la gravedad dobla la luz (Einstein, 1915); así se calculó el agujero de Interstellar.
 */
import { run, state } from '../core/state.js';
import { time, tutorialState } from '../core/run-state.js';

import { hazardTip } from './hazards.js';

import { rr } from '../core/geometry.js';
import { viewInside } from '../core/screen.js';

// BEND_AT[nivel] = [primer, último] nivel de anillo con lente; WH_K es el anillo de la boca del
// gusano y WH_EXIT el de salida. BEND_R es el radio de Einstein de la lente.
const BEND_AT = { 3: [26, 28] };
const BEND_R = 23;
const WORM_COL = '#d4c8ff';
const WH_K = 29;
const WH_EXIT = 41;
let bend = { str: 0, a: -Math.PI / 2, L: 0, on: false, grow: 1, fixed: false };
let whRip = null;
/**
 * Radio actual de la lente: crece y se apaga con su fuerza.
 *
 * @returns {number} Radio, en unidades del mundo (se multiplica por S para pantalla).
 */
const bendRad = () => BEND_R * bend.str * (bend.grow || 1);
/**
 * Enciende, apaga y mueve la lente según el anillo en que va el jugador.
 *
 * @param {number} d Tiempo desde el cuadro anterior, en segundos.
 */
function bendUpdate(d) {
  // durante la entrada y la salida la mueve el portal
  if (bend.fixed) {
    return;
  }
  const z = BEND_AT[run.lvl],
    want =
      !tutorialState.tutorial && z && run.level >= z[0] && run.level <= z[1] && state === 'play'
        ? 1
        : 0;
  if (want && !bend.on) {
    bend.on = true;
    bend.L = run.level + 1.5;
    bend.a = -Math.PI / 2 + 0.9;
    hazardTip('whVisto', 'Agujero de gusano', 'Salta dentro: es un portal', WORM_COL);
  }
  if (!want && bend.on && bend.str < 0.02) {
    bend.on = false;
  }
  bend.str += (want - bend.str) * Math.min(1, d * (want ? 1.2 : 2.2));
  const lock = want && run.level === WH_K - 1; // en el último anillo se pone justo en tu camino
  bend.L +=
    ((want ? run.level + (lock ? 0.8 : 1.55) : run.level + 4) - bend.L) * Math.min(1, d * 2.5);
  const aT = lock
    ? -Math.PI / 2
    : -Math.PI / 2 + 0.8 * Math.sin(time.t * 0.42) + 0.2 * Math.sin(time.t * 1.1);
  bend.a +=
    Math.atan2(Math.sin(aT - bend.a), Math.cos(aT - bend.a)) * Math.min(1, d * (lock ? 4 : 2));
}
/**
 * Posición del centro de la lente respecto al agujero negro.
 *
 * @returns {number[]} [x, y], en unidades del mundo.
 */
function bendW() {
  const R = rr(bend.L);
  return [Math.cos(bend.a) * R, Math.sin(bend.a) * R];
}
/**
 * Dónde se ve un punto a través de la lente (y de la onda gravitacional, si la hay). Con lente
 * puntual, un punto a distancia r del centro se ve a (r + √(r² + 4θ²))/2, con θ el radio de
 * Einstein.
 *
 * @param {number} x Posición horizontal, en unidades del mundo.
 * @param {number} y Posición vertical, en unidades del mundo.
 * @returns {number[]} [x, y] donde se ve, en unidades del mundo.
 */
function lensP(x, y) {
  if (whRip && !viewInside) {
    // onda gravitacional: estira y encoge el espacio al pasar
    const dx = x - whRip.x,
      dy = y - whRip.y,
      d = Math.hypot(dx, dy) || 0.001,
      u = d - 300 * whRip.t,
      A = 7 * (1 - whRip.t / 1.1) * Math.exp((-u * u) / (2 * 38 * 38));
    if (A > 0.05) {
      const k = 1 + (A * Math.sin(u / 11)) / d;
      x = whRip.x + dx * k;
      y = whRip.y + dy * k;
    }
  }
  if (bend.str < 0.01 || viewInside) {
    return [x, y];
  }
  const [wx, wy] = bendW(),
    dx = x - wx,
    dy = y - wy,
    r = Math.hypot(dx, dy) || 0.001,
    te = bendRad(),
    r2 = (r + Math.sqrt(r * r + 4 * te * te)) / 2;
  return [wx + (dx * r2) / r, wy + (dy * r2) / r];
}
/**
 * Cuánto estira la lente un objeto en un punto, para deformar su dibujo.
 *
 * @param {number} x Posición horizontal, en unidades del mundo.
 * @param {number} y Posición vertical, en unidades del mundo.
 * @returns {number[]} [estiramiento tangencial (a lo largo del borde), radial (hacia el centro),
 *   ángulo del punto visto desde la lente en radianes].
 */
function lensJ(x, y) {
  if (bend.str < 0.01 || viewInside) {
    return [1, 1, 0];
  }
  const [wx, wy] = bendW(),
    dx = x - wx,
    dy = y - wy,
    r = Math.hypot(dx, dy) || 0.001,
    te = bendRad(),
    q = Math.sqrt(r * r + 4 * te * te);
  return [(r + q) / (2 * r), 0.5 * (1 + r / q), Math.atan2(dy, dx)];
}

/**
 * Cambia `bend` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setBend(value) {
  bend = value;
  return value;
}

/**
 * Cambia `whRip` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setWhRip(value) {
  whRip = value;
  return value;
}

export { BEND_R, WH_EXIT, WH_K, WORM_COL, bend, bendRad, bendUpdate, bendW, lensJ, lensP, whRip };

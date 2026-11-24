/**
 * Geometría de los anillos en pantalla: a qué radio queda cada anillo según dónde está la cámara.
 */
import { GAP, R0 } from './display.js';
import { camera } from './state.js';

/**
 * Radio de un anillo visto desde la cámara.
 *
 * @param {number} k Nivel de anillo (puede tener decimales).
 * @returns {number} Radio, en unidades del juego.
 */
const rr = k => R0 + (k - camera.camLevel) * GAP;

export { rr };

/**
 * (encabezado pendiente)
 */
import { GAP, R0 } from './display.js';
import { camLevel } from './state.js';

/**
 * Radio de un anillo visto desde la cámara.
 *
 * @param {number} k Nivel de anillo (puede tener decimales).
 * @returns {number} Radio, en unidades del juego.
 */
const rr = k => R0 + (k - camLevel) * GAP;

export { rr };

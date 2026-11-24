/**
 * (encabezado pendiente)
 */
import { GAP, R0 } from '../01-pantalla-y-utilidades.js';
import { camLevel } from '../06-record-y-estado.js';

/**
 * Radio de un anillo visto desde la cámara.
 *
 * @param {number} k Nivel de anillo (puede tener decimales).
 * @returns {number} Radio, en unidades del juego.
 */
const rr = k => R0 + (k - camLevel) * GAP;

export { rr };

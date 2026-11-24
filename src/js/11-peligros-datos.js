/**
 * Datos y estado de los peligros que no son asteroides: en qué anillos aparece cada uno en cada
 * nivel (las tablas `*_AT` van por índice de nivel y luego por nivel de anillo).
 * Cometas (desde el Sombrero): cruzan entre tu anillo y el siguiente; su cola apunta lejos del
 * agujero negro. Rayos de energía (desde M87): un anillo brilla como aviso y luego dispara.
 * Llamaradas y estrellas veloces (Sagitario A*).
 */

let COMET_AT;
const COMET_TIME = { 5: 2.4, 6: 1.9, 7: 1.8 }; // Segundos que tarda el cometa en alcanzarte.
let BEAM_AT;
let FLARE_AT;
let comets = [],
  beams = [],
  flareT = 0,
  flareWarn = 0,
  sstars = [],
  beamCount = 0;
// Nubes de Magallanes: onda de supernova (como la 1987A). Sale del centro al ritmo de la música y
// se apaga en un anillo límite (marcado en rosa). Si cruzas ese anillo antes de que llegue, estás a
// salvo. Si te alcanza, tu planeta se sobrecalienta y se queda así el resto del intento; un segundo
// golpe te destruye. Sale justo antes de una muralla o un contragiro: o pasas el primer hueco o te
// alcanza. El valor de cada anillo es a cuántos anillos queda el anillo límite.
const SN_AT = { 1: { 5: 1, 19: 1, 27: 1, 32: 1, 35: 1, 40: 2 } };
let waves = [],
  hot = 0,
  hotT = 0,
  skyFlash = 0;
// Andrómeda: nova recurrente (como la M31N 2008-12a, que estalla cada año). Una estrella fuera del
// centro lanza, al ritmo de la música, cáscaras de gas verde esmeralda (oxígeno). Las cáscaras
// cruzan los anillos de lado: si saltas a través de un filamento, mueres; por un hueco, pasas.
let novaSrc = [];

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initHazardData() {
  COMET_AT = {
    5: new Set([5, 9, 15, 21, 26, 31, 38, 44]),
    6: new Set([9, 13, 17, 22, 26, 30, 34, 38, 42, 46]),
    7: new Set([10, 16, 22, 29, 35, 43, 48]),
  };
  BEAM_AT = {
    6: new Set([7, 11, 15, 19, 24, 28, 32, 36, 40, 44, 47]),
    7: new Set([8, 14, 20, 27, 33, 39, 44]),
  };
  FLARE_AT = { 7: new Set([6, 12, 18, 24, 30, 36, 41, 46]) };
}

/**
 * Cambia `beamCount` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setBeamCount(value) {
  beamCount = value;
  return value;
}

/**
 * Cambia `beams` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setBeams(value) {
  beams = value;
  return value;
}

/**
 * Cambia `comets` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setComets(value) {
  comets = value;
  return value;
}

/**
 * Cambia `flareT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setFlareT(value) {
  flareT = value;
  return value;
}

/**
 * Cambia `flareWarn` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setFlareWarn(value) {
  flareWarn = value;
  return value;
}

/**
 * Cambia `hot` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHot(value) {
  hot = value;
  return value;
}

/**
 * Cambia `hotT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHotT(value) {
  hotT = value;
  return value;
}

/**
 * Cambia `novaSrc` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setNovaSrc(value) {
  novaSrc = value;
  return value;
}

/**
 * Cambia `skyFlash` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setSkyFlash(value) {
  skyFlash = value;
  return value;
}

/**
 * Cambia `sstars` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setSstars(value) {
  sstars = value;
  return value;
}

/**
 * Cambia `waves` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setWaves(value) {
  waves = value;
  return value;
}

export {
  BEAM_AT,
  COMET_AT,
  COMET_TIME,
  FLARE_AT,
  SN_AT,
  beamCount,
  beams,
  comets,
  flareT,
  flareWarn,
  hot,
  hotT,
  novaSrc,
  skyFlash,
  sstars,
  waves,
};

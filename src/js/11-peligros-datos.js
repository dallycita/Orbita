/**
 * Datos y estado de los peligros que no son asteroides: en qué anillos aparece cada uno en cada
 * nivel (las tablas `*_AT` van por índice de nivel y luego por nivel de anillo).
 * Cometas (desde el Sombrero): cruzan entre tu anillo y el siguiente; su cola apunta lejos del
 * agujero negro. Rayos de energía (desde M87): un anillo brilla como aviso y luego dispara.
 * Llamaradas y estrellas veloces (Sagitario A*).
 */

let comets = [];
let beams = [];
let flareT = 0;
let flareWarn = 0;
let sstars = [];
let beamCount = 0;
let waves = [];
let hot = 0;
let hotT = 0;
let skyFlash = 0;
// Andrómeda: nova recurrente (como la M31N 2008-12a, que estalla cada año). Una estrella fuera del
// centro lanza, al ritmo de la música, cáscaras de gas verde esmeralda (oxígeno). Las cáscaras
// cruzan los anillos de lado: si saltas a través de un filamento, mueres; por un hueco, pasas.
let novaSrc = [];

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

export { beamCount, beams, comets, flareT, flareWarn, hot, hotT, novaSrc, skyFlash, sstars, waves };

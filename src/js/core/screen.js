/**
 * (encabezado pendiente)
 */

let introFade = 0;

/**
 * Cambia `introFade` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setIntroFade(value) {
  introFade = value;
  return value;
}

const HOME_IN = 8.0;

let logoT0 = -99;

let camZoom = 1;

let homeT = HOME_IN;

/**
 * Cambia `camZoom` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setCamZoom(value) {
  camZoom = value;
  return value;
}

/**
 * Cambia `homeT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setHomeT(value) {
  homeT = value;
  return value;
}

/**
 * Cambia `logoT0` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setLogoT0(value) {
  logoT0 = value;
  return value;
}

let paused = false;

/**
 * Cambia `paused` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setPaused(value) {
  paused = value;
  return value;
}

let pendingTut = false;

/**
 * Cambia `pendingTut` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setPendingTut(value) {
  pendingTut = value;
  return value;
}

export {
  HOME_IN,
  camZoom,
  homeT,
  introFade,
  logoT0,
  paused,
  pendingTut,
  setCamZoom,
  setHomeT,
  setIntroFade,
  setLogoT0,
  setPaused,
  setPendingTut,
};

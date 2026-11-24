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

/** Si el jugador ya vio la historia de introducción (se guarda en localStorage). */
let storySeen = false;

// todos los niveles están abiertos desde el inicio
// tutAfterStory: al terminar la historia sigue el tutorial ("Repetir tutorial").
// pendingTut: al tocar en el menú empieza el tutorial en vez de la partida.
let tutAfterStory = false;

/**
 * Cambia `storySeen` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setStorySeen(value) {
  storySeen = value;
  return value;
}

/**
 * Cambia `tutAfterStory` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setTutAfterStory(value) {
  tutAfterStory = value;
  return value;
}

let storyReturn = null;

/**
 * Cambia `storyReturn` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setStoryReturn(value) {
  storyReturn = value;
  return value;
}

/** Pantallas registradas: nombre → función que la abre. */
const screens = new Map();

/**
 * Registra una pantalla para que otras la abran por su nombre, sin importarla (así las pantallas no dependen unas
 * de otras en círculo).
 *
 * @param {string} name Nombre de la pantalla ('home', 'levels', 'intro'…).
 * @param {Function} open Función que la abre.
 */
function registerScreen(name, open) {
  screens.set(name, open);
}

/**
 * Abre una pantalla registrada, en el momento (igual que llamar a su función).
 *
 * @param {string} name Nombre de la pantalla.
 * @param {...*} args Lo que recibe su función de abrir.
 * @returns {*} Lo que devuelve su función de abrir.
 */
function openScreen(name, ...args) {
  return screens.get(name)(...args);
}

export {
  HOME_IN,
  camZoom,
  homeT,
  introFade,
  logoT0,
  openScreen,
  paused,
  pendingTut,
  registerScreen,
  setCamZoom,
  setHomeT,
  setIntroFade,
  setLogoT0,
  setPaused,
  setPendingTut,
  setStoryReturn,
  setStorySeen,
  setTutAfterStory,
  storyReturn,
  storySeen,
  tutAfterStory,
};

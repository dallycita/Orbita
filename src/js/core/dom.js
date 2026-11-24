/**
 * Elementos de la página que usan varias pantallas (inicio, niveles y planetas).
 * Se buscan una sola vez al arrancar.
 */

let elLv;

/**
 * Cambia `elLv` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setElLv(value) {
  elLv = value;
  return value;
}

let elHome;

/**
 * Cambia `elHome` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setElHome(value) {
  elHome = value;
  return value;
}

let elPl;

/**
 * Cambia `elPl` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setElPl(value) {
  elPl = value;
  return value;
}

export { elHome, elLv, elPl, setElHome, setElLv, setElPl };

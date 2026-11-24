/**
 * (encabezado pendiente)
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

export { elLv, setElLv };

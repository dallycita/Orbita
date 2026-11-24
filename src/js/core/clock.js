/**
 * Reloj del bucle: el momento del último cuadro, para medir cuánto tiempo pasó entre cuadros.
 */

// Momento del cuadro anterior, en milisegundos (`performance.now`).
let last;

/**
 * Cambia `last` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setLast(value) {
  last = value;
  return value;
}

export { last, setLast };

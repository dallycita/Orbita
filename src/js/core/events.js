/**
 * Avisos entre módulos: un módulo de una capa de abajo avisa que pasó algo y uno de una capa de arriba reacciona,
 * sin que el de abajo dependa del de arriba. Cada aviso se entrega en el momento (no después), a los oyentes en
 * el orden en que se registraron.
 */

/** @type {Map<string, Function[]>} Oyentes de cada aviso. */
const listeners = new Map();

/**
 * Registra una función que se llama cada vez que llega el aviso.
 *
 * @param {string} name Nombre del aviso.
 * @param {Function} listener Función que recibe los datos del aviso.
 */
function on(name, listener) {
  if (!listeners.has(name)) {
    listeners.set(name, []);
  }
  listeners.get(name).push(listener);
}

/**
 * Avisa a todos los oyentes registrados, en orden.
 *
 * @param {string} name Nombre del aviso.
 * @param {...*} args Datos del aviso.
 */
function emit(name, ...args) {
  for (const listener of listeners.get(name) || []) {
    listener(...args);
  }
}

export { emit, on };

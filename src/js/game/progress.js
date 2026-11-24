/**
 * (encabezado pendiente)
 */

/**
 * Lee las estrellas ganadas en un nivel.
 *
 * @param {number} i Índice del nivel en LEVELS.
 * @returns {number[]} Las estrellas conseguidas (lista vacía si no hay o no hay localStorage).
 */
function lvStarsGot(i) {
  try {
    const all = JSON.parse(localStorage.getItem('orbita_lvstars') || '{}');
    return Array.isArray(all[i]) ? all[i] : [];
  } catch (e) {
    return [];
  }
}

export { lvStarsGot };

/**
 * Funciones de números compartidas (curvas de suavizado).
 */

const easeIO = x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export { easeIO };

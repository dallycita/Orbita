/**
 * Recorridos fijos de los niveles 1 a 3: qué tipo de anillo hay en cada posición, y el generador
 * aleatorio con semilla fija que hace que cada partida sea igual.
 */
// Generador con semilla fija: el recorrido es siempre el mismo, como un nivel de Geometry Dash.
const SEED = 20261007;
let rngState = SEED;
/**
 * Número aleatorio repetible (algoritmo mulberry32) a partir de `rngState`.
 *
 * @returns {number} Número entre 0 (incluido) y 1 (excluido).
 */
function rng() {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let x = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}
// Tipos de anillo con su nombre y su consejo. Se presentan uno por uno y luego se mezclan en
// bloques de 2 a 4 anillos.
const TYPE_INFO = {
  muralla: ['Muralla', 'Espera el hueco'],
  respiracion: ['Respiración', 'Salta cuando se encojan'],
  contragiro: ['Contragiro', 'Salta cuando se separen'],
  freno: ['Freno', 'Cambia de dirección'],
  escalera: ['Escalera', 'Salta seguido'],
  orbita: ['Órbita', 'Toca para cambiar de sentido'],
  marea: ['Fuerzas de marea', 'Acelera y frena: espera el hueco'],
  nova: ['Nova', 'Salta cuando estalle'],
  arrastre: ['Arrastre del espacio', 'Te lleva consigo: salta cuando coincidas'],
};
// Recorridos como bloques [cantidad de anillos, tipo].
const COURSE = [
  [6, 'clasico'],
  [2, 'muralla'],
  [3, 'clasico'],
  [3, 'respiracion'],
  [3, 'clasico'],
  [3, 'escalera'],
  [3, 'clasico'],
  [3, 'muralla'],
  [2, 'clasico'],
  [3, 'respiracion'],
  [2, 'clasico'],
  [3, 'escalera'],
  [2, 'clasico'],
  [3, 'muralla'],
  [2, 'clasico'],
  [3, 'respiracion'],
  [3, 'escalera'],
]; // nivel 1: 49 anillos + la salida
const COURSE2 = [
  [5, 'clasico'],
  [2, 'muralla'],
  [3, 'clasico'],
  [3, 'contragiro'],
  [3, 'clasico'],
  [3, 'respiracion'],
  [3, 'contragiro'],
  [2, 'clasico'],
  [3, 'escalera'],
  [3, 'contragiro'],
  [2, 'clasico'],
  [3, 'muralla'],
  [3, 'contragiro'],
  [2, 'clasico'],
  [3, 'respiracion'],
  [3, 'contragiro'],
  [3, 'escalera'],
]; // nivel 2: 49 anillos + la salida
const COURSE3 = [
  [5, 'clasico'],
  [2, 'muralla'],
  [4, 'clasico'],
  [3, 'contragiro'],
  [3, 'respiracion'],
  [5, 'clasico'],
  [3, 'escalera'],
  [2, 'clasico'],
  [3, 'contragiro'],
  [5, 'clasico'],
  [3, 'muralla'],
  [3, 'respiracion'],
  [5, 'clasico'],
  [3, 'escalera'],
]; // nivel 3: 49 anillos + la salida
// Mapas anillo por anillo (el anillo 0 es el inicial), rellenados con clásicos hasta 60.
const courseMap3 = ['clasico'];
for (const [n, ty] of COURSE3) {
  for (let i = 0; i < n; i++) {
    courseMap3.push(ty);
  }
}
while (courseMap3.length < 60) {
  courseMap3.push('clasico');
}
const courseMap2 = ['clasico'];
for (const [n, ty] of COURSE2) {
  for (let i = 0; i < n; i++) {
    courseMap2.push(ty);
  }
}
while (courseMap2.length < 60) {
  courseMap2.push('clasico');
}
const courseMap = ['clasico'];
(function buildCourse() {
  for (const [n, ty] of COURSE) {
    for (let i = 0; i < n; i++) {
      courseMap.push(ty);
    }
  }
  while (courseMap.length < 60) {
    courseMap.push('clasico');
  }
})();
/**
 * Tipo del anillo `k` en el nivel actual (o en el tutorial); la salida (`GOAL`) es una muralla.
 *
 * @param {number} k Nivel de anillo.
 * @returns {string} Tipo de anillo.
 */
const ringType = k =>
  tutorial
    ? TUT_TYPES[k] || 'vacio'
    : k === GOAL
      ? 'muralla'
      : (lvl >= 3 ? courseMaps[lvl] : lvl === 2 ? courseMap3 : lvl === 1 ? courseMap2 : courseMap)[
          Math.min(k, 59)
        ];
// Tipos de anillo ya presentados al jugador, guardados en `orbita_p1_vistos`.
let seenTypes = {};
try {
  seenTypes = JSON.parse(localStorage.getItem('orbita_p1_vistos') || '{}') || {};
} catch (e) {
  seenTypes = {};
}

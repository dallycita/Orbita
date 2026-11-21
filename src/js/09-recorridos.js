// generador con semilla fija: el recorrido es siempre el mismo, como un nivel de Geometry Dash
const SEED = 20261007;
let rngState = SEED;
function rng() {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let x = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}
// tipos de anillo: se presentan uno por uno y luego se mezclan en bloques de 2 a 4 anillos
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
const courseMap3 = ['clasico'];
for (const [n, ty] of COURSE3) for (let i = 0; i < n; i++) courseMap3.push(ty);
while (courseMap3.length < 60) courseMap3.push('clasico');
const courseMap2 = ['clasico'];
for (const [n, ty] of COURSE2) for (let i = 0; i < n; i++) courseMap2.push(ty);
while (courseMap2.length < 60) courseMap2.push('clasico');
const courseMap = ['clasico'];
(function buildCourse() {
  for (const [n, ty] of COURSE) for (let i = 0; i < n; i++) courseMap.push(ty);
  while (courseMap.length < 60) courseMap.push('clasico');
})();
const ringType = k =>
  tutorial
    ? TUT_TYPES[k] || 'vacio'
    : k === GOAL
      ? 'muralla'
      : (lvl >= 3 ? courseMaps[lvl] : lvl === 2 ? courseMap3 : lvl === 1 ? courseMap2 : courseMap)[
          Math.min(k, 59)
        ];
let seenTypes = {};
try {
  seenTypes = JSON.parse(localStorage.getItem('orbita_p1_vistos') || '{}') || {};
} catch (e) {
  seenTypes = {};
}

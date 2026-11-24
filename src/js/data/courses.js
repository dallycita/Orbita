/**
 * Los recorridos: qué tipo de anillo toca en cada nivel de cada galaxia, y el nombre y la
 * pista que se muestran la primera vez que aparece cada tipo.
 */

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
];

// nivel 1: 49 anillos + la salida
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
];

// nivel 2: 49 anillos + la salida
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
];

// nivel 3: 49 anillos + la salida
// Mapas anillo por anillo (el anillo 0 es el inicial), rellenados con clásicos hasta 60.
const courseMap3 = ['clasico'];

const courseMap2 = ['clasico'];

const courseMap = ['clasico'];

export { COURSE, COURSE2, COURSE3, TYPE_INFO, courseMap, courseMap2, courseMap3 };

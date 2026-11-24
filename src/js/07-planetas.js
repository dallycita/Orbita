/**
 * Planetas que se rescatan y se juegan: sus datos reales, poderes, cómo se desbloquean, cuál está
 * elegido y cómo sus estadísticas cambian el juego (tamaño, salto, resistencia, carga).
 * Las estadísticas st son porcentajes respecto a la Tierra; el balance se revisa con simulaciones.
 */
import { bestOf, bestRing } from './06-record-y-estado.js';
import { JUMP_DUR, perfCount } from './08-partida-estado.js';

import { GOAL } from './data/levels.js';

// Planeta elegido, récord de Perfectos en una partida, secreto de Plutón, truco de todos los
// planetas, cargas de escudo y si se usó el salto doble en la partida.
let curPlanet = 'tierra';
let maxPerf = 0;
let plutoOk = false;
let allPlanets = false;
let shieldLeft = 0;
let usedDouble = false;
/**
 * @param {object} P Planeta de PLANETS_P.
 * @returns {boolean} true si está desbloqueado.
 */
const planetOk = P => allPlanets || P.ok();
/** @returns {object} Datos del planeta elegido (la Tierra si no se encuentra). */
const curP = () => PLANETS_P.find(P => P.id === curPlanet) || PLANETS_P[3];
/** @returns {object} Estadísticas del planeta elegido. */
const pst = () => curP().st;
/** @returns {number} Perfectos necesarios para cargar el poder (de la rotación real). */
const chargeMax = () => pst().charge;
/**
 * Factor de tamaño del planeta según su diámetro real: de Plutón (×0.85) a Júpiter (×1.22), se
 * nota sin ser abismal.
 *
 * @returns {number} Multiplicador del radio.
 */
const sizeK = () => 1 + (pst().size / 100) * 0.7;
/**
 * Duración del salto según la velocidad orbital real: los lentos flotan hasta ~40 % más tiempo.
 *
 * @returns {number} Duración, en segundos.
 */
const jumpDur = () => Math.max(0.09, JUMP_DUR * (1 - (pst().vel / 100) * 0.75));
/**
 * Margen con que el agujero negro alcanza al planeta según su densidad real: los menos densos se
 * despedazan antes por la marea (hasta ~media vuelta de anillo antes).
 *
 * @returns {number} Margen, en niveles de anillo.
 */
const catchMargin = () => 0.18 - (pst().res / 100) * 0.6;
/** @returns {string[]} Identificadores de los planetas desbloqueados. */
const unlockedIds = () => PLANETS_P.filter(planetOk).map(P => P.id);
/** Guarda que hay planetas recién rescatados, para avisar en el menú. */
function markNewPlanets() {
  try {
    localStorage.setItem('orbita_pl_nuevo', '1');
  } catch (e) {}
}
/** Guarda el récord de Perfectos en una partida, que desbloquea a Mercurio y Urano. */
function saveRunStats() {
  if (perfCount > maxPerf) {
    maxPerf = perfCount;
    try {
      localStorage.setItem('orbita_p1_maxperf', String(maxPerf));
    } catch (e) {}
  }
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initPlanets() {
  try {
    curPlanet = localStorage.getItem('orbita_p1_planeta') || 'tierra';
    maxPerf = parseInt(localStorage.getItem('orbita_p1_maxperf') || '0', 10) || 0;
    plutoOk = localStorage.getItem('orbita_p1_pluton') === '1';
    allPlanets = localStorage.getItem('orbita_p1_todos') === '1';
  } catch (e) {}
  if (!PLANETS_P.some(P => P.id === curPlanet)) {
    curPlanet = 'tierra';
  }
}

/**
 * Cambia `allPlanets` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setAllPlanets(value) {
  allPlanets = value;
  return value;
}

/**
 * Cambia `curPlanet` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCurPlanet(value) {
  curPlanet = value;
  return value;
}

/**
 * Cambia `maxPerf` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setMaxPerf(value) {
  maxPerf = value;
  return value;
}

/**
 * Cambia `plutoOk` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPlutoOk(value) {
  plutoOk = value;
  return value;
}

/**
 * Cambia `shieldLeft` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setShieldLeft(value) {
  shieldLeft = value;
  return value;
}

/**
 * Cambia `usedDouble` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setUsedDouble(value) {
  usedDouble = value;
  return value;
}

// Estadísticas sacadas de datos reales: size del diámetro (escala logarítmica), vel de la
// velocidad orbital, res de la densidad (resistencia a la fuerza de marea) y charge de la
// rotación (cuántos Perfectos hacen falta para cargar el poder).
const PLANETS_P = [
  {
    id: 'luna',
    name: 'Luna',
    col: '#cfcfcf',
    desc: 'La única luna de la Tierra. Su gravedad es una sexta parte de la nuestra, y provoca las mareas y los eclipses.',
    how: 'Rescátala escapando del Sistema solar',
    ok: () => bestOf(0) >= GOAL,
    d: '3474 km',
    v: '1,0 km/s alrededor de la Tierra',
    rho: '3,34 g/cm³',
    day: '27,3 días',
    st: { size: -17, vel: -40, res: -15, charge: 3 },
    power: [
      'Eclipse',
      'Durante 2.5 segundos, todo pasa en cámara lenta.',
      'La Luna es la que provoca los eclipses de Sol.',
    ],
  },
  {
    id: 'mercurio',
    name: 'Mercurio',
    col: '#b3a597',
    desc: 'El planeta más cercano al Sol y el más veloz: da una vuelta completa en solo 88 días.',
    how: 'Rescátalo consiguiendo 15 Perfectos en una partida',
    ok: () => maxPerf >= 15,
    d: '4879 km',
    v: '47,4 km/s',
    rho: '5,43 g/cm³',
    day: '58,6 días',
    st: { size: -13, vel: 7, res: 0, charge: 3 },
    power: [
      'Perihelio',
      'Tus dos siguientes saltos son instantáneos.',
      'En su perihelio, el punto más cercano al Sol, Mercurio va a casi 59 km/s.',
    ],
  },
  {
    id: 'venus',
    name: 'Venus',
    col: '#e8cf8f',
    desc: 'Gira al revés que casi todos los planetas, y tan lento que su día dura más que su año.',
    how: 'Rescátala completando Andrómeda',
    ok: () => bestOf(2) >= GOAL,
    d: '12 104 km',
    v: '35,0 km/s',
    rho: '5,24 g/cm³',
    day: '243 días (al revés)',
    st: { size: -1, vel: 2, res: -2, charge: 3 },
    power: [
      'Efecto invernadero',
      'Derrite los dos asteroides más cercanos del anillo de arriba.',
      'Venus es el planeta más caliente del Sistema solar: 465 °C, aunque Mercurio está más cerca del Sol.',
    ],
  },
  {
    id: 'tierra',
    name: 'Tierra',
    col: '#3d8bff',
    desc: 'Nuestro hogar, el único lugar con vida que conocemos, y el planeta más denso del sistema solar.',
    how: 'Disponible desde el inicio',
    ok: () => true,
    d: '12 742 km',
    v: '29,8 km/s',
    rho: '5,51 g/cm³',
    day: '23,9 horas',
    st: { size: 0, vel: 0, res: 0, charge: 3 },
    power: [
      'Salto doble',
      'Atraviesa un anillo completo de un salto.',
      'La Tierra es el punto de equilibrio: todas las estadísticas se comparan con ella.',
    ],
  },
  {
    id: 'marte',
    name: 'Marte',
    col: '#d0603f',
    desc: 'El planeta rojo, cubierto de óxido de hierro. Tiene el volcán más alto del sistema solar.',
    how: 'Rescátalo llegando al anillo 20 del Sistema solar',
    ok: () => bestRing >= 20,
    d: '6779 km',
    v: '24,1 km/s',
    rho: '3,93 g/cm³',
    day: '24,6 horas',
    st: { size: -8, vel: -3, res: -11, charge: 5 },
    power: [
      'Monte Olimpo',
      'Un salto triple que sube tres anillos.',
      'El Monte Olimpo mide unos 22 km de alto, casi tres veces el Everest.',
    ],
  },
  {
    id: 'jupiter',
    name: 'Júpiter',
    col: '#d7a86e',
    desc: 'El gigante del sistema solar: tiene más del doble de masa que todos los demás planetas juntos.',
    how: 'Rescátalo completando el Remolino',
    ok: () => bestOf(4) >= GOAL,
    d: '139 820 km',
    v: '13,1 km/s',
    rho: '1,33 g/cm³',
    day: '9,9 horas',
    st: { size: 31, vel: -12, res: -38, charge: 3 },
    power: [
      'Empujón gravitacional',
      'Aleja al agujero negro un anillo.',
      'Su gravedad es tan fuerte que desvía cometas y asteroides.',
    ],
  },
  {
    id: 'saturno',
    name: 'Saturno',
    col: '#e6cf8f',
    desc: 'Sus anillos son de hielo y roca, y es tan poco denso que flotaría en el agua.',
    how: 'Rescátalo completando el Sistema solar',
    ok: () => bestRing >= GOAL,
    d: '116 460 km',
    v: '9,7 km/s',
    rho: '0,69 g/cm³',
    day: '10,7 horas',
    st: { size: 29, vel: -17, res: -50, charge: 4 },
    power: [
      'Anillos protectores',
      'Durante 1.5 segundos, ningún asteroide puede tocarte.',
      'Sus anillos miden unos 280 000 km de ancho, pero en muchas partes no superan los 10 metros de grosor.',
    ],
  },
  {
    id: 'urano',
    name: 'Urano',
    col: '#8fd3e0',
    desc: 'Gira acostado de lado, y tiene la atmósfera más fría que se ha medido en un planeta: unos −224 °C.',
    how: 'Rescátalo consiguiendo 10 Perfectos en una partida',
    ok: () => maxPerf >= 10,
    d: '50 724 km',
    v: '6,8 km/s',
    rho: '1,27 g/cm³',
    day: '17,2 horas',
    st: { size: 18, vel: -22, res: -39, charge: 2 },
    power: [
      'Congelar',
      'Detiene el giro de los dos anillos de arriba durante 3 segundos.',
      'Su eje está inclinado unos 98 grados: rueda alrededor del Sol.',
    ],
  },
  {
    id: 'neptuno',
    name: 'Neptuno',
    col: '#3f6fd6',
    desc: 'El planeta más lejano del Sol, con los vientos más rápidos del sistema solar: unos 2000 km/h.',
    how: 'Rescátalo llegando al anillo 30 del Sistema solar',
    ok: () => bestRing >= 30,
    d: '49 244 km',
    v: '5,4 km/s',
    rho: '1,64 g/cm³',
    day: '16,1 horas',
    st: { size: 18, vel: -26, res: -33, charge: 4 },
    power: [
      'Predicción',
      'Durante 3 segundos ves dónde estarán los asteroides cuando caigas.',
      'Fue el primer planeta descubierto con matemáticas: en 1846 calcularon dónde estaba antes de verlo.',
    ],
  },
  {
    id: 'pluton',
    name: 'Plutón',
    col: '#d9c7b4',
    desc: 'Desde 2006 es un planeta enano, pero no se rinde. Tiene un enorme corazón de hielo en su superficie.',
    how: 'Secreto: completa el Sistema solar sin usar tu poder',
    secret: true,
    ok: () => plutoOk,
    d: '2377 km',
    v: '4,7 km/s',
    rho: '1,85 g/cm³',
    day: '6,4 días',
    st: { size: -22, vel: -28, res: -31, charge: 9 },
    power: [
      'Caronte',
      'Cuando está cargado, tu luna Caronte se interpone una vez si algo te iba a destruir.',
      'Caronte mide la mitad que Plutón: ambos giran alrededor de un punto entre ellos.',
    ],
  },
  {
    id: 'sol',
    name: 'Sol',
    col: '#ffb347',
    desc: 'Nuestra estrella. Lo primero que se tragó el agujero negro. Traerlo de vuelta es la meta final.',
    how: 'Rescátalo venciendo a Sagitario A*',
    ok: () => bestOf(7) >= GOAL,
    d: '1 392 700 km',
    v: '230 km/s alrededor de la galaxia',
    rho: '1,41 g/cm³',
    day: 'unos 25 días',
    st: { size: 50, vel: 31, res: -36, charge: 4 },
    power: [
      'Arder',
      'Durante 1.5 segundos, los asteroides que toques se vuelven plasma.',
      'En el Sol cabrían más de un millón de Tierras.',
    ],
  },
];

/**
 * Los planetas que se desbloquearon desde `before` (por ejemplo, al terminar una partida).
 *
 * @param {string[]} before Ids de los planetas desbloqueados antes.
 * @returns {object[]} Los planetas nuevos, en el orden de PLANETS_P.
 */
function rescuedPlanets(before) {
  const now = unlockedIds();
  return PLANETS_P.filter(P => now.includes(P.id) && !before.includes(P.id));
}

export {
  PLANETS_P,
  allPlanets,
  catchMargin,
  chargeMax,
  curP,
  curPlanet,
  jumpDur,
  markNewPlanets,
  maxPerf,
  planetOk,
  plutoOk,
  pst,
  rescuedPlanets,
  saveRunStats,
  shieldLeft,
  sizeK,
  unlockedIds,
  usedDouble,
};

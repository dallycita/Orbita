/**
 * Estado compartido de la partida: contadores, tutorial, gestos, rachas, reloj del juego (`t`) y
 * listas de efectos en pantalla. Solo declara variables; las cambian muchos archivos.
 */

// winT: segundos desde que se ganó; perfCount: saltos perfectos; attempts: intentos guardados
let winT = 0,
  perfCount = 0,
  attempts = 0;
try {
  attempts = parseInt(localStorage.getItem('orbita_p1_intentos') || '0', 10) || 0;
} catch (e) {
  attempts = 0;
}
// Tutorial: los primeros 10 anillos de la huida, una cosa a la vez.
// TUT_TYPES da el tipo de cada anillo y TUT_TIPS el consejo que se muestra en él.
const TUT_GOAL = 10;
const TUT_TYPES = [
  'vacio',
  'vacio',
  'vacio',
  'uno',
  'uno',
  'muralla',
  'respiracion',
  'escalera',
  'escalera',
  'barrera',
  'vacio',
];
const TUT_TIPS = [
  'Toca para saltar al anillo de arriba.',
  '¡Eso! Una vez más.',
  'Espera a que el hueco pase sobre ti y salta.',
  'Bien. El agujero negro no espera: no te quedes quieto.',
  'Muralla: espera uno de sus huecos.',
  'Respiración: salta cuando se encojan.',
  'Escalera: los huecos están alineados. Salta seguido.',
  '¡Sigue!',
  'Una barrera sin huecos. Desliza hacia arriba para el salto doble.',
];
let tutorial = false,
  tutorialDone = true; // el tutorial no se impone al empezar: se aprende jugando
/**
 * Meta de la partida actual.
 *
 * @returns {number} Nivel de anillo que hay que alcanzar (TUT_GOAL en el tutorial).
 */
const curGoal = () => (tutorial ? TUT_GOAL : GOAL);
// brillo de cada marca de carga del poder al llenarse, de 0 a 1
const pipFlash = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let readyT = 0,
  chargeFlash = 0,
  readyHintDone = false;
try {
  readyHintDone = localStorage.getItem('orbita_p1_poderlisto') === '1';
} catch (e) {}
// gest: gesto en curso; pending: salto pedido que espera 0,09 s por si el gesto es un
// deslizamiento (salto doble); pendingT: segundos que lleva esperando
let gest = null,
  pending = false,
  pendingT = 0;
let hintsShown = 0;
try {
  hintsShown = parseInt(localStorage.getItem('orbita_p1_pista') || '0', 10) || 0;
} catch (e) {
  hintsShown = 0;
}
let showHint = false,
  hintT = 0;
let swallow = null,
  holeFlare = 0;
let streak = 0,
  jumpClear = 999,
  culprit = null,
  culpritT = 0,
  landPop = 0;
// holgura máxima con los asteroides para que un salto cuente como perfecto
const PERFECT = 12;
// t: reloj del juego, en segundos; timeScale y slowTimer: cámara lenta
let t = 0,
  timeScale = 1,
  slowTimer = 0,
  shake = 0,
  flash = 0,
  pulse = 0,
  deadT = 0,
  canRestart = false;
let particles = [],
  trail = [],
  texts = [],
  burns = [];
// sunLevel: nivel de anillo hasta donde llega el agujero negro; lastEaten: último anillo tragado
let sunLevel = -1.6,
  lastEaten = -2;
// restos que caen en espiral hacia el agujero negro (ángulo en radianes y distancia)
const debris = Array.from({ length: 60 }, () => ({
  a: Math.random() * Math.PI * 2,
  r: 60 + Math.random() * 180,
}));
// duración base de un salto entre anillos, en segundos (jumpDur la ajusta según el planeta)
const JUMP_DUR = 0.12;

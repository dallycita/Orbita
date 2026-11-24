/**
 * Base de todo el juego: el lienzo y su contexto 2D, los elementos del HUD, las medidas de pantalla
 * (W, H, centro CX/CY y escala S de unidades del mundo a píxeles), los colores de cada zona, el
 * cielo de estrellas y utilidades pequeñas (frac, clamp, buzz, rgba).
 */

let cvs;
let ctx;
let elScore;
let elBest;
let elPbar;
let elPnum;
let elWrap;
let elArcFg;
let hudMode = 'faltan';
let musicStyle = 'espacial';
/**
 * HTML de los botones de modo del HUD. Queda vacío: el indicador siempre muestra "Faltan N" y la
 * música cambia sola.
 *
 * @returns {string} HTML.
 */
function chipsHTML() {
  return '';
}
/** Marca como activo el botón (.chip) que corresponde a `hudMode` o a `musicStyle`. */
function refreshChips() {
  document
    .querySelectorAll('.chip')
    .forEach(c =>
      c.classList.toggle(
        'on',
        c.dataset.mode ? c.dataset.mode === hudMode : c.dataset.music === musicStyle,
      ),
    );
}
let elHud;
let elPanel;
let reduceMotion;

// ---- Medidas ----
// W y H: tamaño del lienzo, en píxeles CSS; DPR: densidad de píxeles (hasta 2); S: píxeles por
// unidad del mundo; CX y CY: centro del agujero negro en pantalla.
let W;
let H;
let DPR;
let S;
let CX;
let CY;
// En unidades del mundo: radio del primer anillo, distancia entre anillos, radio del planeta y
// radio mínimo del agujero negro.
const R0 = 96;
const GAP = 34;
const PR = 8;
const SUN = 16;
/**
 * Ajusta el lienzo al tamaño de la ventana y recalcula la escala para que quepa un área de
 * 340 × 500 unidades del mundo, con el agujero negro un poco por debajo del centro.
 */
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const r = cvs.getBoundingClientRect();
  W = r.width;
  H = r.height;
  cvs.width = Math.round(W * DPR);
  cvs.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  S = Math.min(W / 2 / 170, H / 2 / 250);
  CX = W / 2;
  CY = H * 0.62;
}

// ---- Zonas: colores de anillos, asteroides, agujero negro y fondo (cambian cada 25 anillos) ----
// Color hueso de la interfaz y de los anillos.
const BONE = '#ece6d8';
/**
 * Convierte un color '#rrggbb' en 'rgba(…)' con la opacidad dada.
 *
 * @param {string} hex Color en formato '#rrggbb'.
 * @param {number} a Opacidad, de 0 a 1.
 * @returns {string} Color CSS rgba.
 */
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

// ---- Estrellas del cielo: ángulo (rad), distancia al centro (de 0 a 1,2 del radio del cielo),
// tamaño (px) y fase del titileo ----
let stars;

// ---- Utilidades ----
/** Parte fraccionaria de x, de 0 a 1 (también para negativos). */
const frac = x => x - Math.floor(x);
/** Limita v al intervalo de a a b. */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/**
 * Hace vibrar el teléfono, si el navegador lo permite.
 *
 * @param {number|number[]} p Duración en milisegundos, o patrón [vibra, pausa, vibra…].
 */
const buzz = p => {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(p);
    }
  } catch (e) {}
};

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initScreen() {
  cvs = document.getElementById('c');
  ctx = cvs.getContext('2d');
  elScore = document.getElementById('score');
  elBest = document.getElementById('best');
  elPbar = document.getElementById('pbar');
  elPnum = document.getElementById('pnum');
  elWrap = document.getElementById('scorewrap');
  elArcFg = document.querySelector('#arc .fg');
  {
    const c0 = document.getElementById('chips0');
    if (c0) {
      c0.innerHTML = chipsHTML();
    }
  }
  elHud = document.getElementById('hud');
  elPanel = document.getElementById('panel');
  reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.addEventListener('resize', resize);
  resize();
  stars = Array.from({ length: 140 }, () => ({
    a: Math.random() * Math.PI * 2,
    r: Math.sqrt(Math.random()) * 1.2,
    s: Math.random() * 1.3 + 0.3,
    tw: Math.random() * 6,
  }));
}

/**
 * Cambia `hudMode` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHudMode(value) {
  hudMode = value;
  return value;
}

/**
 * Cambia `musicStyle` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setMusicStyle(value) {
  musicStyle = value;
  return value;
}

export {
  BONE,
  CX,
  CY,
  DPR,
  GAP,
  H,
  PR,
  R0,
  S,
  SUN,
  W,
  buzz,
  chipsHTML,
  clamp,
  ctx,
  cvs,
  elArcFg,
  elBest,
  elHud,
  elPanel,
  elPbar,
  elPnum,
  elScore,
  elWrap,
  frac,
  hudMode,
  musicStyle,
  reduceMotion,
  refreshChips,
  rgba,
  stars,
};

/**
 * Base de todo el juego: el lienzo y su contexto 2D, los elementos del HUD, las medidas de pantalla
 * (W, H, centro CX/CY y escala S de unidades del mundo a píxeles), los colores de cada zona, el
 * cielo de estrellas y utilidades pequeñas (frac, clamp, buzz, rgba).
 */
const cvs = document.getElementById('c'),
  ctx = cvs.getContext('2d');
const elScore = document.getElementById('score'),
  elBest = document.getElementById('best');
const elPbar = document.getElementById('pbar'),
  elPnum = document.getElementById('pnum');
const elWrap = document.getElementById('scorewrap'),
  elArcFg = document.querySelector('#arc .fg');
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
{
  const c0 = document.getElementById('chips0');
  if (c0) {
    c0.innerHTML = chipsHTML();
  }
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
const elHud = document.getElementById('hud'),
  elPanel = document.getElementById('panel');
const reduceMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Medidas ----
// W y H: tamaño del lienzo, en píxeles CSS; DPR: densidad de píxeles (hasta 2); S: píxeles por
// unidad del mundo; CX y CY: centro del agujero negro en pantalla.
let W, H, DPR, S, CX, CY;
// En unidades del mundo: radio del primer anillo, distancia entre anillos, radio del planeta y
// radio mínimo del agujero negro.
const R0 = 96,
  GAP = 34,
  PR = 8,
  SUN = 16;
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
window.addEventListener('resize', resize);
resize();

// ---- Zonas: colores de anillos, asteroides, agujero negro y fondo (cambian cada 25 anillos) ----
// Color hueso de la interfaz y de los anillos.
const BONE = '#ece6d8';
const ZONES = [
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#0d1220' },
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#120f1e' },
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#0f1220' },
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#120c22' },
];
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
const ZONE_AND = { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#060714' };
const ZONE_MAG = { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#04070e' };
const ZONE_LV = {
  3: { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#07060a' },
  4: { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#050712' },
  5: { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#05050a' },
  6: { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#07050a' },
  7: { ring: '#ece6d8', ast: '#ece6d8', s1: '#ffe2b0', s2: '#ff5a1f', bg: '#0a0607' },
};
/**
 * Colores de la zona de un anillo: cada nivel lejano tiene los suyos; en el Sistema solar y el
 * tutorial cambian cada 25 anillos.
 *
 * @param {number} k Nivel de anillo.
 * @returns {object} Zona {ring, ast, s1, s2, bg}.
 */
const zoneOf = k =>
  lvl >= 3 && !tutorial
    ? ZONE_LV[lvl]
    : lvl === 1 && !tutorial
      ? ZONE_MAG
      : lvl === 2 && !tutorial
        ? ZONE_AND
        : ZONES[Math.floor(k / 25) % ZONES.length];

// ---- Estrellas del cielo: ángulo (rad), distancia al centro (de 0 a 1,2 del radio del cielo),
// tamaño (px) y fase del titileo ----
const stars = Array.from({ length: 140 }, () => ({
  a: Math.random() * Math.PI * 2,
  r: Math.sqrt(Math.random()) * 1.2,
  s: Math.random() * 1.3 + 0.3,
  tw: Math.random() * 6,
}));

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

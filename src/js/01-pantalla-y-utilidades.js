const cvs = document.getElementById('c'),
  ctx = cvs.getContext('2d');
const elScore = document.getElementById('score'),
  elBest = document.getElementById('best');
const elPbar = document.getElementById('pbar'),
  elPnum = document.getElementById('pnum');
const elWrap = document.getElementById('scorewrap'),
  elArcFg = document.querySelector('#arc .fg');
// tres formas de mostrar el récord, para comparar
const MODES = [
  ['faltan', 'Faltan N'],
  ['arco', 'Arco'],
  ['nada', 'Nada'],
];
let hudMode = 'faltan';
const MUSICS = [
  ['espacial', 'Espacial'],
  ['synthwave', 'Synthwave'],
  ['phonk', 'Phonk'],
];
let musicStyle = 'espacial';
function chipsHTML() {
  return '';
} // indicador fijo en "Faltan N"; la música cambia sola
{
  const c0 = document.getElementById('chips0');
  if (c0) {
    c0.innerHTML = chipsHTML();
  }
}
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

// ---------- medidas ----------
let W, H, DPR, S, CX, CY;
const R0 = 96,
  GAP = 34,
  PR = 8,
  SUN = 16;
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

// ---------- zonas (cambian cada 25 anillos) ----------
const BONE = '#ece6d8';
const ZONES = [
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#0d1220' },
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#120f1e' },
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#0f1220' },
  { ring: BONE, ast: BONE, s1: '#ffe2b0', s2: '#ff5a1f', bg: '#120c22' },
];
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
const zoneOf = k =>
  lvl >= 3 && !tutorial
    ? ZONE_LV[lvl]
    : lvl === 1 && !tutorial
      ? ZONE_MAG
      : lvl === 2 && !tutorial
        ? ZONE_AND
        : ZONES[Math.floor(k / 25) % ZONES.length];

// ---------- estrellas ----------
const stars = Array.from({ length: 140 }, () => ({
  a: Math.random() * Math.PI * 2,
  r: Math.sqrt(Math.random()) * 1.2,
  s: Math.random() * 1.3 + 0.3,
  tw: Math.random() * 6,
}));

// utilidades
const frac = x => x - Math.floor(x);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const buzz = p => {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(p);
    }
  } catch (e) {}
};

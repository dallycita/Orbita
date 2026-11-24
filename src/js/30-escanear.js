/**
 * Escáner de la pantalla de planetas: el planeta gira, se encoge y aparecen sus datos reales y
 * cómo se siente en el juego. El dibujo del escaneo está en 29-planetas-hd.
 */
import { AC, ROOT } from './02-audio.js';

import { muted } from './core/settings.js';
import { uiOut, uiTone } from './audio/ui-sounds.js';
import { elPl } from './core/dom.js';

// scanOn: escaneo activo; scanK: avance de la animación, de 0 a 1; pRot: giro del planeta en
// radianes; scanLineT: avance de la línea de luz; scanApplyAt: cuándo crecen las barras
// (milisegundos de performance.now()).
let scanOn = false;
let scanK = 0;
let pRot = 0;
let scanLineT = 0;
let scanApplyAt = 0;
/**
 * Cómo se siente una característica en el juego: una palabra y su efecto (los números reales
 * van debajo).
 *
 * @param {string} k Característica: 'size' (tamaño), 'vel' (velocidad) o 'res' (resistencia).
 * @param {number} v Diferencia con la Tierra, en porcentaje.
 * @returns {string[]} [palabra, efecto].
 */
function statWords(k, v) {
  if (k === 'size') {
    return v <= -10
      ? ['Pequeño', 'pasa fácil por los huecos']
      : v >= 10
        ? ['Grande', 'más difícil de esquivar']
        : ['Normal', 'como la Tierra'];
  }
  if (k === 'vel') {
    return v <= -10
      ? ['Lento', 'salta flotando']
      : v >= 5
        ? ['Rápido', 'salta al instante']
        : ['Normal', 'como la Tierra'];
  }
  return v <= -30
    ? ['Frágil', 'el agujero negro lo alcanza antes']
    : v <= -8
      ? ['Algo frágil', 'aguanta un poco menos']
      : ['Firme', 'aguanta cerca del agujero negro'];
}
// filas de datos: [clave, título, texto de efecto, dato real del planeta, si el valor es ventaja]
const STAT_ROWS = [
  [
    'size',
    'Tamaño',
    v =>
      v <= -10
        ? 'Pequeño: pasa fácil por los huecos'
        : v >= 10
          ? 'Grande: más difícil de esquivar'
          : 'Como la Tierra',
    P => 'Diámetro real: ' + P.d,
    v => v < 0,
  ],
  [
    'vel',
    'Velocidad',
    v =>
      v <= -10 ? 'Lento: salta flotando' : v >= 5 ? 'Rápido: salta al instante' : 'Salto normal',
    P => 'Velocidad en su órbita: ' + P.v,
    v => v > 0,
  ],
  [
    'res',
    'Resistencia',
    v =>
      v <= -30
        ? 'Frágil: el agujero negro lo alcanza antes'
        : v <= -8
          ? 'Algo frágil'
          : 'Firme cerca del agujero negro',
    P => 'Densidad real: ' + P.rho,
    v => v > 0,
  ],
];
/**
 * Hace crecer las barras de datos desde el centro (la Tierra) cuando el planeta termina de
 * encogerse, y luego muestra el poder.
 */
function applyScanBars() {
  if (!elPl || !elPl.querySelectorAll || !elPl.querySelector) {
    return;
  }
  elPl.querySelectorAll('.sbar i').forEach(i => {
    const v = Math.max(-50, Math.min(50, Number(i.dataset.v)));
    i.style.width = Math.abs(v) + '%';
    i.style.left = (v >= 0 ? 50 : 50 - Math.abs(v)) + '%';
  });
  elPl.querySelectorAll('.spips i').forEach(i => {
    i.style.opacity = '1';
  });
  const pw = elPl.querySelector('.spower');
  if (pw) {
    setTimeout(() => pw.classList.add('on'), 650);
  }
}
/** Sonido del escáner: un barrido que sube y un arpegio corto. */
function uiScan() {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime,
      out = uiOut();
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, n);
    o.frequency.exponentialRampToValueAtTime(1300, n + 0.7);
    g.gain.setValueAtTime(0.0001, n);
    g.gain.exponentialRampToValueAtTime(0.06, n + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, n + 0.75);
    o.connect(g);
    g.connect(out);
    o.start(n);
    o.stop(n + 0.8);
    [0, 3, 7, 12].forEach((sm, i) =>
      uiTone(ROOT * 2 * Math.pow(2, sm / 12), n + 0.75 + i * 0.15, 0.6, 0.035),
    );
  } catch (e) {}
}
/**
 * Empieza o termina el escaneo del planeta.
 *
 * @param {boolean} on Escanear o dejar de escanear.
 */
function setScan(on) {
  scanOn = on;
  scanLineT = 0;
  if (elPl) {
    elPl.classList.toggle('scanning', on);
  }
  if (on) {
    uiScan();
    scanApplyAt = performance.now() + 650;
  }
}

/**
 * Cambia `pRot` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPRot(value) {
  pRot = value;
  return value;
}

/**
 * Cambia `scanApplyAt` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setScanApplyAt(value) {
  scanApplyAt = value;
  return value;
}

/**
 * Cambia `scanK` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setScanK(value) {
  scanK = value;
  return value;
}

/**
 * Cambia `scanLineT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setScanLineT(value) {
  scanLineT = value;
  return value;
}

/**
 * Cambia `scanOn` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setScanOn(value) {
  scanOn = value;
  return value;
}

export {
  STAT_ROWS,
  applyScanBars,
  pRot,
  scanApplyAt,
  scanK,
  scanLineT,
  scanOn,
  setScan,
  statWords,
};

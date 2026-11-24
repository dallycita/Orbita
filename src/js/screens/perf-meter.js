/**
 * Medidor de rendimiento para pruebas: se enciende en Ajustes o con ?medir en el enlace; apagado
 * no hace nada. Muestra cuadros por segundo, ms entre cuadros (mediana y peor 5 %), cuánto tarda
 * el código (lógica y dibujo) y los tirones (cuadros de más de 25 ms) de los últimos 10 s.
 * Si los ms entre cuadros son altos pero el código tarda poco, el límite es la tarjeta gráfica.
 */
import { effects } from '../core/run-state.js';

let MEDIR = false;
let medEl = null;
let medPrev = 0;
let medMid = 0;
let medShow = 0;
// Últimos 120 cuadros: tiempo entre cuadros, tiempo de código y tiempo de lógica (en ms); y
// momentos de los tirones de los últimos 10 s.
const medInt = [];
const medJs = [];
const medUpd = [];
const medJank = [];
/**
 * Registra un cuadro al final del bucle principal y, cada 0,5 s, actualiza el recuadro del
 * medidor. `medMid` lo marca el bucle al terminar la lógica, para separar lógica y dibujo.
 *
 * @param {number} now Momento del cuadro que da requestAnimationFrame, en ms.
 * @param {number} t0 Momento en que empezó el código del cuadro (performance.now()), en ms.
 */
function medFrame(now, t0) {
  const t1 = performance.now();
  if (medPrev) {
    medInt.push(now - medPrev);
    if (now - medPrev > 25) {
      medJank.push(now);
    }
  }
  medPrev = now;
  medJs.push(t1 - t0);
  medUpd.push(medMid ? medMid - t0 : -1);
  medMid = 0;
  while (medInt.length > 120) {
    medInt.shift();
  }
  while (medJs.length > 120) {
    medJs.shift();
    medUpd.shift();
  }
  while (medJank.length && now - medJank[0] > 10000) {
    medJank.shift();
  }
  if (now - medShow < 500) {
    return;
  }
  medShow = now;
  if (!medEl) {
    medEl = document.createElement('div');
    medEl.id = 'medidor';
    medEl.setAttribute('aria-hidden', 'true');
    medEl.style.cssText =
      'position:fixed;left:10px;bottom:10px;z-index:50;pointer-events:none;padding:8px 10px;border-radius:10px;background:rgba(5,7,13,.78);border:1px solid rgba(236,230,216,.18);font:400 10px/1.55 "Space Mono",ui-monospace,monospace;color:#ece6d8;white-space:pre;letter-spacing:.02em';
    document.body.appendChild(medEl);
  }
  const srt = a => [...a].sort((x, y) => x - y),
    q = (s, p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0);
  const iv = srt(medInt),
    js = srt(medJs),
    up = medUpd.filter(x => x >= 0),
    med = q(iv, 0.5),
    fps = med ? 1000 / med : 0;
  const upm = up.length ? q(srt(up), 0.5) : -1,
    jsm = q(js, 0.5);
  const col = fps >= 55 ? '#8ff0c0' : fps >= 40 ? '#ffd36b' : '#ff7a6b';
  medEl.innerHTML =
    '<b style="color:' +
    col +
    ';font-weight:400">FPS ' +
    fps.toFixed(0).padStart(3) +
    '</b>   cuadro ' +
    med.toFixed(1) +
    ' ms (peor ' +
    q(iv, 0.95).toFixed(1) +
    ')\n' +
    'código ' +
    jsm.toFixed(1) +
    ' ms' +
    (upm >= 0 ? ' (lógica ' + upm.toFixed(1) + ' · dibujo ' + (jsm - upm).toFixed(1) + ')' : '') +
    '\n' +
    'tirones ' +
    medJank.length +
    ' en 10 s   partículas ' +
    effects.particles.length;
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initPerfMeter() {
  try {
    MEDIR =
      localStorage.getItem('orbita_medidor') === '1' ||
      /[?&#]medir\b/.test(location.search + location.hash);
  } catch (e) {}
}

/**
 * Cambia `MEDIR` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setMEDIR(value) {
  MEDIR = value;
  return value;
}

/**
 * Cambia `medEl` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setMedEl(value) {
  medEl = value;
  return value;
}

/**
 * Cambia `medMid` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setMedMid(value) {
  medMid = value;
  return value;
}

/**
 * Cambia `medPrev` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setMedPrev(value) {
  medPrev = value;
  return value;
}

export { MEDIR, medEl, medFrame, medMid, medPrev };

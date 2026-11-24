/**
 * (encabezado pendiente)
 */
import { ROOT, volGain } from '../02-audio.js';
import { muted, volSfx } from '../core/settings.js';

let pzAC = null;

let pzBus = null;

let pzNoise = null;

let pzHoverT = 0;

/**
 * Prepara el contexto de audio propio de la pausa (con el mismo eco de los botones del juego
 * y un búfer de ruido) y aplica el volumen de efectos.
 *
 * @returns {AudioContext} El contexto `pzAC`.
 */
function pzCtx() {
  if (!pzAC) {
    pzAC = new (window.AudioContext || window.webkitAudioContext)();
    const out = pzAC.createGain(),
      comp = pzAC.createDynamicsCompressor(),
      dl = pzAC.createDelay(1),
      fb = pzAC.createGain(),
      wet = pzAC.createGain();
    out.gain.value = 0.6;
    dl.delayTime.value = 0.27;
    fb.gain.value = 0.35;
    wet.gain.value = 0.45;
    pzBus = pzAC.createGain();
    pzBus.connect(out);
    pzBus.connect(dl);
    dl.connect(fb);
    fb.connect(dl);
    dl.connect(wet);
    wet.connect(out);
    out.connect(comp);
    comp.connect(pzAC.destination);
    const len = pzAC.sampleRate;
    pzNoise = pzAC.createBuffer(1, len, pzAC.sampleRate);
    const d = pzNoise.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = Math.random() * 2 - 1;
    }
  }
  if (pzAC.state === 'suspended') {
    pzAC.resume();
  }
  pzBus.gain.value = volGain(volSfx);
  return pzAC;
}

/**
 * Nota de cristal, igual que `uiTone` pero en el contexto de la pausa.
 *
 * @param {number} semi Semitonos sobre la nota base `ROOT`.
 * @param {number} t0 Momento de inicio, en segundos del reloj de `pzAC`.
 * @param {number} dur Duración, en segundos.
 * @param {number} gain Ganancia máxima.
 * @param {string} [type] Forma de onda; por defecto 'sine'.
 */
function pzTone(semi, t0, dur, gain, type) {
  const A = pzAC,
    o = A.createOscillator(),
    g = A.createGain(),
    lp = A.createBiquadFilter();
  o.type = type || 'sine';
  o.frequency.value = ROOT * Math.pow(2, semi / 12);
  lp.type = 'lowpass';
  lp.frequency.value = 3200;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(lp);
  lp.connect(g);
  g.connect(pzBus);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

/**
 * Soplo de aire: ruido con un filtro que barre de `f0` a `f1`.
 *
 * @param {number} t0 Momento de inicio, en segundos del reloj de `pzAC`.
 * @param {number} dur Duración, en segundos.
 * @param {number} f0 Frecuencia inicial del filtro, en Hz.
 * @param {number} f1 Frecuencia final del filtro, en Hz.
 * @param {number} gain Ganancia máxima.
 * @param {string} [type] Tipo de filtro; por defecto 'bandpass'.
 */
function pzAir(t0, dur, f0, f1, gain, type) {
  const A = pzAC,
    src = A.createBufferSource(),
    f = A.createBiquadFilter(),
    g = A.createGain();
  src.buffer = pzNoise;
  src.loop = true;
  f.type = type || 'bandpass';
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(f0, t0);
  f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(pzBus);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

/**
 * Golpe grave que se desliza de `f0` a `f1`.
 *
 * @param {number} t0 Momento de inicio, en segundos del reloj de `pzAC`.
 * @param {number} f0 Frecuencia inicial, en Hz.
 * @param {number} f1 Frecuencia final, en Hz.
 * @param {number} dur Duración, en segundos.
 * @param {number} gain Ganancia máxima.
 */
function pzSub(t0, f0, f1, dur, gain) {
  const A = pzAC,
    o = A.createOscillator(),
    g = A.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(pzBus);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

/**
 * Sonidos de la pausa.
 *
 * @param {string} kind 'open', 'go', 'count', 'launch', 'again', 'levels', 'mute', 'unmute',
 *   'slide' u 'hover'.
 * @param {number} [v] Número de la cuenta (3, 2, 1) para 'count', o volumen de 0 a 100 para
 *   'slide'.
 */
function pzSnd(kind, v) {
  if (muted) {
    return;
  }
  try {
    pzCtx();
    const n = pzAC.currentTime + 0.005;
    if (kind === 'open') {
      // El tiempo se detiene: el aire baja, tres notas de cristal que caen y un golpe grave.
      pzAir(n, 0.55, 3200, 260, 0.2, 'lowpass');
      pzSub(n, 140, 46, 0.5, 0.3);
      pzTone(19, n, 1.2, 0.06);
      pzTone(15, n + 0.07, 1.2, 0.05);
      pzTone(12, n + 0.14, 1.6, 0.055);
      pzTone(24, n + 0.14, 0.7, 0.012);
    } else if (kind === 'go') {
      pzTone(12, n, 1, 0.06);
      pzTone(19, n + 0.06, 1.1, 0.05);
      pzTone(24, n + 0.12, 1.3, 0.045);
      pzAir(n, 0.4, 400, 4200, 0.1);
    } else if (kind === 'count') {
      const s = { 3: 12, 2: 15, 1: 19 }[v] || 12;
      pzTone(s, n, 0.55, 0.075);
      pzTone(s + 12, n, 0.3, 0.018);
      pzSub(n, 110, 70, 0.14, 0.14);
    } else if (kind === 'launch') {
      // Vuelve el juego: un destello y el grave que te lanza.
      pzTone(24, n, 0.9, 0.05);
      pzTone(31, n + 0.03, 0.7, 0.02);
      pzAir(n, 0.35, 6000, 1200, 0.12, 'highpass');
      pzSub(n, 70, 140, 0.22, 0.2);
    } else if (kind === 'again') {
      // Reintentar: un rebobinado corto.
      pzAir(n, 0.32, 300, 3800, 0.16);
      pzTone(7, n, 0.5, 0.05);
      pzTone(12, n + 0.08, 0.7, 0.055);
      pzSub(n + 0.02, 60, 110, 0.2, 0.18);
    } else if (kind === 'levels') {
      // Niveles: el mismo cristal que las flechas del juego, de regreso.
      pzTone(19, n, 1.1, 0.06);
      pzTone(12, n + 0.07, 1.3, 0.055);
      pzTone(24, n + 0.07, 0.7, 0.015);
    } else if (kind === 'mute') {
      pzTone(12, n, 0.4, 0.045);
      pzTone(5, n + 0.06, 0.6, 0.04);
    } else if (kind === 'unmute') {
      pzTone(5, n, 0.4, 0.04);
      pzTone(12, n + 0.06, 0.6, 0.05);
    } else if (kind === 'slide') {
      // Al arrastrar: una nota que sube con el volumen, en la escala del juego.
      const sc = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24],
        s = sc[Math.min(sc.length - 1, Math.round((v / 100) * (sc.length - 1)))];
      pzTone(s, n, 0.35, 0.02 + (0.045 * v) / 100);
      pzTone(s + 12, n, 0.18, 0.008);
    } else if (kind === 'hover') {
      const now = performance.now();
      if (now - pzHoverT < 60) {
        return;
      }
      pzHoverT = now;
      const nt = [0, 3, 7, 10, 12, 15];
      pzTone(nt[Math.floor(Math.random() * nt.length)] + 12, n, 0.9, 0.04);
    }
  } catch (e) {}
}

function pzTick(i) {
  pzSnd('count', i);
}

export { pzSnd, pzTick };

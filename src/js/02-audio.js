/**
 * Base del sonido con Web Audio: el contexto `AC`, los buses (efectos en `master`, música en
 * `musicBus` → `musVol`, todo a `outBus` y un compresor), el volumen guardado y efectos simples.
 * `AC` es null hasta el primer toque (`initAudio`) o si el navegador no tiene audio: todo lo que
 * suena debe comprobarlo.
 */
import { muted } from './26-pantalla-inicio.js';

let AC = null,
  master = null,
  musicBus = null,
  NOISE = null,
  shaper = null,
  outBus = null,
  musVol = null;
// Volumen de la música y de los efectos (de 0 a 100), guardados en el navegador.
let volMus = 100,
  volSfx = 100;
/**
 * Convierte el volumen del control en ganancia; la curva es cuadrática para que el control se
 * sienta parejo al oído.
 *
 * @param {number} v Volumen, de 0 a 100.
 * @returns {number} Ganancia, de 0 a 1.
 */
const volGain = v => Math.pow(v / 100, 2);
/** Aplica `volMus` y `volSfx` a los buses con una transición corta (sin chasquidos). */
function applyVolumes() {
  if (!AC || !master || !musVol) {
    return;
  }
  try {
    const n = AC.currentTime;
    master.gain.setTargetAtTime(volGain(volSfx), n, 0.03);
    musVol.gain.setTargetAtTime(volGain(volMus), n, 0.03);
  } catch (e) {}
}
/** Guarda `volMus` y `volSfx` en el navegador. */
function saveVolumes() {
  try {
    localStorage.setItem('orbita_vol_mus', String(Math.round(volMus)));
    localStorage.setItem('orbita_vol_sfx', String(Math.round(volSfx)));
  } catch (e) {}
}
/**
 * Crea el contexto de audio y los buses, y prepara 2 s de ruido blanco (`NOISE`) para los
 * efectos. Debe llamarse tras un toque del usuario (los navegadores bloquean el audio antes).
 * Llamarla otra vez no hace nada.
 */
function initAudio() {
  if (AC) {
    return;
  }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    outBus = AC.createGain();
    outBus.gain.value = typeof muted !== 'undefined' && muted ? 0 : 0.6;
    const comp = AC.createDynamicsCompressor();
    outBus.connect(comp);
    comp.connect(AC.destination);
    master = AC.createGain();
    master.gain.value = volGain(volSfx);
    master.connect(outBus); // todos los efectos (SFX) entran aquí
    musVol = AC.createGain();
    musVol.gain.value = volGain(volMus);
    musVol.connect(outBus);
    musicBus = AC.createGain();
    musicBus.gain.value = 0.0001;
    musicBus.connect(musVol);
    const len = AC.sampleRate * 2;
    NOISE = AC.createBuffer(1, len, AC.sampleRate);
    const d = NOISE.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = Math.random() * 2 - 1;
    }
  } catch (e) {
    AC = null;
  }
}
const ROOT = 415.3; // tonalidad: Sol# menor (Sol#4 = 415,3 Hz)
// Escala pentatónica menor, en semitonos sobre ROOT.
const SCALE = [0, 3, 5, 7, 10, 12, 15, 17];
/**
 * Toca un cencerro: dos ondas cuadradas desafinadas por un filtro de banda.
 *
 * @param {number} semi Altura, en semitonos sobre ROOT.
 */
function cowbell(semi) {
  if (!AC) {
    return;
  }
  try {
    const t0 = AC.currentTime,
      f = ROOT * Math.pow(2, semi / 12);
    const o1 = AC.createOscillator(),
      o2 = AC.createOscillator();
    o1.type = o2.type = 'square';
    o1.frequency.value = f;
    o2.frequency.value = f * 1.48;
    const bp = AC.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f * 1.7;
    bp.Q.value = 1.4;
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26);
    o1.connect(bp);
    o2.connect(bp);
    bp.connect(g);
    g.connect(master);
    o1.start(t0);
    o2.start(t0);
    o1.stop(t0 + 0.3);
    o2.stop(t0 + 0.3);
  } catch (e) {}
}
/**
 * Programa un golpe de ruido filtrado que se apaga; empieza en un punto al azar del ruido para que
 * dos golpes seguidos no suenen idénticos. No comprueba `AC`.
 *
 * @param {number} t0 Momento de inicio, en segundos del reloj de audio.
 * @param {number} dur Duración, en segundos.
 * @param {string} type Tipo de filtro ('lowpass', 'highpass', 'bandpass'…).
 * @param {number} freq Frecuencia inicial del filtro, en Hz.
 * @param {number} gain Volumen inicial, de 0 a 1.
 * @param {AudioNode} dest Nodo de destino.
 * @param {number} [f1] Frecuencia final del filtro, en Hz (sin ella, el filtro no se mueve).
 */
function noiseHit(t0, dur, type, freq, gain, dest, f1) {
  const src = AC.createBufferSource();
  src.buffer = NOISE;
  const f = AC.createBiquadFilter();
  f.type = type;
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(freq, t0);
  if (f1) {
    f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  }
  const g = AC.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start(t0, Math.random() * 0.8);
  src.stop(t0 + dur + 0.02);
}
/**
 * Toca ya un golpe de ruido filtrado por el bus de efectos.
 *
 * @param {number} dur Duración, en segundos.
 * @param {number} f0 Frecuencia inicial del filtro, en Hz.
 * @param {number} f1 Frecuencia final del filtro, en Hz.
 * @param {number} gain Volumen inicial, de 0 a 1.
 * @param {string} type Tipo de filtro ('lowpass', 'highpass', 'bandpass'…).
 */
function noise(dur, f0, f1, gain, type) {
  if (!AC) {
    return;
  }
  try {
    noiseHit(AC.currentTime, dur, type, f0, gain, master, f1);
  } catch (e) {}
}
/** Golpe grave y corto (de 110 a 55 Hz en 0,1 s). */
function thump() {
  if (!AC) {
    return;
  }
  try {
    const t0 = AC.currentTime,
      o = AC.createOscillator(),
      g = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t0);
    o.frequency.exponentialRampToValueAtTime(55, t0 + 0.1);
    g.gain.setValueAtTime(0.3, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + 0.17);
  } catch (e) {}
}
/** Sonido de ser tragado por el agujero negro: un tono y un ruido que caen durante 1,8 s. */
function suck() {
  if (!AC) {
    return;
  }
  try {
    const t0 = AC.currentTime,
      o = AC.createOscillator(),
      g = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(260, t0);
    o.frequency.exponentialRampToValueAtTime(30, t0 + 1.8);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.45, t0 + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.9);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + 2);
    noiseHit(t0, 1.8, 'lowpass', 2200, 0.45, master, 70);
  } catch (e) {}
}
/** Bajo profundo que cae (de 110 a 28 Hz en 0,9 s), para golpes grandes. */
function sub() {
  if (!AC) {
    return;
  }
  try {
    const t0 = AC.currentTime,
      o = AC.createOscillator(),
      g = AC.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(110, t0);
    o.frequency.exponentialRampToValueAtTime(28, t0 + 0.9);
    const lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    g.gain.setValueAtTime(0.5, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1);
    o.connect(lp);
    lp.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + 1.05);
  } catch (e) {}
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initAudioSettings() {
  try {
    const a = localStorage.getItem('orbita_vol_mus'),
      b = localStorage.getItem('orbita_vol_sfx');
    if (a !== null) {
      volMus = Math.max(0, Math.min(100, +a || 0));
    }
    if (b !== null) {
      volSfx = Math.max(0, Math.min(100, +b || 0));
    }
  } catch (e) {}
}

/**
 * Cambia `shaper` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setShaper(value) {
  shaper = value;
  return value;
}

/**
 * Cambia `volMus` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setVolMus(value) {
  volMus = value;
  return value;
}

/**
 * Cambia `volSfx` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setVolSfx(value) {
  volSfx = value;
  return value;
}

export {
  AC,
  NOISE,
  ROOT,
  SCALE,
  applyVolumes,
  cowbell,
  initAudio,
  master,
  musVol,
  musicBus,
  noise,
  noiseHit,
  outBus,
  saveVolumes,
  shaper,
  sub,
  suck,
  thump,
  volGain,
  volMus,
  volSfx,
};

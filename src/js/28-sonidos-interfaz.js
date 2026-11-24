/**
 * Sonidos de la interfaz (cristal y eco, en la tonalidad del juego) y de la absorción de la
 * presentación, incluidos dos inspirados en datos reales: la sonificación de la NASA del agujero
 * negro de Perseo y el chirrido de ondas gravitacionales de LIGO.
 * Los clics y el paso del puntero sobre botones se escuchan en toda la página desde aquí.
 */
import { AC, ROOT, master, noiseHit } from './02-audio.js';
import { paused, pzSnd } from './18-pausa.js';
import { muted } from './26-pantalla-inicio.js';
import { uiGlass } from './29-planetas-hd.js';

let uiBus = null,
  lastHover = null,
  uiLastT = 0;
/**
 * Salida de los sonidos de interfaz, con eco de 0,27 segundos; se crea al primer uso.
 *
 * @returns {GainNode} Entrada de la salida.
 */
function uiOut() {
  if (uiBus) {
    return uiBus;
  }
  const inG = AC.createGain(),
    dl = AC.createDelay(1),
    fb = AC.createGain(),
    wet = AC.createGain();
  dl.delayTime.value = 0.27;
  fb.gain.value = 0.35;
  wet.gain.value = 0.45;
  inG.connect(master);
  inG.connect(dl);
  dl.connect(fb);
  fb.connect(dl);
  dl.connect(wet);
  wet.connect(master);
  uiBus = inG;
  return uiBus;
}
/**
 * Nota de cristal de la interfaz: ataque instantáneo y caída exponencial, con eco.
 *
 * @param {number} f Frecuencia, en Hz.
 * @param {number} t0 Momento de inicio, en segundos del reloj de audio (`AC.currentTime`).
 * @param {number} dur Duración, en segundos.
 * @param {number} gain Ganancia máxima.
 * @param {string} [type] Forma de onda; por defecto 'sine'.
 */
function uiTone(f, t0, dur, gain, type) {
  const o = AC.createOscillator(),
    g = AC.createGain(),
    lp = AC.createBiquadFilter();
  o.type = type || 'sine';
  o.frequency.value = f;
  lp.type = 'lowpass';
  lp.frequency.value = 3200;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(lp);
  lp.connect(g);
  g.connect(uiOut());
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
/**
 * Al pasar el puntero sobre un botón: una nota de cristal suave, distinta cada vez (como
 * máximo una cada 0,06 segundos).
 */
function uiHover() {
  if (!AC || muted || AC.state !== 'running') {
    return;
  }
  try {
    const n = AC.currentTime;
    if (n - uiLastT < 0.06) {
      return;
    }
    uiLastT = n;
    const notes = [0, 3, 7, 10, 12, 15],
      semi = notes[Math.floor(Math.random() * notes.length)] + 12;
    uiTone(ROOT * Math.pow(2, semi / 12), n, 0.9, 0.045);
    uiTone(ROOT * 2 * Math.pow(2, semi / 12), n + 0.01, 0.5, 0.012);
  } catch (e) {}
}
/**
 * Sonido de tocar un botón: una campana grave, o en Jugar, el agujero negro que "traga" el toque.
 *
 * @param {string} kind 'play' para los botones de jugar; cualquier otro valor, el sonido suave.
 */
function uiClick(kind) {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime;
    if (kind === 'play') {
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(260, n);
      o.frequency.exponentialRampToValueAtTime(38, n + 0.9);
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(0.4, n + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, n + 1);
      o.connect(g);
      g.connect(master);
      o.start(n);
      o.stop(n + 1.05);
      noiseHit(n, 0.8, 'lowpass', 4000, 0.22, master, 90);
      uiTone(ROOT, n, 1.8, 0.08);
      uiTone(ROOT * Math.pow(2, 7 / 12), n + 0.06, 1.6, 0.05);
      uiTone(ROOT * 2, n + 0.12, 1.4, 0.035);
    } else {
      uiTone(ROOT / 2, n, 1.1, 0.1);
      uiTone((ROOT / 2) * Math.pow(2, 7 / 12), n + 0.03, 0.9, 0.05);
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(90, n);
      o.frequency.exponentialRampToValueAtTime(48, n + 0.25);
      g.gain.setValueAtTime(0.25, n);
      g.gain.exponentialRampToValueAtTime(0.0001, n + 0.3);
      o.connect(g);
      g.connect(master);
      o.start(n);
      o.stop(n + 0.32);
    }
  } catch (e) {}
}

// Sonido de la absorción en la presentación: showBus es su salida y bed el fondo continuo.
let showBus = null,
  bed = null;
/**
 * Salida de los sonidos de la absorción; se crea si no existe.
 *
 * @returns {GainNode} La salida.
 */
function showOut() {
  if (!showBus) {
    showBus = AC.createGain();
    showBus.gain.value = muted ? 0 : 1;
    showBus.connect(master);
  }
  return showBus;
}
/**
 * Empieza el fondo de la absorción: un "inhalar" que nunca para, con la voz de Perseo y un
 * latido grave de presión gravitacional.
 */
function showStart() {
  if (!AC) {
    return;
  }
  try {
    const n = AC.currentTime;
    showStop(0.05);
    showBus = AC.createGain();
    showBus.gain.setValueAtTime(muted ? 0 : 1, n);
    showBus.connect(master);
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, n);
    g.gain.exponentialRampToValueAtTime(0.38, n + 1.2);
    g.connect(showBus);
    const vg = AC.createGain();
    vg.gain.setValueAtTime(0.0001, n);
    vg.gain.exponentialRampToValueAtTime(0.42, n + 1.8);
    vg.connect(showBus);
    const nodes = perseusVoice(vg, n);
    // Presión gravitacional: un latido grave, más sentido que escuchado.
    const pr = AC.createOscillator(),
      prg = AC.createGain(),
      pl = AC.createOscillator(),
      plg = AC.createGain();
    pr.type = 'sine';
    pr.frequency.value = 43;
    prg.gain.value = 0.35;
    pl.frequency.value = 0.55;
    plg.gain.value = 0.3;
    pl.connect(plg);
    plg.connect(prg.gain);
    pr.connect(prg);
    prg.connect(g);
    pr.start(n);
    pl.start(n);
    nodes.push(pr, pl);
    const o = AC.createOscillator(),
      og = AC.createGain();
    o.type = 'sine';
    o.frequency.value = 31;
    og.gain.value = 0.4;
    o.connect(og);
    og.connect(g);
    o.start(n);
    nodes.push(o);
    bed = { g, nodes };
  } catch (e) {}
}
/**
 * Apaga el fondo de la absorción con un desvanecido.
 *
 * @param {number} [fade] Duración del desvanecido, en segundos; por defecto 0,6.
 */
function showStop(fade) {
  if (!AC) {
    return;
  }
  try {
    const n = AC.currentTime,
      f = fade || 0.6;
    if (showBus) {
      const sb = showBus;
      showBus = null;
      sb.gain.cancelScheduledValues(n);
      sb.gain.setValueAtTime(Math.max(sb.gain.value, 0.0001), n);
      sb.gain.exponentialRampToValueAtTime(0.0001, n + f);
    }
    if (bed) {
      const b = bed;
      bed = null;
      b.nodes.forEach(x => {
        try {
          x.stop(n + f + 0.1);
        } catch (e) {}
      });
    }
  } catch (e) {}
}
/**
 * Sonido de una roca que cae: sube de tono mientras acelera hacia el centro y se corta al
 * cruzar el horizonte de sucesos.
 *
 * @param {number} dur Duración de la caída, en segundos.
 * @param {number} pan Posición estéreo inicial, de -1 (izquierda) a 1 (derecha); termina al centro.
 */
function rockIn(dur, pan) {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime,
      out = showOut();
    let dest = out;
    if (AC.createStereoPanner) {
      const pn = AC.createStereoPanner();
      pn.pan.setValueAtTime(pan, n);
      pn.pan.linearRampToValueAtTime(0, n + dur);
      pn.connect(out);
      dest = pn;
    }
    // La "voz" de la roca se vuelve más aguda al caer (corrimiento al azul), hasta cortarse en el
    // horizonte.
    for (const [f0, f1, gn, ty] of [
      [55, 330, 0.2, 'sine'],
      [82, 495, 0.07, 'sine'],
      [110, 660, 0.03, 'triangle'],
    ]) {
      const o = AC.createOscillator(),
        g = AC.createGain(),
        v = AC.createOscillator(),
        vg = AC.createGain();
      o.type = ty;
      o.frequency.setValueAtTime(f0, n);
      o.frequency.exponentialRampToValueAtTime(f1, n + dur);
      v.frequency.value = 5;
      vg.gain.value = f0 * 0.02;
      v.connect(vg);
      vg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(gn, n + dur * 0.97);
      g.gain.exponentialRampToValueAtTime(0.0001, n + dur + 0.02);
      o.connect(g);
      g.connect(dest);
      o.start(n);
      v.start(n);
      o.stop(n + dur + 0.1);
      v.stop(n + dur + 0.1);
    }
  } catch (e) {}
}
/**
 * Gran inhalación justo antes de tragarse la estrella: crece y se corta en seco.
 *
 * @param {number} dur Duración, en segundos.
 */
function bigSuck(dur) {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime,
      out = showOut();
    for (const [f0, f1, gn, ty, lpf] of [
      [30, 90, 0.5, 'sine', 0],
      [45, 135, 0.18, 'sawtooth', 300],
      [60, 240, 0.06, 'sawtooth', 900],
    ]) {
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = ty;
      o.frequency.setValueAtTime(f0, n);
      o.frequency.exponentialRampToValueAtTime(f1, n + dur);
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(gn, n + dur * 0.98);
      g.gain.exponentialRampToValueAtTime(0.0001, n + dur + 0.02);
      if (lpf) {
        const lp = AC.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = lpf;
        o.connect(lp);
        lp.connect(g);
      } else {
        o.connect(g);
      }
      g.connect(out);
      o.start(n);
      o.stop(n + dur + 0.1);
    }
  } catch (e) {}
}

/**
 * "Voz" inspirada en la sonificación de la NASA del agujero negro del cúmulo de Perseo (2022):
 * un gemido grave que cambia lentamente de tono y de vocal.
 *
 * @param {AudioNode} dest Destino del sonido.
 * @param {number} n Momento de inicio, en segundos del reloj de audio.
 * @returns {OscillatorNode[]} Osciladores creados, para detenerlos después.
 */
function perseusVoice(dest, n) {
  const nodes = [];
  const formA = AC.createBiquadFilter(),
    formB = AC.createBiquadFilter(),
    mix = AC.createGain();
  formA.type = 'bandpass';
  formA.frequency.value = 420;
  formA.Q.value = 5;
  formB.type = 'bandpass';
  formB.frequency.value = 900;
  formB.Q.value = 7;
  mix.gain.value = 0.9;
  formA.connect(mix);
  formB.connect(mix);
  mix.connect(dest);
  // La "vocal" del gemido cambia despacio (ooo -> aaa).
  for (const [f, rate, depth] of [
    [formA, 0.09, 160],
    [formB, 0.06, 300],
  ]) {
    const l = AC.createOscillator(),
      lg = AC.createGain();
    l.frequency.value = rate;
    lg.gain.value = depth;
    l.connect(lg);
    lg.connect(f.frequency);
    l.start(n);
    nodes.push(l);
  }
  for (const [base, rate, dep, gn] of [
    [ROOT / 8, 0.05, 0.09, 0.5],
    [(ROOT / 8) * 1.19, 0.037, 0.11, 0.32],
    [(ROOT / 16) * 1.5, 0.023, 0.07, 0.45],
    [(ROOT / 8) * 0.998, 0.061, 0.1, 0.28],
  ]) {
    const o = AC.createOscillator(),
      og = AC.createGain(),
      l = AC.createOscillator(),
      lg = AC.createGain();
    o.type = 'sawtooth';
    o.frequency.value = base;
    og.gain.value = gn;
    l.frequency.value = rate;
    lg.gain.value = base * dep;
    l.connect(lg);
    lg.connect(o.frequency); // El tono se arrastra arriba y abajo.
    o.connect(og);
    og.connect(formA);
    og.connect(formB);
    o.start(n);
    l.start(n);
    nodes.push(o, l);
  }
  return nodes;
}
/**
 * "Chirrido" inspirado en las ondas gravitacionales que detectó LIGO en 2015: sube de tono,
 * crece y se apaga de golpe (el "ringdown" tras la fusión).
 */
function gwChirp() {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime,
      out = showOut(),
      dur = 0.75;
    for (const [mult, gn, ty] of [
      [1, 0.55, 'sine'],
      [2, 0.14, 'sine'],
      [1, 0.08, 'triangle'],
    ]) {
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = ty;
      o.frequency.setValueAtTime(32 * mult, n);
      o.frequency.exponentialRampToValueAtTime(110 * mult, n + dur * 0.75);
      o.frequency.exponentialRampToValueAtTime(320 * mult, n + dur);
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(gn * 0.3, n + dur * 0.6);
      g.gain.exponentialRampToValueAtTime(gn, n + dur * 0.98);
      g.gain.exponentialRampToValueAtTime(gn * 0.2, n + dur + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, n + dur + 0.35); // "ringdown"
      o.connect(g);
      g.connect(out);
      o.start(n);
      o.stop(n + dur + 0.4);
    }
  } catch (e) {}
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initUiSounds() {
  window.addEventListener('pointerover', e => {
    if (e.pointerType && e.pointerType !== 'mouse') {
      return;
    }
    const b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (b && !b.disabled && b !== lastHover) {
      lastHover = b;
      if (paused) {
        pzSnd('hover');
      } else {
        uiHover();
      }
    }
    if (!b) {
      lastHover = null;
    }
  });
  window.addEventListener(
    'click',
    e => {
      const b = e.target && e.target.closest ? e.target.closest('button') : null;
      if (!b || b.disabled) {
        return;
      }
      if (b.id === 'quit' || paused || (b.closest && b.closest('.pzp'))) {
        return;
      } // La pausa tiene sus propios sonidos.
      if (b.classList.contains('glass') || b.classList.contains('arrow')) {
        uiGlass(b.classList.contains('l') ? -1 : 1);
        return;
      }
      if (b.classList.contains('scanbtn')) {
        return;
      }
      uiClick(b.classList.contains('bigplay') || b.classList.contains('play') ? 'play' : 'soft');
    },
    true,
  );
}

export { bigSuck, gwChirp, rockIn, showOut, showStart, showStop, uiOut, uiTone };

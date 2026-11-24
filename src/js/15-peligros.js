/**
 * Peligros de la partida: ondas de supernova, novas, cometas, chorros de energía, llamaradas y
 * estrellas veloces. Los crea al aterrizar, los avanza cada cuadro, detecta si alcanzan al
 * planeta, los dibuja y les pone sonido. Su estado vive en 11-peligros-datos.
 */
import {
  BONE,
  CX,
  CY,
  GAP,
  H,
  PR,
  R0,
  S,
  W,
  buzz,
  clamp,
  ctx,
  frac,
  reduceMotion,
} from './01-pantalla-y-utilidades.js';
import { AC, NOISE, ROOT, noise } from './02-audio.js';
import { TB } from './03-musica-ritmos.js';
import { camLevel, jumping, level, lvl, pAng, pLevel, rings, state } from './06-record-y-estado.js';
import { sizeK } from './07-planetas.js';
import {
  flash,
  holeFlare,
  particles,
  setFlash,
  setHoleFlare,
  setPulse,
  setShake,
  setTexts,
  shake,
  sunLevel,
  t,
  texts,
  tutorial,
} from './08-partida-estado.js';
import { seenTypes } from './09-recorridos.js';
import {
  NOVA_BAR,
  beatKick,
  beatPhase,
  beatTime,
  novaEnv,
  novaPush,
  novaTau,
  obsAng,
} from './10-ritmo-y-objetos.js';
import {
  beamCount,
  beams,
  comets,
  flareT,
  flareWarn,
  hot,
  hotT,
  novaSrc,
  setBeamCount,
  setBeams,
  setComets,
  setFlareT,
  setFlareWarn,
  setHot,
  setHotT,
  setNovaSrc,
  setSkyFlash,
  setSstars,
  setWaves,
  skyFlash,
  sstars,
  waves,
} from './11-peligros-datos.js';
import { rr } from './16-partida.js';
import { uiOut, uiTone } from './28-sonidos-interfaz.js';

import { BEAM_AT, COMET_AT, COMET_TIME, FLARE_AT, SN_AT } from './data/hazards.js';
import { muted } from './core/settings.js';
import { misEvent } from './game/missions.js';

// Novas por nivel y anillo: sp es la velocidad de la cáscara (unidades del juego por segundo),
// per el periodo entre cáscaras en golpes, gaps y gw el número y ancho (radianes) de los huecos,
// n cuántas cáscaras salen y big marca la gran nova final.
const NOVA_AT = {
  2: {
    6: { sp: 52, per: 8, gaps: 3, gw: 0.62, n: 3 },
    15: { sp: 58, per: 8, gaps: 3, gw: 0.52, n: 4 },
    24: { sp: 64, per: 6, gaps: 2, gw: 0.5, n: 5 },
    33: { sp: 70, per: 6, gaps: 2, gw: 0.44, n: 5 },
    43: { sp: 40, per: 99, gaps: 1, gw: 0.55, n: 1, big: 1 },
  },
};
const NOVA_LIFE = 5.2; // segundos que vive cada cáscara de nova (más en la grande)
/**
 * Sacudida, vibración y sonido de cristal cuando una nova lanza una cáscara.
 *
 * @param {object} s Fuente de nova (de novaSrc); s.big indica la gran nova.
 */
function novaBurst(s) {
  setShake(Math.max(shake, reduceMotion ? 0 : s.big ? 9 : 3));
  buzz(s.big ? [30, 30, 80] : 18);
  if (AC && !muted) {
    try {
      const n = AC.currentTime;
      noise(s.big ? 1.2 : 0.5, 7000, 900, s.big ? 0.26 : 0.14, 'highpass');
      [12, 19, 24].forEach((sm, i) =>
        uiTone(
          ROOT * 2 * Math.pow(2, (sm + (s.big ? -12 : 0)) / 12),
          n + i * 0.03,
          s.big ? 1.6 : 0.8,
          0.035,
        ),
      );
    } catch (e) {}
  }
}
/**
 * Crea una fuente de nova a un lado del agujero, dos anillos por encima (cuatro si es la grande),
 * sincronizada con los golpes de la música.
 *
 * @param {number} L Nivel de anillo donde aterrizó el planeta.
 * @param {object} cfg Configuración de NOVA_AT para ese anillo.
 */
function novaSpawn(L, cfg) {
  const side = Math.random() < 0.5 ? -1 : 1,
    bt = beatTime(),
    P = cfg.per * TB;
  const b0 = Math.ceil((bt + 1.1) / TB) * TB; // el primer estallido cae en un golpe
  novaSrc.push({
    k: L + (cfg.big ? 4 : 2),
    ang: -Math.PI / 2 + side * (cfg.big ? 1.25 : 0.95 + Math.random() * 0.3),
    b0,
    P,
    n: cfg.n,
    sp: cfg.sp,
    gaps: cfg.gaps,
    gw: cfg.gw,
    big: !!cfg.big,
    rot: Math.random() * 6.28,
    done: false,
    lastB: -1,
  });
}
/**
 * Lista las cáscaras de nova vivas en un instante.
 *
 * @param {number} tt Tiempo de la música, en segundos.
 * @param {number} camL Nivel de anillo de la cámara.
 * @returns {Array<object>} Cáscaras {cx, cy, r, age, s, i}: centro y radio en unidades del
 *   juego, edad en segundos, fuente e índice de la cáscara.
 */
function novaShells(tt, camL) {
  const out = [];
  for (const s of novaSrc) {
    const Rk = R0 + (s.k - camL) * GAP,
      cx = Math.cos(s.ang) * Rk,
      cy = Math.sin(s.ang) * Rk;
    for (let i = 0; i < s.n; i++) {
      const tb = s.b0 + i * s.P,
        age = tt - tb;
      if (age < 0 || age > NOVA_LIFE * (s.big ? 1.6 : 1)) {
        continue;
      }
      out.push({ cx, cy, r: 4 + age * s.sp * (s.big ? 1.5 : 1), age, s, i });
    }
  }
  return out;
}
/**
 * Dice si el planeta toca un filamento (no un hueco) de alguna cáscara de nova.
 *
 * @param {number} px Posición horizontal del planeta, en unidades del juego desde el centro.
 * @param {number} py Posición vertical del planeta, en unidades del juego desde el centro.
 * @param {number} tt Tiempo de la música, en segundos.
 * @param {number} camL Nivel de anillo de la cámara.
 * @returns {boolean} true si lo toca.
 */
function novaHit(px, py, tt, camL) {
  const hitR = PR * sizeK() + 3.5;
  for (const sh of novaShells(tt, camL)) {
    const dx = px - sh.cx,
      dy = py - sh.cy,
      d = Math.hypot(dx, dy);
    if (Math.abs(d - sh.r) > hitR + (sh.s.big ? 4 : 2)) {
      continue;
    }
    const a = Math.atan2(dy, dx) - sh.s.rot - sh.i * 0.9;
    let inGap = false;
    for (let g = 0; g < sh.s.gaps; g++) {
      const c = (g * Math.PI * 2) / sh.s.gaps + Math.PI / 2 + 0.35,
        dd = Math.atan2(Math.sin(a - c), Math.cos(a - c));
      if (Math.abs(dd) < sh.s.gw / 2) {
        inGap = true;
      }
    }
    if (!inGap) {
      return true;
    }
  }
  return false;
}
// Ajustes finos por nivel, probados con jugadores simulados: cg multiplica la velocidad de los
// contragiros según el anillo, wv la duración de la onda, hg es el ancho de los huecos de las
// murallas (radianes) y arc el número de piedras de cada arco del contragiro.
const TUNE = {
  1: { cg: k => (k >= 44 ? 2.0 : 1.7), wv: 0.48, hg: 0.4, arc: 10 },
  2: { cg: k => 1.8, wv: 1, hg: 0.46, arc: 10 },
};
// waveProx: qué tan cerca está la onda del planeta (0 a 1, suavizado); waveBeepT: segundos hasta
// el siguiente pitido de aviso.
let waveProx = 0;
let waveBeepT = 0;
/** Borra todos los peligros activos (al empezar o reiniciar una partida). */
function hazardsReset() {
  setComets([]);
  setBeams([]);
  setFlareT(0);
  setFlareWarn(0);
  setBeamCount(0);
  setWaves([]);
  setNovaSrc([]);
  setSstars([]);
}
/**
 * Muestra una sola vez (guardado en localStorage) el aviso que explica un peligro nuevo.
 *
 * @param {string} key Clave del peligro en seenTypes.
 * @param {string} title Título del aviso.
 * @param {string} sub Explicación corta.
 * @param {string} col Color CSS del título.
 */
function hazardTip(key, title, sub, col) {
  if (seenTypes[key]) {
    return;
  }
  seenTypes[key] = 1;
  try {
    localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes));
  } catch (e) {}
  setTexts(texts.filter(x => !x.tip));
  texts.push({ txt: title, x: 0, y: -R0 - 96, life: 2.6, size: 20, col, center: true, tip: true });
  texts.push({
    txt: sub,
    x: 0,
    y: -R0 - 76,
    life: 2.6,
    size: 12,
    col: BONE,
    center: true,
    tip: true,
  });
}
/**
 * Al aterrizar en un anillo, lanza los peligros que el nivel tiene programados para ese anillo
 * (cometas, chorros, ondas de supernova, novas y llamaradas). No hace nada en el tutorial.
 */
function hazardsOnLand() {
  if (tutorial) {
    return;
  }
  const k = level;
  if (COMET_AT[lvl] && COMET_AT[lvl].has(k)) {
    const sg = Math.random() < 0.5 ? -1 : 1,
      span = 2.7,
      T = COMET_TIME[lvl] || 2.5;
    comets.push({
      k: level,
      sg,
      ang: pAng - sg * span,
      w: span / T,
      t: 0,
      delay: 0.55,
      left: span + 1.2,
    });
    if (lvl === 7) {
      comets.push({
        k: level,
        sg: -sg,
        ang: pAng + sg * span,
        w: span / T,
        t: 0,
        delay: 0.55,
        left: span + 1.2,
      });
      hazardTip(
        'pinza',
        'Cometas en pinza',
        'Vienen por los dos lados: salta antes de que se cierren',
        '#bfe6ff',
      );
    }
    hazardTip('cometa', 'Cometa', 'Viene por tu anillo: salta antes de que te alcance', '#bfe6ff');
    if (AC && !muted) {
      try {
        const n = AC.currentTime,
          o = AC.createOscillator(),
          g = AC.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(330, n);
        o.frequency.exponentialRampToValueAtTime(1320, n + 0.55 + T);
        g.gain.setValueAtTime(0.0001, n);
        g.gain.exponentialRampToValueAtTime(0.06, n + 0.55 + T * 0.9);
        g.gain.exponentialRampToValueAtTime(0.0001, n + 0.6 + T);
        o.connect(g);
        g.connect(uiOut());
        o.start(n);
        o.stop(n + 0.7 + T);
      } catch (e) {}
    }
  }
  if (BEAM_AT[lvl] && BEAM_AT[lvl].has(k)) {
    const tgt = (setBeamCount(beamCount + 1) - 1) % 2 === 0 ? level + 1 : level;
    beams.push({ k: tgt, t: 0, warn: 1.2, fire: 0.35, fired: false });
    hazardTip(
      'rayo',
      'Chorro de energía',
      'No estés en el anillo que brilla cuando dispare',
      '#9fd4ff',
    );
    if (AC && !muted) {
      try {
        const n = AC.currentTime,
          o = AC.createOscillator(),
          g = AC.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, n);
        o.frequency.exponentialRampToValueAtTime(880, n + 1.2);
        g.gain.setValueAtTime(0.0001, n);
        g.gain.exponentialRampToValueAtTime(0.05, n + 1.1);
        g.gain.exponentialRampToValueAtTime(0.0001, n + 1.25);
        o.connect(g);
        g.connect(uiOut());
        o.start(n);
        o.stop(n + 1.3);
      } catch (e) {}
    }
  }
  if (SN_AT[lvl] && SN_AT[lvl][k] && !waves.some(w => !w.over)) {
    spawnWave(k + SN_AT[lvl][k], SN_AT[lvl][k]);
  }
  if (NOVA_AT[lvl] && NOVA_AT[lvl][k]) {
    novaSpawn(k, NOVA_AT[lvl][k]);
  }
  if (FLARE_AT[lvl] && FLARE_AT[lvl].has(k)) {
    setFlareWarn(0.8);
    hazardTip('llamarada', 'Llamarada', 'El agujero negro te ciega: sigue tu ritmo', '#ffe2b0');
  }
}
/**
 * Posición de una estrella veloz en su órbita elíptica, resolviendo la ecuación de Kepler
 * (M = E - e·sen E) con cinco pasos de Newton.
 *
 * @param {object} s Órbita: P periodo (segundos), M0 anomalía media inicial, e excentricidad,
 *   a semieje mayor (unidades del juego) y w argumento del periapsis (radianes).
 * @param {number} tt Tiempo, en segundos.
 * @returns {number[]} [x, y] respecto al agujero negro, en unidades del juego.
 */
function keplerPos(s, tt) {
  const M = 2 * Math.PI * (tt / s.P) + s.M0;
  let E = M;
  for (let i = 0; i < 5; i++) {
    E -= (E - s.e * Math.sin(E) - M) / (1 - s.e * Math.cos(E));
  }
  const r = s.a * (1 - s.e * Math.cos(E)),
    nu = 2 * Math.atan2(Math.sqrt(1 + s.e) * Math.sin(E / 2), Math.sqrt(1 - s.e) * Math.cos(E / 2)),
    an = nu + s.w;
  return [Math.cos(an) * r, Math.sin(an) * r];
}
/**
 * Programa una onda de supernova: sale en un golpe de la música (la grande, al inicio de un
 * compás) y llega al anillo límite en otro golpe. Mientras espera suena un rumor que crece.
 *
 * @param {number} L Nivel de anillo límite hasta donde llega la onda.
 * @param {number} reach Cuántos anillos por encima del planeta llega (3 o más es la grande).
 */
function spawnWave(L, reach) {
  const learn = !seenTypes.onda,
    ph = beatPhase();
  let wait = ph < 0 ? 0.9 : (1 - ph) * TB;
  while (wait < 0.75) {
    wait += TB;
  } // sale justo en un golpe de la música
  const big = reach >= 3;
  if (big && ph >= 0) {
    const bar = 4 * TB,
      bt = beatTime() + wait;
    wait += (bar - (((bt % bar) + bar) % bar)) % bar;
    if (wait < 1.2) {
      wait += bar;
    }
  } // la gran onda: al inicio de un compás
  const secs =
    (reach === 1 ? 2.6 : reach === 2 ? 4.2 : 5.4) *
    (learn ? 1.45 : 1) *
    (TUNE[lvl] ? TUNE[lvl].wv : 1);
  const T = Math.max(2, Math.round(secs / TB)) * TB; // y llega al límite en otro golpe
  waves.push({
    big,
    t: 0,
    wait,
    T,
    L,
    reach,
    k0: 0,
    wk: 0,
    learn,
    released: false,
    over: false,
    hitDone: false,
    safe: false,
    broken: 0,
    trail: [],
    trailT: 0,
    ph: [Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28],
    knots: Array.from({ length: 30 }, () => ({
      a: Math.random() * 6.28,
      s: Math.random(),
      f: 2 + Math.random() * 5,
    })),
  });
  if (AC && !muted) {
    try {
      // un rumor grave que crece hasta el golpe de salida
      const n = AC.currentTime,
        o = AC.createOscillator(),
        g = AC.createGain(),
        lp = AC.createBiquadFilter();
      o.type = 'sawtooth';
      lp.type = 'lowpass';
      o.frequency.setValueAtTime(55, n);
      o.frequency.exponentialRampToValueAtTime(110, n + wait);
      lp.frequency.setValueAtTime(200, n);
      lp.frequency.exponentialRampToValueAtTime(1400, n + wait);
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(0.12, n + wait * 0.95);
      g.gain.exponentialRampToValueAtTime(0.0001, n + wait + 0.05);
      o.connect(lp);
      lp.connect(g);
      g.connect(uiOut());
      o.start(n);
      o.stop(n + wait + 0.1);
    } catch (e) {}
  }
}
/**
 * Suelta la onda desde el agujero negro: sacudida, destello y el estampido con su silbido.
 *
 * @param {object} w Onda de supernova (de waves).
 */
function waveRelease(w) {
  w.released = true;
  w.k0 = Math.max(sunLevel + 0.35, level - 2.4);
  w.wk = w.k0;
  setShake(Math.max(shake, reduceMotion ? 0 : w.big ? 14 : 6));
  setFlash(Math.max(flash, w.big ? 0.55 : 0.25));
  buzz(w.big ? [60, 30, 60, 30, 90] : [30, 20, 30]);
  if (w.big) {
    setSkyFlash(Math.max(skyFlash, 0.5));
  }
  if (AC && !muted) {
    try {
      const n = AC.currentTime,
        o = AC.createOscillator(),
        g = AC.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(90, n);
      o.frequency.exponentialRampToValueAtTime(30, n + 0.6);
      g.gain.setValueAtTime(w.big ? 0.95 : 0.7, n);
      g.gain.exponentialRampToValueAtTime(0.0001, n + (w.big ? 1.4 : 0.7));
      o.connect(g);
      g.connect(uiOut());
      o.start(n);
      o.stop(n + 1.5);
      noise(w.big ? 1.4 : 0.7, 5000, 120, w.big ? 0.5 : 0.35, 'lowpass');
      if (w.big) {
        [0, 7, 12].forEach(sm => {
          const c = AC.createOscillator(),
            cg = AC.createGain();
          c.type = 'sawtooth';
          c.frequency.value = (ROOT / 2) * Math.pow(2, sm / 12);
          const lp = AC.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 900; // un acorde que retumba
          cg.gain.setValueAtTime(0.0001, n);
          cg.gain.exponentialRampToValueAtTime(0.06, n + 0.05);
          cg.gain.exponentialRampToValueAtTime(0.0001, n + 2.2);
          c.connect(lp);
          lp.connect(cg);
          cg.connect(uiOut());
          c.start(n);
          c.stop(n + 2.3);
        });
      }
      const s1 = AC.createOscillator(),
        sg = AC.createGain(),
        bp = AC.createBiquadFilter();
      s1.type = 'triangle';
      bp.type = 'bandpass';
      bp.frequency.value = 2200;
      bp.Q.value = 2; // el silbido de la onda viajando
      s1.frequency.setValueAtTime(600, n);
      s1.frequency.exponentialRampToValueAtTime(1800, n + w.T);
      sg.gain.setValueAtTime(0.0001, n);
      sg.gain.exponentialRampToValueAtTime(0.05, n + 0.2);
      sg.gain.exponentialRampToValueAtTime(0.08, n + w.T * 0.9);
      sg.gain.exponentialRampToValueAtTime(0.0001, n + w.T + 0.05);
      s1.connect(bp);
      bp.connect(sg);
      sg.connect(uiOut());
      s1.start(n);
      s1.stop(n + w.T + 0.1);
      w.whine = { g: sg, o: s1 };
    } catch (e) {}
  }
}
/**
 * La onda choca contra su anillo límite y se rompe en partículas, con un acorde brillante.
 *
 * @param {object} w Onda de supernova (de waves).
 */
function waveBreak(w) {
  w.broken = 0.001;
  const R = rr(w.L);
  if (w.big) {
    setSkyFlash(1);
    setFlash(Math.max(flash, 0.6));
    setShake(Math.max(shake, reduceMotion ? 0 : 10));
    setPulse(1);
    buzz([40, 30, 120]);
  }
  for (let i = 0; i < (w.big ? 160 : 64); i++) {
    const a = (i / 64) * Math.PI * 2 + Math.random() * 0.08,
      v = 25 + Math.random() * 55;
    particles.push({
      x: Math.cos(a) * R,
      y: Math.sin(a) * R,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.7 + Math.random() * 0.6,
      col: ['#ffffff', '#ffc2da', '#ff7fb0', '#ffd9a8'][i % 4],
      s: 1.2 + Math.random() * 2.2,
    });
  }
  if (AC && !muted) {
    try {
      if (w.whine) {
        const n = AC.currentTime;
        w.whine.g.gain.cancelScheduledValues(n);
        w.whine.g.gain.setValueAtTime(0.06, n);
        w.whine.g.gain.exponentialRampToValueAtTime(0.0001, n + 0.1);
      }
      noise(0.5, 9000, 2500, 0.22, 'highpass');
      [24, 28, 31, 36].forEach((sm, i) =>
        uiTone(ROOT * 2 * Math.pow(2, sm / 12), AC.currentTime + i * 0.035, 0.9, 0.035),
      );
      if (w.big) {
        [12, 19, 24, 28, 31, 36, 40, 43].forEach((sm, i) =>
          uiTone(ROOT * 2 * Math.pow(2, sm / 12), AC.currentTime + 0.12 + i * 0.06, 1.6, 0.03),
        );
        noise(1.6, 1200, 9000, 0.2, 'bandpass');
      }
    } catch (e) {}
  }
}
/**
 * El planeta quedó por encima del límite de la onda: cuenta para las misiones y suena el aviso.
 *
 * @param {object} w Onda de supernova (de waves).
 */
function waveSafe(w) {
  w.safe = true;
  misEvent('onda');
  setPulse(1);
  buzz(10);
  if (AC && !muted) {
    try {
      [12, 19].forEach((sm, i) =>
        uiTone(ROOT * 2 * Math.pow(2, sm / 12), AC.currentTime + i * 0.05, 0.5, 0.035),
      );
    } catch (e) {}
  }
}
/**
 * La onda alcanzó al planeta: la primera vez lo sobrecalienta; si ya estaba caliente, lo destruye.
 *
 * @param {object} w Onda de supernova (de waves).
 * @param {number} px Posición horizontal del planeta, en unidades del juego desde el centro.
 * @param {number} py Posición vertical del planeta, en unidades del juego desde el centro.
 * @returns {string|undefined} 'onda' si el planeta muere.
 */
function waveCatch(w, px, py) {
  w.hitDone = true;
  if (hot) {
    return 'onda';
  }
  setHot(1);
  setHotT(0);
  setShake(reduceMotion ? 0 : 12);
  setFlash(0.45);
  buzz([60, 40, 80]);
  for (let i = 0; i < 34; i++) {
    const a = Math.random() * Math.PI * 2,
      v = 40 + Math.random() * 130;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.5 + Math.random() * 0.6,
      col: ['#ffb347', '#ff6a2b', '#fff1c4', '#ff3d1f'][i % 4],
      s: 1.5 + Math.random() * 2.5,
    });
  }
  if (AC && !muted) {
    try {
      const n = AC.currentTime,
        src = AC.createBufferSource();
      src.buffer = NOISE;
      const f = AC.createBiquadFilter(),
        g = AC.createGain(); // chisporroteo
      f.type = 'highpass';
      f.frequency.value = 3500;
      g.gain.setValueAtTime(0.3, n);
      g.gain.exponentialRampToValueAtTime(0.0001, n + 1.2);
      src.connect(f);
      f.connect(g);
      g.connect(uiOut());
      src.start(n);
      src.stop(n + 1.25);
      const o = AC.createOscillator(),
        og = AC.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(320, n);
      o.frequency.exponentialRampToValueAtTime(70, n + 0.5);
      og.gain.setValueAtTime(0.18, n);
      og.gain.exponentialRampToValueAtTime(0.0001, n + 0.55);
      o.connect(og);
      og.connect(uiOut());
      o.start(n);
      o.stop(n + 0.6);
    } catch (e) {}
  }
  return null;
}
/**
 * Avanza todos los peligros un cuadro y revisa si alguno alcanza al planeta.
 *
 * @param {number} d Tiempo del cuadro, en segundos.
 * @param {number} px Posición horizontal del planeta, en unidades del juego desde el centro.
 * @param {number} py Posición vertical del planeta, en unidades del juego desde el centro.
 * @returns {string|null} La causa ('onda', 'comet', 'beam', 'sstar') si lo alcanza, o null.
 */
function hazardsUpdate(d, px, py) {
  const hitR = PR * sizeK();
  // onda de supernova
  for (const w of waves) {
    w.t += d;
    if (!w.released) {
      setHoleFlare(Math.max(holeFlare, 0.2 + 0.4 * Math.abs(Math.sin(w.t * 12))));
      if (w.t >= w.wait) {
        waveRelease(w);
      }
      continue;
    }
    const tt = w.t - w.wait;
    if (!w.broken) {
      w.wk = w.k0 + (w.L - w.k0) * Math.min(1, tt / w.T);
      w.trailT += d;
      if (w.trailT > 0.12) {
        w.trailT = 0;
        w.trail.push({ k: w.wk, a: 1 });
        if (w.trail.length > 14) {
          w.trail.shift();
        }
      }
      if (!w.safe && !w.hitDone && pLevel >= w.L - 0.02) {
        waveSafe(w);
      }
      if (!w.safe && !w.hitDone && w.wk >= pLevel - 0.04) {
        const r = waveCatch(w, px, py);
        if (r) {
          return r;
        }
      }
      if (tt >= w.T) {
        waveBreak(w);
      }
    } else {
      w.broken += d;
    }
    for (const tr of w.trail) {
      tr.a -= d * 1.1;
    }
    if (w.broken > 0.9) {
      w.over = true;
      if (w.learn) {
        seenTypes.onda = 1;
        try {
          localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes));
        } catch (e) {}
      }
    }
  }
  setWaves(waves.filter(w => !w.over));
  let px0 = 0;
  for (const w of waves) {
    if (w.released && !w.broken && !w.safe && !w.hitDone) {
      px0 = Math.max(px0, clamp(1 - (pLevel - w.wk) / 1.3, 0, 1));
    }
  }
  waveProx += (px0 - waveProx) * Math.min(1, d * 10);
  if (waveProx > 0.15 && state === 'play') {
    waveBeepT -= d;
    if (waveBeepT <= 0) {
      waveBeepT = 0.42 - 0.32 * waveProx; // un pitido que se acelera mientras se acerca
      if (AC && !muted) {
        try {
          uiTone(
            ROOT * 4 * Math.pow(2, (hot ? 3 : 0) / 12),
            AC.currentTime,
            0.07,
            0.03 + 0.05 * waveProx,
            'square',
          );
        } catch (e) {}
      }
      buzz(8);
    }
  } else {
    waveBeepT = 0;
  }
  if (hot) {
    setHotT(hotT + d);
  }
  setSkyFlash(Math.max(0, skyFlash - d * 0.9));
  for (const c of comets) {
    c.t += d;
    if (c.t < c.delay) {
      continue;
    }
    const st = c.w * d;
    c.ang += c.sg * st;
    c.left -= st;
    if (Math.abs(pLevel - c.k) < 0.4) {
      const R = rr(c.k),
        x = Math.cos(c.ang) * R,
        y = Math.sin(c.ang) * R;
      if (Math.hypot(px - x, py - y) < hitR + 9) {
        return 'comet';
      }
    }
  }
  setComets(comets.filter(c => c.left > 0 && c.k >= level - 1));
  for (const b of beams) {
    b.t += d;
    if (b.t >= b.warn && !b.fired) {
      b.fired = true;
      setShake(reduceMotion ? 0 : 5);
      noise(0.35, 5000, 300, 0.35, 'lowpass');
      buzz(30);
    }
    if (b.t >= b.warn && b.t < b.warn + b.fire && Math.abs(pLevel - b.k) < 0.45) {
      return 'beam';
    }
  }
  setBeams(beams.filter(b => b.t < b.warn + b.fire + 0.3));
  if (flareWarn > 0) {
    setFlareWarn(flareWarn - d);
    setHoleFlare(Math.max(holeFlare, ((0.8 - Math.max(0, flareWarn)) / 0.8) * 0.7));
    if (flareWarn <= 0) {
      setFlareT(0.75);
      noise(0.5, 7000, 500, 0.3, 'highpass');
    }
  }
  setFlareT(Math.max(0, flareT - d));
  for (const s of sstars) {
    if (level < s.from) {
      continue;
    }
    const [x, y] = keplerPos(s, t);
    s.trail.push([x, y]);
    if (s.trail.length > 14) {
      s.trail.shift();
    }
    if (jumping && Math.hypot(px - x, py - y) < hitR + 4.5) {
      return 'sstar';
    }
  }
  return null;
}
/**
 * Radio del frente irregular de la onda en un punto, sumando senos de varias frecuencias que se
 * mueven con el tiempo.
 *
 * @param {object} w Onda de supernova (sus fases aleatorias en w.ph).
 * @param {number} R Radio medio, en píxeles de pantalla.
 * @param {number} i Índice del punto en el contorno.
 * @param {number} N Número de puntos del contorno.
 * @param {number} wob Amplitud de la irregularidad, en píxeles de pantalla.
 * @returns {number} Radio en ese punto, en píxeles de pantalla.
 */
function waveShape(w, R, i, N, wob) {
  const th = (i / N) * Math.PI * 2,
    p = w.ph;
  return (
    R +
    wob *
      (0.35 * Math.sin(2 * th + p[0] + t * 0.5) +
        0.25 * Math.sin(5 * th + p[1] - t * 0.9) +
        0.2 * Math.sin(11 * th + p[2] + t * 1.7) +
        0.12 * Math.sin(23 * th + p[0] * 2 - t * 2.6) +
        0.08 * Math.sin(41 * th + p[1] * 3 + t * 3.3))
  );
}
/**
 * Dibuja la onda de supernova como en las fotos: un frente irregular con filamentos, nudos
 * brillantes y restos que siguen brillando, más el anillo límite que marca hasta dónde llega.
 *
 * @param {object} w Onda de supernova (de waves).
 */
function drawWave(w) {
  const N = 128,
    bk = beatKick();
  ctx.save();
  // el anillo límite: hasta aquí llega la onda
  if (!w.over) {
    const RL = rr(w.L) * S,
      fl = w.broken ? Math.max(0, 1 - w.broken * 1.4) : 1;
    if (RL > 10) {
      const urg = w.safe ? 0 : waveProx * (0.5 + 0.5 * Math.sin(t * 22));
      ctx.globalAlpha = (0.18 + 0.2 * bk + 0.45 * urg) * fl;
      ctx.strokeStyle = w.safe ? '#ffe7a8' : '#ff6fa8';
      ctx.lineWidth = (7 + 6 * urg) * S;
      ctx.beginPath();
      ctx.arc(CX, CY, RL, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = (0.75 + 0.25 * bk) * fl;
      ctx.strokeStyle = w.safe ? '#fff3d0' : '#ffc2da';
      ctx.lineWidth = 2.6 * S;
      ctx.setLineDash([10 * S, 7 * S]);
      ctx.lineDashOffset = -t * 24;
      ctx.beginPath();
      ctx.arc(CX, CY, RL, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (w.learn && !w.safe && !w.hitDone && state === 'play') {
        // la primera vez: una flecha dorada señala "sube"
        const pr = rr(pLevel) * S,
          ox = Math.cos(pAng),
          oy = Math.sin(pAng),
          tx = -oy,
          ty = ox;
        for (let j = 0; j < 2; j++) {
          const ph = frac(t * 1.6 + j * 0.5),
            d0 = pr + (18 + ph * (RL - pr - 26)) * 1,
            hx = CX + ox * d0,
            hy = CY + oy * d0;
          ctx.globalAlpha = Math.sin(Math.PI * ph) * 0.95;
          ctx.strokeStyle = '#ffd36b';
          ctx.lineWidth = 3 * S;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(hx - ox * 7 * S + tx * 7 * S, hy - oy * 7 * S + ty * 7 * S);
          ctx.lineTo(hx, hy);
          ctx.lineTo(hx - ox * 7 * S - tx * 7 * S, hy - oy * 7 * S - ty * 7 * S);
          ctx.stroke();
        }
      }
    }
  }
  if (!w.released) {
    ctx.restore();
    return;
  }
  ctx.globalCompositeOperation = 'lighter';
  // restos de gas que siguen brillando detrás del frente
  for (const tr of w.trail) {
    if (tr.a <= 0) {
      continue;
    }
    const Rt = rr(tr.k) * S;
    if (Rt < 4) {
      continue;
    }
    ctx.globalAlpha = tr.a * 0.16;
    ctx.strokeStyle = '#ff4f8f';
    ctx.lineWidth = 5 * S;
    ctx.setLineDash([2 * S, 9 * S]);
    ctx.lineDashOffset = tr.k * 40;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const r2 = waveShape(w, Rt, i, N, 5 * S),
        th = (i / N) * Math.PI * 2;
      i
        ? ctx.lineTo(CX + Math.cos(th) * r2, CY + Math.sin(th) * r2)
        : ctx.moveTo(CX + Math.cos(th) * r2, CY + Math.sin(th) * r2);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const R = rr(w.wk) * S * (1 + (w.broken ? w.broken * 0.12 : 0)),
    A = (w.broken ? Math.max(0, 1 - w.broken * 1.5) : 1) * (w.big ? 1.35 : 1),
    wob = (w.big ? 7 : 4.5) * S + 3 * bk * S;
  if (R > 4 && A > 0) {
    const path = (off, wb) => {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2,
          r2 = waveShape(w, R - off, i, N, wb);
        i
          ? ctx.lineTo(CX + Math.cos(th) * r2, CY + Math.sin(th) * r2)
          : ctx.moveTo(CX + Math.cos(th) * r2, CY + Math.sin(th) * r2);
      }
    };
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.16 * A;
    ctx.strokeStyle = '#ff3d7f';
    ctx.lineWidth = (w.big ? 56 : 34) * S;
    path(8 * S, wob);
    ctx.stroke(); // resplandor
    if (w.big) {
      ctx.globalAlpha = 0.18 * A;
      ctx.strokeStyle = '#ffd9a8';
      ctx.lineWidth = 18 * S;
      path(-4 * S, wob);
      ctx.stroke();
    }
    for (let j = 0; j < 4; j++) {
      ctx.globalAlpha = (0.3 - j * 0.06) * A;
      ctx.strokeStyle = j % 2 ? '#c94bd8' : '#ff6fa8';
      ctx.lineWidth = (3.2 - j * 0.5) * S;
      ctx.setLineDash([(18 + j * 9) * S, (7 + j * 11) * S, (6 + j * 3) * S, (12 + j * 5) * S]);
      ctx.lineDashOffset = j * 37 + t * (j % 2 ? 9 : -7);
      path((5 + j * 7) * S, wob * (1.4 + j * 0.5));
      ctx.stroke();
    } // filamentos rotos detrás del frente
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.55 * A;
    ctx.strokeStyle = '#ffc2da';
    ctx.lineWidth = 6 * S;
    path(0, wob);
    ctx.stroke();
    ctx.globalAlpha = 0.95 * A;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8 * S;
    path(0, wob);
    ctx.stroke(); // el frente de choque
    // hilos radiales: material arrancado que queda atrás
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const th = (i / 26) * Math.PI * 2 + w.ph[0] + 0.13 * Math.sin(i * 3.7),
        r2 = waveShape(w, R, (th / (Math.PI * 2)) * N, N, wob),
        L = (5 + 22 * Math.pow(0.5 + 0.5 * Math.sin(i * 7.3 + t * 1.3), 3)) * S;
      ctx.globalAlpha = 0.12 * A;
      ctx.strokeStyle = '#ff9cc4';
      ctx.lineWidth = 1.2 * S;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(th) * r2, CY + Math.sin(th) * r2);
      ctx.lineTo(CX + Math.cos(th) * (r2 - L), CY + Math.sin(th) * (r2 - L));
      ctx.stroke();
    }
    // nudos brillantes, como las "perlas" del anillo de la 1987A
    for (const kn of w.knots) {
      const th = kn.a + t * 0.05,
        r2 = waveShape(w, R, (th / (Math.PI * 2)) * N, N, wob),
        x = CX + Math.cos(th) * r2,
        y = CY + Math.sin(th) * r2,
        tw = 0.55 + 0.45 * Math.sin(t * kn.f + kn.s * 20);
      const gg = ctx.createRadialGradient(x, y, 0, x, y, 7 * S);
      if (gg && gg.addColorStop) {
        gg.addColorStop(0, 'rgba(255,255,255,1)');
        gg.addColorStop(0.3, 'rgba(255,190,220,.7)');
        gg.addColorStop(1, 'rgba(255,120,170,0)');
        ctx.fillStyle = gg;
      }
      ctx.globalAlpha = tw * A * (0.6 + 0.4 * bk);
      ctx.beginPath();
      ctx.arc(x, y, 7 * S, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
/**
 * Dibuja la nova de un anillo: estrella azul-blanca con picos de difracción, tres arcos de carga
 * (uno por golpe) y, al estallar, destello, ondas y restos.
 *
 * @param {object} ring Anillo de tipo 'nova' (posición de la estrella en ring.na + ring.phase).
 * @param {number} Rw Radio del anillo, en unidades del juego.
 * @param {number} a Opacidad, de 0 a 1.
 * @param {boolean} next true si es el anillo siguiente al del planeta (el único que estalla).
 */
function drawNova(ring, Rw, a, next) {
  const tau = novaTau(beatTime()),
    bar = NOVA_BAR(),
    na = ring.na + ring.phase,
    x = CX + Math.cos(na) * Rw * S,
    y = CY + Math.sin(na) * Rw * S;
  const charge = Math.min(3, Math.floor(tau / TB)),
    e = novaEnv(tau);
  const grow = tau > 0.9 ? (tau - 0.9) / (bar - 0.9) : 0; // crece mientras se acerca el estallido
  const r0 = (4.6 + 3.5 * grow * grow + 7 * e) * S,
    a0 = Math.max(0.15, a);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (e > 0 && next) {
    // el estallido: un resplandor suave (no ciega) y ondas de choque
    const sh = 1 - Math.min(1, tau / 0.75),
      fr = ctx.createRadialGradient(x, y, 0, x, y, (60 + 160 * (1 - sh)) * S);
    if (fr && fr.addColorStop) {
      fr.addColorStop(0, 'rgba(225,240,255,' + (0.5 * sh * a0).toFixed(3) + ')');
      fr.addColorStop(0.4, 'rgba(120,180,255,' + (0.18 * sh * a0).toFixed(3) + ')');
      fr.addColorStop(1, 'rgba(120,120,255,0)');
      ctx.fillStyle = fr;
      ctx.beginPath();
      ctx.arc(x, y, (60 + 160 * (1 - sh)) * S, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let j = 0; j < 3; j++) {
      const u = Math.min(1, tau / (0.55 + j * 0.15));
      ctx.globalAlpha = (1 - u) * (0.9 - j * 0.25) * a0;
      ctx.strokeStyle = j === 1 ? '#a58cff' : '#d8eeff';
      ctx.lineWidth = (3.2 - j * 0.7) * S;
      ctx.beginPath();
      ctx.arc(x, y, (8 + u * (70 + j * 22)) * S, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.55 * e * a0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * S;
    ctx.beginPath();
    ctx.arc(CX, CY, Rw * S, 0, Math.PI * 2);
    ctx.stroke(); // la órbita queda libre
  } else if (tau < 1.3 && next) {
    // restos: una cáscara azul y violeta que se apaga
    const u = (tau - 0.5) / 0.8;
    for (let j = 0; j < 2; j++) {
      ctx.globalAlpha = Math.max(0, 0.28 - j * 0.1) * (1 - u) * a0;
      ctx.strokeStyle = j ? '#a58cff' : '#8fd0ff';
      ctx.lineWidth = (5 - j * 2) * S;
      ctx.beginPath();
      ctx.arc(x, y, (70 + j * 14 + u * 12) * S, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // la estrella
  const g = ctx.createRadialGradient(x, y, 0, x, y, r0 * 4);
  if (g && g.addColorStop) {
    g.addColorStop(0, 'rgba(255,255,255,' + a0 + ')');
    g.addColorStop(0.14, 'rgba(220,240,255,' + (0.85 * a0).toFixed(3) + ')');
    g.addColorStop(0.4, 'rgba(120,190,255,' + (0.4 * a0).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(140,90,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r0 * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineCap = 'round';
  const sp = r0 * (3.2 + 2 * e);
  for (let i = 0; i < 4; i++) {
    const an = (i * Math.PI) / 2 + 0.3 + na * 0.2,
      L = sp * (i % 2 ? 0.65 : 1),
      lg = ctx.createLinearGradient(
        x - Math.cos(an) * L,
        y - Math.sin(an) * L,
        x + Math.cos(an) * L,
        y + Math.sin(an) * L,
      );
    if (lg && lg.addColorStop) {
      lg.addColorStop(0, 'rgba(160,200,255,0)');
      lg.addColorStop(0.5, 'rgba(240,250,255,' + (0.9 * a0).toFixed(3) + ')');
      lg.addColorStop(1, 'rgba(160,200,255,0)');
      ctx.strokeStyle = lg;
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(1, r0 * 0.22);
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(an) * L, y - Math.sin(an) * L);
    ctx.lineTo(x + Math.cos(an) * L, y + Math.sin(an) * L);
    ctx.stroke();
  }
  ctx.restore();
  // los tres arcos de carga: uno se enciende en cada golpe
  if (next && e <= 0) {
    ctx.save();
    ctx.lineCap = 'round';
    const rc = 17 * S;
    for (let j = 0; j < 3; j++) {
      const on = j < charge,
        a1 = -Math.PI / 2 + j * 2.094 + 0.22,
        a2 = a1 + 2.094 - 0.44;
      ctx.globalAlpha = (on ? 1 : 0.3) * a0;
      ctx.strokeStyle = on ? (charge === 3 ? '#ffffff' : '#bfe0ff') : '#bfe0ff';
      ctx.lineWidth = (on && charge === 3 ? 3.6 : 2.8) * S;
      ctx.beginPath();
      ctx.arc(x, y, rc + (charge === 3 ? Math.sin(t * 30) * 1.2 * S : 0), a1, a2);
      ctx.stroke();
    }
    ctx.restore();
  }
  // estelas de los asteroides que la onda empuja
  if (next && e > 0.05) {
    ctx.save();
    ctx.globalAlpha = 0.35 * e * a0;
    ctx.strokeStyle = '#bfe0ff';
    ctx.lineWidth = 1.2 * S;
    for (const o of ring.obs) {
      if (o.star) {
        continue;
      }
      const oa = obsAng(ring, o),
        p2 = novaPush(ring, oa, beatTime());
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(oa) * (Rw + 4) * S, CY + Math.sin(oa) * (Rw + 4) * S);
      ctx.lineTo(
        CX + Math.cos(oa) * (Rw + p2 * 0.85) * S,
        CY + Math.sin(oa) * (Rw + p2 * 0.85) * S,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}
let novaBeat = -1; // último golpe en que sonó la nova; -1 si no hay nova en el anillo siguiente
/**
 * Sonido de la nova del anillo siguiente: en cada golpe una nota de cristal que sube (carga) y,
 * al empezar el compás, el estallido. Se llama cada cuadro.
 */
function novaSound() {
  const nr = rings.get(level + 1);
  if (!nr || nr.type !== 'nova' || state !== 'play') {
    novaBeat = -1;
    return;
  }
  const b = Math.floor(beatTime() / TB);
  if (b === novaBeat) {
    return;
  }
  const first = novaBeat < 0;
  novaBeat = b;
  if (first) {
    return;
  }
  const inBar = ((b % 4) + 4) % 4;
  if (inBar === 0) {
    setShake(Math.max(shake, reduceMotion ? 0 : 4));
    buzz([20, 15, 40]);
    setFlash(Math.max(flash, 0.12));
    if (AC && !muted) {
      try {
        const n = AC.currentTime;
        noise(0.6, 9000, 1800, 0.22, 'highpass');
        [12, 19, 24, 28].forEach((sm, i) =>
          uiTone(ROOT * 2 * Math.pow(2, sm / 12), n + i * 0.02, 1.1, 0.04),
        );
        const o = AC.createOscillator(),
          g = AC.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(120, n);
        o.frequency.exponentialRampToValueAtTime(45, n + 0.4);
        g.gain.setValueAtTime(0.4, n);
        g.gain.exponentialRampToValueAtTime(0.0001, n + 0.5);
        o.connect(g);
        g.connect(uiOut());
        o.start(n);
        o.stop(n + 0.55);
      } catch (e) {}
    }
  } else if (AC && !muted) {
    try {
      uiTone(
        ROOT * 2 * Math.pow(2, [0, 7, 12][inBar - 1] / 12),
        AC.currentTime,
        0.35,
        0.035 + inBar * 0.01,
      );
    } catch (e) {}
  }
}
/** Dibuja las cáscaras de nova (gas verde con nudos de oxígeno) y sus estrellas. */
function drawNovaShells() {
  const bt = beatTime(),
    N = 140;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (const sh of novaShells(bt, camLevel)) {
    const life = NOVA_LIFE * (sh.s.big ? 1.6 : 1),
      fade = Math.min(1, sh.age / 0.25) * Math.pow(1 - sh.age / life, 0.8),
      cx = CX + sh.cx * S,
      cy = CY + sh.cy * S,
      r = sh.r * S;
    if (r < 2 || fade <= 0) {
      continue;
    }
    const isGap = a => {
      const a2 = a - sh.s.rot - sh.i * 0.9;
      for (let g = 0; g < sh.s.gaps; g++) {
        const c = (g * Math.PI * 2) / sh.s.gaps + Math.PI / 2 + 0.35,
          dd = Math.atan2(Math.sin(a2 - c), Math.cos(a2 - c));
        if (Math.abs(dd) < sh.s.gw / 2) {
          return true;
        }
      }
      return false;
    };
    const amp = Math.min(r * 0.035, 3.2 * S * (sh.s.big ? 1.5 : 1)),
      wob = th =>
        r + amp * (0.65 * Math.sin(th * 5 + sh.i * 2) + 0.35 * Math.sin(th * 9 - sh.age * 1.5));
    const pass = (lw, col, a) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.globalAlpha = a * fade;
      let on = false;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2,
          g = isGap(th),
          x = cx + Math.cos(th) * wob(th),
          y = cy + Math.sin(th) * wob(th);
        if (g) {
          on = false;
          continue;
        }
        if (!on) {
          ctx.moveTo(x, y);
          on = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };
    pass((sh.s.big ? 46 : 30) * S, '#178a4c', 0.14); // resplandor amplio del gas
    pass((sh.s.big ? 20 : 13) * S, '#2fbf73', 0.22); // el cuerpo de la cáscara
    pass((sh.s.big ? 7 : 4.5) * S, '#4fe38f', 0.6); // la parte más densa
    pass(1.8 * S, '#eafff2', 0.95); // el frente brillante
    for (let i = 0; i < 22; i++) {
      const th = (i / 22) * Math.PI * 2 + sh.i,
        x = cx + Math.cos(th) * wob(th),
        y = cy + Math.sin(th) * wob(th);
      if (isGap(th)) {
        continue;
      } // nudos de oxígeno
      if (i % 2) {
        continue;
      }
      const tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7),
        kg = ctx.createRadialGradient(x, y, 0, x, y, 7 * S);
      if (kg && kg.addColorStop) {
        kg.addColorStop(0, 'rgba(240,255,245,.95)');
        kg.addColorStop(0.35, 'rgba(120,240,170,.5)');
        kg.addColorStop(1, 'rgba(40,200,110,0)');
        ctx.fillStyle = kg;
      }
      ctx.globalAlpha = fade * (0.45 + 0.45 * tw);
      ctx.beginPath();
      ctx.arc(x, y, 7 * S, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // la estrella: blanca con halo verde, se hincha antes de cada estallido
  for (const s of novaSrc) {
    const Rk = R0 + (s.k - camLevel) * GAP,
      x = CX + Math.cos(s.ang) * Rk * S,
      y = CY + Math.sin(s.ang) * Rk * S;
    const ph = (((bt - s.b0) % s.P) + s.P) % s.P,
      pre = bt < s.b0 ? Math.max(0, 1 - (s.b0 - bt) / 1.2) : Math.max(0, (ph - (s.P - 1.2)) / 1.2),
      post = bt >= s.b0 ? Math.max(0, 1 - ph / 0.35) : 0;
    const rr2 = (s.big ? 9 : 5.5) * S * (1 + pre * 0.6 + post * 1.4),
      gg = ctx.createRadialGradient(x, y, 0, x, y, rr2 * 5);
    if (gg && gg.addColorStop) {
      gg.addColorStop(0, 'rgba(240,255,245,1)');
      gg.addColorStop(0.18, 'rgba(160,255,200,.75)');
      gg.addColorStop(1, 'rgba(40,200,110,0)');
      ctx.globalAlpha = 0.8 + 0.2 * pre;
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(x, y, rr2 * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#eafff1';
    ctx.lineWidth = 0.9 * S;
    for (let i = 0; i < 4; i++) {
      const an = (i * Math.PI) / 2 + 0.4,
        L = rr2 * (1.8 + post * 1.6);
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(an) * L, y - Math.sin(an) * L);
      ctx.lineTo(x + Math.cos(an) * L, y + Math.sin(an) * L);
      ctx.stroke();
    }
  }
  ctx.restore();
}
/** Dibuja todos los peligros activos: ondas, novas, estrellas veloces, chorros y cometas. */
function drawHazards() {
  for (const w of waves) {
    drawWave(w);
  }
  if (novaSrc.length) {
    drawNovaShells();
  }
  // órbitas y estrellas veloces
  for (const s of sstars) {
    if (level < s.from) {
      continue;
    }
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#cfe2ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const E = (i / 64) * Math.PI * 2,
        r = s.a * (1 - s.e * Math.cos(E)),
        nu =
          2 *
          Math.atan2(Math.sqrt(1 + s.e) * Math.sin(E / 2), Math.sqrt(1 - s.e) * Math.cos(E / 2)),
        an = nu + s.w;
      const x = CX + Math.cos(an) * r * S,
        y = CY + Math.sin(an) * r * S;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    s.trail.forEach(([x, y], i) => {
      ctx.globalAlpha = (i / s.trail.length) * 0.4;
      ctx.fillStyle = '#9fc6ff';
      ctx.beginPath();
      ctx.arc(CX + x * S, CY + y * S, 2.5 * S * (i / s.trail.length), 0, Math.PI * 2);
      ctx.fill();
    });
    const [x, y] = keplerPos(s, t),
      sx = CX + x * S,
      sy = CY + y * S;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 10 * S);
    if (g && g.addColorStop) {
      g.addColorStop(0, 'rgba(230,240,255,1)');
      g.addColorStop(0.35, 'rgba(160,200,255,.6)');
      g.addColorStop(1, 'rgba(120,170,255,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, 10 * S, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // rayos de energía
  for (const b of beams) {
    const R = rr(b.k) * S;
    if (R < 4) {
      continue;
    }
    if (b.t < b.warn) {
      const fl = 0.5 + 0.5 * Math.sin(b.t * 22);
      ctx.globalAlpha = 0.18 + 0.3 * fl * (b.t / b.warn);
      ctx.strokeStyle = '#9fd4ff';
      ctx.lineWidth = GAP * 0.55 * S;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const q = 1 - (b.t - b.warn) / (b.fire + 0.3);
      ctx.globalAlpha = Math.max(0, q);
      ctx.strokeStyle = '#eef7ff';
      ctx.lineWidth = GAP * 0.8 * S;
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // cometas rasantes: el camino se ilumina y luego avanza por tu anillo
  for (const c of comets) {
    const R = rr(c.k) * S;
    if (R < 6) {
      continue;
    }
    const fade = Math.min(1, c.left / 0.6);
    if (c.k === level && !jumping) {
      const a0 = c.ang,
        a1 = pAng,
        fl = c.t < c.delay ? 0.5 + 0.5 * Math.sin(c.t * 30) : 0.55;
      ctx.globalAlpha = 0.35 * fl * fade;
      ctx.strokeStyle = '#bfe6ff';
      ctx.lineWidth = 6 * S;
      ctx.setLineDash([4 * S, 6 * S]);
      ctx.beginPath();
      ctx.arc(
        CX,
        CY,
        R,
        Math.min(
          a0,
          a0 + c.sg * (((((a1 - a0) * c.sg) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)),
        ),
        Math.max(
          a0,
          a0 + c.sg * (((((a1 - a0) * c.sg) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)),
        ),
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const app = Math.min(1, c.t / c.delay) * fade,
      hx = CX + Math.cos(c.ang) * R,
      hy = CY + Math.sin(c.ang) * R,
      ox = Math.cos(c.ang),
      oy = Math.sin(c.ang),
      tx = -oy * c.sg,
      ty = ox * c.sg;
    // cola de gas: recta, azul, alejándose del agujero negro
    const L1 = 70 * S,
      g1 = ctx.createLinearGradient(hx, hy, hx + ox * L1, hy + oy * L1);
    if (g1 && g1.addColorStop) {
      g1.addColorStop(0, 'rgba(150,200,255,.75)');
      g1.addColorStop(1, 'rgba(120,180,255,0)');
      ctx.fillStyle = g1;
    }
    ctx.globalAlpha = app;
    ctx.beginPath();
    ctx.moveTo(hx + tx * 4 * S, hy + ty * 4 * S);
    ctx.lineTo(hx + ox * L1, hy + oy * L1);
    ctx.lineTo(hx - tx * 4 * S, hy - ty * 4 * S);
    ctx.closePath();
    ctx.fill();
    // cola de polvo: amarillenta y curvada hacia atrás de su movimiento
    const L2 = 55 * S,
      ex = hx + ox * L2 - tx * L2 * 0.55,
      ey = hy + oy * L2 - ty * L2 * 0.55,
      g2 = ctx.createLinearGradient(hx, hy, ex, ey);
    if (g2 && g2.addColorStop) {
      g2.addColorStop(0, 'rgba(255,240,200,.7)');
      g2.addColorStop(1, 'rgba(255,220,170,0)');
      ctx.fillStyle = g2;
    }
    ctx.beginPath();
    ctx.moveTo(hx + ox * 5 * S, hy + oy * 5 * S);
    ctx.quadraticCurveTo(
      hx + ox * L2 * 0.5 - tx * L2 * 0.1,
      hy + oy * L2 * 0.5 - ty * L2 * 0.1,
      ex,
      ey,
    );
    ctx.lineTo(hx - tx * 6 * S, hy - ty * 6 * S);
    ctx.closePath();
    ctx.fill();
    // cabeza: coma brillante y núcleo
    const cg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 18 * S);
    if (cg && cg.addColorStop) {
      cg.addColorStop(0, 'rgba(240,250,255,1)');
      cg.addColorStop(0.35, 'rgba(170,215,255,.65)');
      cg.addColorStop(1, 'rgba(130,190,255,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(hx, hy, 18 * S, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(hx, hy, 5.5 * S * (0.5 + 0.5 * app), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
/** Dibuja el destello blanco de la llamarada del agujero negro sobre toda la pantalla. */
function drawFlare() {
  if (flareT <= 0) {
    return;
  }
  ctx.globalAlpha = flareT > 0.45 ? 0.95 : (flareT / 0.45) * 0.95;
  ctx.fillStyle = '#fff6ec';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
}

/**
 * Cambia `waveBeepT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setWaveBeepT(value) {
  waveBeepT = value;
  return value;
}

/**
 * Cambia `waveProx` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setWaveProx(value) {
  waveProx = value;
  return value;
}

export {
  NOVA_LIFE,
  TUNE,
  drawFlare,
  drawHazards,
  drawNova,
  hazardTip,
  hazardsOnLand,
  hazardsReset,
  hazardsUpdate,
  novaBurst,
  novaHit,
  novaSound,
  waveBeepT,
  waveProx,
};

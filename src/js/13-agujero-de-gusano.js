/**
 * Dentro del agujero de gusano, modo ÓRBITA (anillos 30 a 41): la corriente lanza sola al planeta
 * al siguiente anillo cada pocos golpes de la música; tocar cambia el sentido en que gira sobre su
 * anillo, para quedar bajo el hueco. Entrada y salida son un portal corto (menos de un segundo)
 * hecho con la lente real: el mundo se estira y se abre en un círculo de luz con aberración
 * cromática. `wh` guarda el estado (ph: 'in', 'orb' u 'out'); null fuera del gusano.
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
import { AC, ROOT, master, noise, noiseHit, thump } from './02-audio.js';
import { TB, dKick, echoBus, impact } from './03-musica-ritmos.js';
import {
  camLevel,
  level,
  pAng,
  pLevel,
  score,
  setAppear,
  setCamLevel,
  setJumpTarget,
  setJumping,
  setLevel,
  setPAng,
  setPLevel,
  setScore,
  state,
  updateRingHUD,
} from './06-record-y-estado.js';
import { sizeK } from './07-planetas.js';
import {
  particles,
  setBurns,
  setFlash,
  setLastEaten,
  setPending,
  setPulse,
  setShake,
  setSunLevel,
  setTexts,
  setTrail,
  sunLevel,
  t,
  texts,
  tutorial,
} from './08-partida-estado.js';
import { seenTypes } from './09-recorridos.js';
import { beatKick, beatTime } from './10-ritmo-y-objetos.js';
import { WH_K, WORM_COL, bend, bendW, lensP, setBend, setWhRip } from './14-lente-gravitacional.js';
import { hazardTip } from './15-peligros.js';
import { ensureRings, rr } from './16-partida.js';

import { muted } from './core/settings.js';
import { misEvent } from './game/missions.js';
import { advanceJourney } from './core/journey.js';
import { GOAL } from './data/levels.js';

/**
 * Golpes de música entre lanzamientos: cuatro en los primeros anillos (para aprender), luego tres.
 *
 * @returns {number} Golpes de música.
 */
const whGap = () => (level + 1 < 34 ? 4 : 3);
// ORB_W: velocidad de giro sobre el anillo, en radianes por segundo; WH_IN y WH_OUT: duración
// del portal de entrada y de salida, en segundos.
const ORB_W = 1.75;
const WH_IN = 0.78;
const WH_OUT = 0.7;
let wh = null;
let whShock = null;
let gapC = {};
let viewInside = false;
let hideEarth = false;
/**
 * Sonido de entrada: un tirón grave que sube, con el aire que se arrastra hacia la boca.
 *
 * @param {number} dur Duración, en segundos.
 */
function whPull(dur) {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime,
      o = AC.createOscillator(),
      g = AC.createGain(),
      o2 = AC.createOscillator(),
      g2 = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(48, n);
    o.frequency.exponentialRampToValueAtTime(190, n + dur);
    g.gain.setValueAtTime(0.0001, n);
    g.gain.exponentialRampToValueAtTime(0.5, n + dur * 0.85);
    g.gain.exponentialRampToValueAtTime(0.0001, n + dur + 0.25);
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(ROOT / 2, n);
    o2.frequency.exponentialRampToValueAtTime(ROOT * 2, n + dur);
    g2.gain.setValueAtTime(0.0001, n);
    g2.gain.exponentialRampToValueAtTime(0.06, n + dur * 0.9);
    g2.gain.exponentialRampToValueAtTime(0.0001, n + dur + 0.15);
    o.connect(g);
    g.connect(master);
    o2.connect(g2);
    g2.connect(master);
    o.start(n);
    o2.start(n);
    o.stop(n + dur + 0.3);
    o2.stop(n + dur + 0.2);
    noiseHit(n, dur + 0.1, 'bandpass', 300, 0.32, master, 7000);
  } catch (e) {}
}
/** Sonido de salida: un golpe con eco. */
function whBoom() {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime;
    dKick(n);
    noiseHit(n, 1.1, 'lowpass', 5000, 0.45, master, 120);
    const e = echoBus();
    [12, 7, 0].forEach((sm, i) => {
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = 'sine';
      o.frequency.value = ROOT * Math.pow(2, sm / 12);
      g.gain.setValueAtTime(0.0001, n + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.07, n + i * 0.06 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, n + i * 0.06 + 0.9);
      o.connect(g);
      g.connect(e);
      g.connect(master);
      o.start(n + i * 0.06);
      o.stop(n + i * 0.06 + 1);
    });
  } catch (e) {}
}
const WH_G = 46; // cuánto crece la boca al entrar (hasta cubrir toda la pantalla)
/**
 * Empieza la entrada al gusano desde la posición actual del planeta: fija la lente al máximo y
 * corta el salto en curso.
 */
function whEnter() {
  const [wx, wy] = bendW(),
    pr = rr(pLevel);
  wh = {
    ph: 'in',
    t: 0,
    dir: 1,
    ex: Math.cos(pAng) * pr,
    ey: Math.sin(pAng) * pr,
    wx,
    wy,
    nextB: 0,
  };
  setJumping(false);
  setPending(false);
  setTexts(texts.filter(x => !x.tip));
  bend.fixed = true;
  bend.str = 1;
  bend.grow = 1;
  setShake(reduceMotion ? 0 : 3);
  buzz([20, 30, 50]);
  whPull(WH_IN * 0.85);
}
/** Termina la entrada: el planeta aparece dentro, sobre el anillo WH_K, y empieza ÓRBITA. */
function whInDone() {
  wh.ph = 'orb';
  setBend({ str: 0, a: -Math.PI / 2, L: 0, on: false, grow: 1, fixed: false });
  setLevel(WH_K);
  setPLevel(WH_K);
  setPAng(-Math.PI / 2);
  setJumpTarget(1);
  setTrail([]); // del otro lado el planeta aparece sobre el anillo WH_K, sin estela
  setScore(score + 1);
  if (!tutorial) {
    misEvent('ring');
    misEvent('reach', level);
  }
  updateRingHUD();
  ensureRings();
  setAppear(0);
  setPulse(1);
  setFlash(0.25);
  setShake(reduceMotion ? 0 : 6);
  const bi = Math.floor(beatTime() / TB);
  wh.gapB = 4;
  wh.nextB = bi + 3 + (bi % 2);
  try {
    if (AC) {
      impact(AC.currentTime);
    }
  } catch (e) {}
  buzz(30);
  thump();
  hazardTip('orbVisto', 'Órbita', 'Toca para cambiar de sentido', WORM_COL);
}
/** Empieza la salida del gusano: la otra boca se abre detrás del planeta y lo escupe. */
function whStartOut() {
  wh.ph = 'out';
  wh.t = 0;
  // la otra boca queda justo detrás de ti y te escupe hacia afuera
  setBend({ str: 1, a: pAng, L: level - 0.55, on: true, grow: WH_G, fixed: true });
  setShake(reduceMotion ? 0 : 6);
  buzz([30, 40, 60]);
  whBoom();
}
/**
 * Termina la salida: apaga la lente, lanza las ondas por los anillos y la onda de choque, aleja
 * el agujero negro y, la primera vez, muestra el dato real sobre los agujeros de gusano.
 */
function whOutDone() {
  const [wx, wy] = bendW();
  wh = null;
  setBend({ str: 0, a: -Math.PI / 2, L: 0, on: false, grow: 1, fixed: false });
  setWhRip({ t: 0, x: wx, y: wy });
  whShock = { t: 0, cx: CX + wx * S, cy: CY + wy * S };
  setSunLevel(Math.min(sunLevel, level - 2.2));
  setLastEaten(Math.floor(sunLevel));
  setBurns([]);
  setPulse(1);
  setShake(reduceMotion ? 0 : 7);
  thump();
  buzz([40, 60]);
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2,
      v = 50 + Math.random() * 200;
    particles.push({
      x: wx,
      y: wy,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.6 + Math.random() * 0.6,
      col: ['#ffffff', WORM_COL, '#9fd8ff', '#ffb3e6'][i % 4],
      s: 1.5 + Math.random() * 2,
    });
  }
  texts.push({
    txt: '¡Saliste del gusano!',
    x: 0,
    y: -R0 - 72,
    life: 1.6,
    size: 20,
    col: WORM_COL,
    center: true,
  });
  if (!seenTypes.whDato) {
    seenTypes.whDato = 1;
    try {
      localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes));
    } catch (e) {}
    texts.push({
      txt: 'Dato real: la relatividad los permite,',
      x: 0,
      y: -R0 - 140,
      life: 3.8,
      size: 11,
      col: BONE,
      center: true,
    });
    texts.push({
      txt: 'pero nadie ha visto uno todavía',
      x: 0,
      y: -R0 - 126,
      life: 3.8,
      size: 11,
      col: BONE,
      center: true,
    });
  }
}
/** Toque en modo ÓRBITA: invierte el sentido de giro sobre el anillo. */
function whTap() {
  if (!wh || wh.ph !== 'orb') {
    return;
  }
  wh.dir *= -1;
  wh.flipT = 1;
  noise(0.06, 2500, 7000, 0.07, 'highpass');
  buzz(8);
}
/**
 * Avanza un cuadro el portal de entrada o de salida: hace crecer o encoger la boca y mueve el
 * planeta hacia su centro.
 *
 * @param {number} dt Tiempo del cuadro, en segundos.
 */
function whTrans(dt) {
  wh.t += dt;
  advanceJourney(dt, 1.5 + 3 * clamp(wh.t / WH_IN, 0, 1), Math.min(1, level / GOAL));
  setCamLevel(camLevel + (level - camLevel) * Math.min(1, dt * 6));
  if (wh.ph === 'in') {
    const p = clamp(wh.t / WH_IN, 0, 1),
      q = clamp(p / 0.5, 0, 1),
      qe = q * q;
    // la boca crece hacia ti hasta cubrir la pantalla
    bend.grow = 1 + (WH_G - 1) * Math.pow(p, 2.6);
    const x = wh.ex + (wh.wx - wh.ex) * qe,
      // la Tierra cae hacia su centro (y la lente la estira en arco)
      y = wh.ey + (wh.wy - wh.ey) * qe;
    setPAng(Math.atan2(y, x));
    setPLevel((Math.hypot(x, y) - R0) / GAP + camLevel);
    if (Math.random() < 0.6) {
      const [lx, ly] = lensP(x, y);
      particles.push({
        x: lx,
        y: ly,
        vx: (wh.wx - lx) * 2,
        vy: (wh.wy - ly) * 2,
        life: 0.35,
        col: Math.random() < 0.5 ? '#ffffff' : WORM_COL,
        s: 1.4,
      });
    }
    if (p >= 1) {
      whInDone();
    }
  } else {
    const p = clamp(wh.t / WH_OUT, 0, 1),
      e = 1 - Math.pow(1 - p, 3);
    bend.grow = 1 + (WH_G - 1) * Math.pow(1 - e, 2.2);
    bend.str = 1 - clamp((p - 0.7) / 0.3, 0, 1); // la boca se encoge detrás de ti y se apaga
    if (p >= 1) {
      whOutDone();
    }
  }
}
/**
 * Dibuja el anillo de luz del portal con los colores separados, como en una lente real
 * (aberración cromática).
 *
 * @param {number} x Centro horizontal, en píxeles de pantalla.
 * @param {number} y Centro vertical, en píxeles de pantalla.
 * @param {number} R Radio, en píxeles de pantalla.
 * @param {number} al Opacidad, de 0 a 1.
 * @param {number} w Grosor base, en píxeles de pantalla.
 */
function chromaRing(x, y, R, al, w) {
  if (R < 1 || al <= 0.01) {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = al * 0.25;
  ctx.strokeStyle = WORM_COL;
  ctx.lineWidth = w * 7;
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.stroke();
  const sp = w * 1.3;
  [
    ['#ff6fb5', -sp],
    ['#7fd6ff', sp],
    ['#ffffff', 0],
  ].forEach(([c, o]) => {
    ctx.globalAlpha = al * (o ? 0.75 : 0.95);
    ctx.strokeStyle = c;
    ctx.lineWidth = w * (o ? 1.1 : 0.9);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, R + o), 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}
/**
 * Dibuja cómo se ve todo estando dentro: el mismo cielo y los mismos anillos vistos a través de
 * la garganta del gusano, la corriente, hacia dónde gira el planeta y cuánto falta para el
 * siguiente lanzamiento.
 *
 * @param {number} al Opacidad del efecto, de 0 a 1.
 */
function drawInside(al) {
  if (al <= 0.01) {
    return;
  }
  const bt = beatTime(),
    bk = beatKick(),
    D = Math.hypot(W, H) * 0.5,
    r0 = D * (0.8 + 0.015 * Math.sin(t * 1.3)) + bk * 4;
  ctx.save();
  ctx.globalAlpha = al * 0.1;
  ctx.fillStyle = '#5a46d6';
  ctx.fillRect(0, 0, W, H);
  // la corriente: luz que fluye hacia afuera, más rápida en cada golpe
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < 44; i++) {
    const a = i * 2.399 + 0.4,
      u = frac(t * 0.55 + frac(Math.sin(i * 12.9898) * 43758.5453) + bk * 0.02),
      r = (((R0 * 0.8 + u * (D - R0 * 0.8)) * S) / 1.6) * 1.6;
    ctx.globalAlpha = al * Math.sin(Math.PI * u) * 0.22;
    ctx.strokeStyle = i % 3 ? WORM_COL : '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(CX + Math.cos(a) * r, CY + Math.sin(a) * r);
    ctx.lineTo(CX + Math.cos(a) * (r + 26 + 30 * u), CY + Math.sin(a) * (r + 26 + 30 * u));
    ctx.stroke();
  }
  // luz de afuera que da vueltas en el borde de la garganta (la misma imagen, repetida)
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + t * 0.35 * (i % 2 ? 1 : -1);
    ctx.globalAlpha = al * 0.16;
    ctx.strokeStyle = i % 2 ? '#9fd8ff' : '#ffb3e6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(CX, CY, r0 * (0.97 + 0.02 * (i % 3)), a, a + 0.22);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createRadialGradient(CX, CY, r0 * 0.86, CX, CY, r0 * 1.12);
  if (g && g.addColorStop) {
    g.addColorStop(0, 'rgba(6,4,22,0)');
    g.addColorStop(0.45, 'rgba(10,6,34,' + 0.55 * al + ')');
    g.addColorStop(1, 'rgba(4,3,14,' + 0.92 * al + ')');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  chromaRing(CX, CY, r0 * 0.9, al * 0.55, 1.6);
  if (!wh || wh.ph !== 'orb' || state !== 'play') {
    return;
  }
  // hacia dónde giras: tres flechitas delante de la Tierra, sobre tu anillo
  const R = rr(pLevel) * S,
    fl = wh.flipT || 0;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = WORM_COL;
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 3; i++) {
    const a = pAng + wh.dir * (0.2 + i * 0.1),
      x = CX + Math.cos(a) * R,
      y = CY + Math.sin(a) * R,
      tx = -Math.sin(a) * wh.dir,
      ty = Math.cos(a) * wh.dir,
      nx = Math.cos(a),
      ny = Math.sin(a),
      h = 4.5;
    ctx.globalAlpha = (0.75 - i * 0.22) * (1 + fl * 0.3);
    ctx.beginPath();
    ctx.moveTo(x - tx * h + nx * h, y - ty * h + ny * h);
    ctx.lineTo(x, y);
    ctx.lineTo(x - tx * h - nx * h, y - ty * h - ny * h);
    ctx.stroke();
  }
  // cuánto falta para que la corriente te lance: un arco alrededor de la Tierra que se llena con la
  // música
  const gB = wh.gapB || 2,
    ph = clamp((bt / TB - (wh.nextB - gB)) / gB, 0, 1),
    ex = CX + Math.cos(pAng) * R,
    ey = CY + Math.sin(pAng) * R,
    rr3 = PR * S * 1.15 * sizeK() + 6;
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = WORM_COL;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(ex, ey, rr3, -Math.PI / 2, -Math.PI / 2 + ph * Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(ex, ey, rr3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Cambia `gapC` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setGapC(value) {
  gapC = value;
  return value;
}

/**
 * Cambia `hideEarth` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHideEarth(value) {
  hideEarth = value;
  return value;
}

/**
 * Cambia `viewInside` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setViewInside(value) {
  viewInside = value;
  return value;
}

/**
 * Cambia `wh` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setWh(value) {
  wh = value;
  return value;
}

/**
 * Cambia `whShock` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setWhShock(value) {
  whShock = value;
  return value;
}

export {
  ORB_W,
  WH_IN,
  WH_OUT,
  drawInside,
  gapC,
  hideEarth,
  viewInside,
  wh,
  whEnter,
  whGap,
  whShock,
  whStartOut,
  whTap,
  whTrans,
};

/**
 * Generación de los anillos de cada partida (con el azar con semilla de los recorridos) y la memoria de
 * los huecos del agujero de gusano.
 */
import { TB } from '../audio/music-tracks.js';
import { level, lvl, rings } from '../core/state.js';
import { JUMP_DUR, curGoal, t, tutorial } from '../core/run-state.js';
import { ringType, rng } from './courses.js';
import { RING_MUL, placeInGap } from './beat.js';
import { TUNE } from './hazards.js';
import { COIN_RINGS } from '../data/levels.js';
import { NEB_AT, OBJ_NEBULA, OBJ_PULSAR, PUL_AT } from '../data/hazards.js';

/**
 * Crea un anillo con sus obstáculos y su giro según el tipo que le toca en el nivel.
 *
 * @param {number} k Nivel de anillo (0 es el anillo de partida, sin obstáculos).
 * @returns {object} Anillo {obs, w, phase, type, …}; w es la velocidad de giro, en radianes por
 *   segundo.
 */
function makeRing(k) {
  if (k === 0) {
    return { obs: [], w: 0, phase: 0, type: 'clasico' };
  }
  const type = ringType(k),
    dir = rng() < 0.5 ? -1 : 1,
    base = rng() * Math.PI * 2,
    obs = [];
  const ring = { obs, w: 0, phase: 0, type };
  if (type === 'vacio') {
    ring.w = dir * 0.3;
    return ring;
  }
  if (type === 'uno') {
    obs.push({ a: base, r: 9, seed: rng() * 100 });
    ring.w = dir * 0.45;
    return ring;
  }
  if (type === 'gusano') {
    ring.w = 0;
    return ring;
  } // anillo donde se aparece dentro del gusano
  if (type === 'orbita') {
    // dentro del gusano: anillos quietos con uno o dos huecos; cada hueco queda a un lado del
    // anterior (izquierda o derecha)
    const prev = gapC[k - 1] !== undefined ? gapC[k - 1] : -Math.PI / 2,
      two = k < 40,
      sg = rng() < 0.5 ? -1 : 1;
    const gc = prev + sg * (0.4 + rng() * 0.4);
    gapC[k] = gc;
    ring.gc = gc;
    const hg = two ? 0.68 : 0.6,
      stepA = 0.21,
      ad = (x, y) => Math.abs(Math.atan2(Math.sin(x - y), Math.cos(x - y)));
    const pre = k === 39,
      g1 = pre ? gc - 0.78 : gc,
      // el último de dos huecos los junta: desde cualquiera llegas al hueco único que sigue
      g2 = pre ? gc + 0.78 : gc + Math.PI;
    for (let a = 0; a < Math.PI * 2 - 1e-6; a += stepA) {
      const ang = gc + a;
      if (ad(ang, g1) < hg || (two && ad(ang, g2) < hg)) {
        continue;
      }
      obs.push({ a: ang, r: 8, seed: rng() * 100 });
    }
    if (pre) {
      ring.g2 = [g1, g2];
    }
    ring.w = k >= 40 ? (rng() < 0.5 ? -1 : 1) * 0.14 : 0;
    return ring;
  }
  if (type === 'barrera') {
    for (let a = 0; a < Math.PI * 2 - 1e-6; a += 0.2) {
      obs.push({ a: base + a, r: 9, seed: rng() * 100 });
    }
    ring.w = dir * 0.25;
    return ring;
  }
  if (type === 'muralla') {
    // anillo casi lleno con uno o dos huecos
    const gaps = lvl >= 6 && !tutorial ? 1 : 2,
      hg = lvl === 5 && !tutorial ? 0.38 : !tutorial && TUNE[lvl] ? TUNE[lvl].hg : 0.46,
      stepA = 0.22;
    for (let a = 0; a < Math.PI * 2 - 1e-6; a += stepA) {
      let inGap = false;
      for (let g = 0; g < gaps; g++) {
        const c = (g * Math.PI * 2) / gaps,
          d = Math.atan2(Math.sin(a - c), Math.cos(a - c));
        if (Math.abs(d) < hg) {
          inGap = true;
        }
      }
      if (!inGap) {
        obs.push({ a: base + a, r: 9, seed: rng() * 100 });
      }
    }
    ring.w = dir * Math.min(0.5 + k * 0.006, 0.8) * (!tutorial ? RING_MUL[lvl] : 1);
  } else if (type === 'respiracion') {
    // 16 asteroides que se encogen en cada golpe: grandes cierran el anillo y chicos dejan pasar
    // a la Tierra con margen. El giro va con la música: en cada golpe en que se encogen hay un
    // hueco justo encima del planeta.
    const n = 16,
      sig = (Math.PI * 2) / n;
    ring.w = (dir * sig) / (4 * TB);
    ring.sync = true;
    const off = -Math.PI / 2 - sig / 2 - ring.w * JUMP_DUR;
    for (let i = 0; i < n; i++) {
      obs.push({ a: off + i * sig, r: 24, seed: rng() * 100 });
    }
  } else if (type === 'nova') {
    const stepA = 0.22;
    ring.k = k;
    ring.na = base + 0.11;
    // la estrella también quema: no se atraviesa
    obs.push({ a: ring.na, r: 9, seed: 0, star: true });
    for (let a = 0.22; a < Math.PI * 2 - 0.2; a += stepA) {
      obs.push({ a: base + a + 0.11, r: 9, seed: rng() * 100 });
    }
    ring.w = dir * 0.22;
  } else if (type === 'contragiro') {
    // dos arcos que giran en sentidos opuestos
    const m = !tutorial && TUNE[lvl] ? TUNE[lvl].arc : 10,
      stepA = 0.22;
    for (let i = 0; i < m; i++) {
      obs.push({ a: base + i * stepA, r: 9, seed: rng() * 100, dir: 1 });
      obs.push({ a: base + Math.PI + i * stepA, r: 9, seed: rng() * 100, dir: -1 });
    }
    ring.w = Math.min(0.42 + k * 0.005, 0.7) * (!tutorial && TUNE[lvl] ? TUNE[lvl].cg(k) : 1);
  } else if (type === 'escalera') {
    // todos los anillos del bloque giran igual y con el hueco alineado: se pueden encadenar
    let bs = k;
    while (bs > 1 && ringType(bs - 1) === 'escalera') {
      bs--;
    }
    const bdir = bs % 2 ? 1 : -1,
      hg = 0.45,
      stepA = 0.22;
    for (let a = 0; a < Math.PI * 2 - 1e-6; a += stepA) {
      let inGap = false;
      for (let g = 0; g < 3; g++) {
        const c = (g * Math.PI * 2) / 3,
          d = Math.atan2(Math.sin(a - c), Math.cos(a - c));
        if (Math.abs(d) < hg) {
          inGap = true;
        }
      }
      if (!inGap) {
        obs.push({ a: a + bs * 1.3, r: 9, seed: rng() * 100 });
      }
    }
    ring.w = bdir * 0.8;
    ring.phase = ring.w * t;
  } else if (type === 'marea' || type === 'arrastre') {
    // marea: acelera y frena y se deforma en óvalo · arrastre: el espacio te lleva consigo
    const n = k < 20 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      obs.push({
        a: base + i * ((Math.PI * 2) / n) + (rng() - 0.5) * 0.4,
        r: 9.5,
        seed: rng() * 100,
      });
    }
    ring.w =
      dir *
      Math.min(
        type === 'marea' ? 0.6 + k * 0.006 : 0.5 + k * 0.005,
        type === 'marea' ? 0.95 : 0.8,
      ) *
      (!tutorial ? RING_MUL[lvl] : 1);
    ring.tid = rng() * Math.PI;
    ring.tv = 0.45 + rng() * 0.3;
    ring.ws = rng() * 6;
  } else if (type === 'freno') {
    // gira y de pronto cambia de sentido
    const n = k < 30 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      obs.push({
        a: base + i * ((Math.PI * 2) / n) + (rng() - 0.5) * 0.4,
        r: 9.5,
        seed: rng() * 100,
      });
    }
    ring.w = dir * Math.min(0.9 + k * 0.01, 1.6);
    ring.sgn = 1;
    ring.ft = 0;
    ring.fp = 1.2 + rng() * 0.8;
    ring.flash = 0;
  } else {
    const size = () => (k < 20 ? 9 : 9 + rng() * 1.5);
    const n = (k < 12 ? 1 : k < 32 ? 2 : 3) + (lvl >= 5 && !tutorial ? 1 : 0);
    const sp = Math.min(0.55 + k * 0.01, 1.05) * (0.85 + rng() * 0.3);
    for (let i = 0; i < n; i++) {
      obs.push({
        a: base + i * ((Math.PI * 2) / n) + (rng() - 0.5) * 0.5,
        r: size(),
        seed: rng() * 100,
      });
    }
    ring.w = dir * sp * (!tutorial ? RING_MUL[lvl] : 1);
  }
  if (!tutorial && (type === 'clasico' || type === 'muralla' || type === 'respiracion')) {
    const nebS = lvl === 2 ? OBJ_NEBULA : NEB_AT[lvl],
      pulS = lvl === 2 ? OBJ_PULSAR : PUL_AT[lvl];
    if (nebS && nebS.has(k)) {
      ring.obj = placeInGap(ring, { kind: 'nebula' });
    } else if (pulS && pulS.has(k)) {
      ring.obj = placeInGap(ring, { kind: 'pulsar' });
    } else if (COIN_RINGS[lvl] && COIN_RINGS[lvl].has(k)) {
      ring.coin = placeInGap(ring, {});
    }
  }
  return ring;
}

/** Crea los anillos que faltan cerca del planeta (hasta 6 arriba) y borra los de muy abajo. */
function ensureRings() {
  for (let k = Math.max(0, level - 3); k <= Math.min(level + 6, curGoal()); k++) {
    if (!rings.has(k)) {
      rings.set(k, makeRing(k));
    }
  }
  for (const k of [...rings.keys()]) {
    if (k < level - 3) {
      rings.delete(k);
    }
  }
}

let gapC = {};

/**
 * Cambia `gapC` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setGapC(value) {
  gapC = value;
  return value;
}

export { ensureRings, setGapC };

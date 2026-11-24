/**
 * Ciclo de una partida: crea los anillos y sus obstáculos, prepara y arranca la partida, salta,
 * aterriza, gana y muere. También muestra el contador de intentos.
 * Los anillos se generan con la semilla fija SEED (rng), así cada nivel sale siempre igual.
 */
import { BONE, PR, R0, buzz, elHud, elPanel, reduceMotion } from './01-pantalla-y-utilidades.js';
import { AC, NOISE, ROOT, SCALE, cowbell, master, noise, sub, suck, thump } from './02-audio.js';
import { TB } from './03-musica-ritmos.js';
import { startMusic, stopMusic } from './05-musica-reproductor.js';
import {
  attX,
  attempts2,
  attempts3,
  attemptsOf,
  best,
  bestOf,
  charge,
  jumpT,
  jumpTarget,
  jumping,
  level,
  lvl,
  newRec,
  pAng,
  pLevel,
  rings,
  runRecord,
  saveBest,
  score,
  setAppear,
  setAstFade,
  setAttempts2,
  setAttempts3,
  setBest,
  setBestOf,
  setCamLevel,
  setCharge,
  setCombo,
  setCrossed,
  setJumpT,
  setJumpTarget,
  setJumping,
  setLastLand,
  setLevel,
  setNewRec,
  setPAng,
  setPLevel,
  setRings,
  setRunRecord,
  setScore,
  setState,
  state,
  updateRingHUD,
} from './06-record-y-estado.js';
import {
  chargeMax,
  curPlanet,
  jumpDur,
  markNewPlanets,
  saveRunStats,
  setPlutoOk,
  setShieldLeft,
  setUsedDouble,
  unlockedIds,
  usedDouble,
} from './07-planetas.js';
import {
  JUMP_DUR,
  PERFECT,
  attempts,
  burns,
  curGoal,
  hintsShown,
  jumpClear,
  lastEaten,
  particles,
  perfCount,
  pipFlash,
  pulse,
  readyHintDone,
  setAttempts,
  setBurns,
  setCanRestart,
  setChargeFlash,
  setCulprit,
  setCulpritT,
  setDeadT,
  setFlash,
  setGest,
  setHintT,
  setHintsShown,
  setHoleFlare,
  setJumpClear,
  setLandPop,
  setLastEaten,
  setParticles,
  setPending,
  setPerfCount,
  setPulse,
  setReadyHintDone,
  setShake,
  setShowHint,
  setSlowTimer,
  setStreak,
  setSunLevel,
  setSwallow,
  setTexts,
  setTimeScale,
  setTrail,
  setTutorial,
  setWinT,
  shake,
  showHint,
  streak,
  sunLevel,
  t,
  texts,
  tutorial,
} from './08-partida-estado.js';
import { SEED, ringType, rng, seenTypes, setRngState } from './09-recorridos.js';
import {
  RING_MUL,
  coinChime,
  objChime,
  obsAng,
  obsRad,
  placeInGap,
  runCoins,
  setPushing,
  setRunCoins,
  setStarBoost,
  setWallet,
  starBoost,
  starLaunch,
  starPush,
  stretchAt,
  updateWallet,
  wallet,
} from './10-ritmo-y-objetos.js';
import { setHot, setHotT, setSkyFlash } from './11-peligros-datos.js';
import {
  lastJT,
  periLeft,
  pfx,
  setBurnT,
  setEclipseT,
  setGhostT,
  setLastJT,
  setPeriLeft,
  setPfx,
  setPredT,
  setShieldT,
  usePower,
} from './12-poderes.js';
import { gapC, setGapC, setWh, setWhShock, wh, whStartOut } from './13-agujero-de-gusano.js';
import { WH_EXIT, setBend, setWhRip } from './14-lente-gravitacional.js';
import { TUNE, hazardsOnLand, hazardsReset, setWaveBeepT, setWaveProx } from './15-peligros.js';
import { tutRespawn, tutorialWin } from './17-tutorial.js';

import { COIN_RINGS, LEVELS } from './data/levels.js';
import { TYPE_INFO } from './data/courses.js';
import { NEB_AT, OBJ_NEBULA, OBJ_PULSAR, PUL_AT } from './data/hazards.js';
import { powerReadySound } from './audio/sfx.js';
import { lvStarsGot } from './game/progress.js';
import { setPendingTut } from './core/screen.js';
import { misEvent, misWin, noteDouble } from './game/missions.js';
import { resetJourney } from './core/journey.js';
import { zoneOf } from './game/zones.js';
import { rr } from './core/geometry.js';
import { rescuedCards } from './render/planets.js';

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
/** Deja todo el estado de la partida como al principio y crea los primeros anillos. */
function setup() {
  setRngState(SEED);
  setSwallow(null);
  setHoleFlare(0);
  setGapC({});
  setWh(null);
  setWhShock(null);
  setWhRip(null);
  setBend({ str: 0, a: -Math.PI / 2, L: 0, on: false, grow: 1, fixed: false });
  setRings(new Map());
  setLevel(0);
  setPLevel(0);
  setCamLevel(0);
  setPAng(-Math.PI / 2);
  setJumping(false);
  setJumpT(0);
  setCombo(0);
  setLastLand(-9);
  setScore(0);
  setStreak(0);
  setJumpClear(999);
  setCulprit(null);
  setCulpritT(0);
  setLandPop(0);
  setAstFade(0);
  setAppear(1);
  setParticles([]);
  setTrail([]);
  setTexts([]);
  setBurns([]);
  setTimeScale(1);
  setSlowTimer(0);
  setSunLevel(-1.6);
  setLastEaten(-2);
  setGhostT(0);
  setShieldT(0);
  setEclipseT(0);
  setPfx([]);
  setLastJT(1);
  setPeriLeft(0);
  setPredT(0);
  setBurnT(0);
  hazardsReset();
  try {
    resetJourney();
  } catch (e) {}
  ensureRings();
}
/** Empieza o reinicia una partida: limpia peligros y poderes, prepara la pantalla y la música. */
function start() {
  setHot(0);
  setHotT(0);
  setSkyFlash(0);
  setWaveProx(0);
  setWaveBeepT(0);
  if (elPanel && elPanel.classList) {
    elPanel.classList.remove('wscr');
  }
  setTutorial(false);
  setPendingTut(false);
  setup();
  setState('play');
  setWinT(0);
  setPerfCount(0);
  if (lvl >= 3) {
    attX[lvl] = (attX[lvl] || 0) + 1;
    try {
      localStorage.setItem('orbita_p' + (lvl + 1) + '_intentos', String(attX[lvl]));
    } catch (e) {}
  } else if (lvl === 2) {
    setAttempts3(attempts3 + 1);
    try {
      localStorage.setItem('orbita_p3_intentos', String(attempts3));
    } catch (e) {}
  } else if (lvl === 1) {
    setAttempts2(attempts2 + 1);
    try {
      localStorage.setItem('orbita_p2_intentos', String(attempts2));
    } catch (e) {}
  } else {
    setAttempts(attempts + 1);
    try {
      localStorage.setItem('orbita_p1_intentos', String(attempts));
    } catch (e) {}
  }
  setRunRecord(bestOf(lvl));
  setNewRec(false);
  updateRingHUD();
  elHud.style.opacity = 1;
  elPanel.classList.add('hide');
  setCharge(0);
  setJumpTarget(1);
  setPending(false);
  setGest(null);
  setShowHint(false);
  setShieldLeft(1);
  setUsedDouble(false);
  setPushing(false);
  setStarBoost(false);
  setRunCoins(0);
  startMusic();
}

/**
 * Distancia libre entre el planeta y el asteroide más cercano de un anillo; sirve para decidir si
 * un aterrizaje fue perfecto.
 *
 * @param {number} k Nivel de anillo.
 * @param {boolean} onlyApproaching Si es true, solo cuenta los asteroides que vienen hacia él.
 * @returns {number} Distancia entre bordes, en unidades del juego (999 si no hay ninguno).
 */
function clearance(k, onlyApproaching) {
  const ring = rings.get(k);
  if (!ring) {
    return 999;
  }
  const R = rr(k),
    px = Math.cos(pAng) * R,
    py = Math.sin(pAng) * R;
  let m = 999;
  for (const o of ring.obs) {
    if (o.gone) {
      continue;
    }
    const oa = obsAng(ring, o);
    if (onlyApproaching) {
      const diff = Math.atan2(Math.sin(oa - pAng), Math.cos(oa - pAng));
      if (diff * (o.dir || 1) * ring.w * (ring.sgn || 1) >= 0) {
        continue;
      }
    }
    const Rs = R * stretchAt(ring, oa);
    m = Math.min(
      m,
      Math.hypot(px - Math.cos(oa) * Rs, py - Math.sin(oa) * Rs) - (PR + obsRad(ring, o)),
    );
  }
  return m;
}
/**
 * Convierte en pleno vuelo un salto simple en doble, si hay carga. Con otro planeta que no sea la
 * Tierra usa su poder en lugar del salto doble.
 */
function upgradeToDouble() {
  if (
    !jumping ||
    jumpTarget !== 1 ||
    charge < chargeMax() ||
    level + 2 > curGoal() ||
    (tutorial && level < 8) ||
    wh ||
    ['gusano', 'orbita'].includes(ringType(level + 1)) ||
    ['gusano', 'orbita'].includes(ringType(level + 2))
  ) {
    return;
  }
  if (!tutorial && curPlanet && curPlanet !== 'tierra') {
    usePower(true);
    return;
  }
  // Busca el punto del salto doble con la misma altura que el simple (la curva es
  // 1 - (1 - p)^3 y el doble recorre dos anillos), para que el planeta no dé un brinco.
  const p1 = Math.min(jumpT / jumpDur(), 1),
    e1 = 1 - Math.pow(1 - p1, 3);
  const p2 = 1 - Math.cbrt(1 - e1 / 2);
  setJumpTarget(2);
  setJumpT(p2 * 0.24);
  setCrossed(false);
  setCharge(0);
  setShowHint(false);
  setPending(false);
  setUsedDouble(true);
  noteDouble();
  noise(0.25, 300, 6000, 0.25, 'bandpass');
  cowbell(SCALE[4] + 12);
  buzz([15, 30, 25]);
}
/**
 * El planeta llegó al último anillo y escapa del agujero negro: guarda el récord, desbloquea
 * planetas y muestra la pantalla de victoria.
 */
function win() {
  if (tutorial) {
    tutorialWin();
    return;
  }
  const before = unlockedIds();
  misWin(lvl, curPlanet, sesTries);
  setState('win');
  setWinT(0);
  setCanRestart(false);
  setFlash(0.6);
  setShake(reduceMotion ? 0 : 8);
  setPulse(1);
  if (level > bestOf(lvl)) {
    setBestOf(lvl, level);
  }
  saveRunStats();
  if (!usedDouble) {
    setPlutoOk(true);
    try {
      localStorage.setItem('orbita_p1_pluton', '1');
    } catch (e) {}
  }
  const rescued = rescuedCards(before);
  if (score > best) {
    setBest(score);
    saveBest();
  }
  stopMusic();
  winSound();
  buzz([40, 60, 40, 60, 120]);
  elHud.style.opacity = 0;
  setTimeout(() => {
    const cr = COIN_RINGS[lvl] ? [...COIN_RINGS[lvl]] : [],
      gotR = lvStarsGot(lvl),
      nSt = cr.filter(k => gotR.includes(k)).length,
      nx = LEVELS[lvl + 1];
    elPanel.classList.remove('top');
    elPanel.classList.add('wscr');
    const ICO_RE =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 4.5v4h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const ICO_LV =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.6" fill="currentColor"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="9.6" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".55"/></svg>';
    const ICO_PLAY =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
    const tries = attemptsOf(lvl);
    elPanel.innerHTML =
      '<div class="title wtit">Escapaste</div>' +
      '<div class="wtries">' +
      tries +
      (tries === 1 ? ' intento' : ' intentos') +
      '</div>' +
      (cr.length
        ? '<div class="wstars" aria-label="Estrellas: ' +
          nSt +
          ' de ' +
          cr.length +
          '">' +
          cr
            .map(
              (_, k) =>
                '<span class="' +
                (k < nSt ? 'on' : '') +
                '" style="animation-delay:' +
                (0.35 + k * 0.09).toFixed(2) +
                's">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>' +
                '</span>',
            )
            .join('') +
          '</div>'
        : '') +
      '<div class="wact"><button type="button" class="wico" data-act="again" aria-label="Repetir">' +
      ICO_RE +
      '</button>' +
      (nx
        ? '<button type="button" class="wgo" data-act="next" aria-label="Siguiente: ' +
          nx.name +
          '">' +
          ICO_PLAY +
          '</button>'
        : '<button type="button" class="wgo" data-act="levels" aria-label="Galaxias">' +
          ICO_LV +
          '</button>') +
      '<button type="button" class="wico" data-act="levels" aria-label="Niveles">' +
      ICO_LV +
      '</button></div>';
    if (rescued) {
      markNewPlanets();
    }
    elPanel.classList.remove('hide');
    setTimeout(() => {
      setCanRestart(true);
    }, 600);
  }, 2400);
}
/** Fanfarria de victoria. */
function winSound() {
  if (!AC) {
    return;
  }
  try {
    const n = AC.currentTime + 0.05;
    const src = AC.createBufferSource();
    src.buffer = NOISE;
    const f = AC.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1;
    f.frequency.setValueAtTime(300, n);
    f.frequency.exponentialRampToValueAtTime(7000, n + 1.6);
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, n);
    g.gain.exponentialRampToValueAtTime(0.3, n + 1.5);
    g.gain.exponentialRampToValueAtTime(0.0001, n + 1.9);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(n);
    src.stop(n + 2);
    const chord = (t0, semis, dur, gain) => {
      for (const sm of semis) {
        for (const det of [-6, 6]) {
          const o = AC.createOscillator(),
            gg = AC.createGain(),
            lp = AC.createBiquadFilter();
          o.type = 'sawtooth';
          o.frequency.value = (ROOT / 2) * Math.pow(2, sm / 12);
          o.detune.value = det;
          lp.type = 'lowpass';
          lp.frequency.value = 1800;
          gg.gain.setValueAtTime(0.0001, t0);
          gg.gain.exponentialRampToValueAtTime(gain, t0 + 0.08);
          gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          o.connect(lp);
          lp.connect(gg);
          gg.connect(master);
          o.start(t0);
          o.stop(t0 + dur + 0.1);
        }
      }
    };
    chord(n + 1.6, [3, 7, 10, 15], 4.5, 0.03); // acorde luminoso (Si mayor)
    const bell = (t0, sm, gain) => {
      const o = AC.createOscillator(),
        gg = AC.createGain();
      o.type = 'sine';
      o.frequency.value = ROOT * 2 * Math.pow(2, sm / 12);
      gg.gain.setValueAtTime(0.0001, t0);
      gg.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
      gg.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2);
      o.connect(gg);
      gg.connect(master);
      o.start(t0);
      o.stop(t0 + 2.3);
    };
    [3, 7, 10, 15].forEach((sm, i) => bell(n + 1.6 + i * 0.16, sm, 0.08));
    const o = AC.createOscillator(),
      gg = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(80, n + 1.6);
    o.frequency.exponentialRampToValueAtTime(40, n + 3);
    gg.gain.setValueAtTime(0.7, n + 1.6);
    gg.gain.exponentialRampToValueAtTime(0.0001, n + 3.2);
    o.connect(gg);
    gg.connect(master);
    o.start(n + 1.6);
    o.stop(n + 3.3);
  } catch (e) {}
}
/**
 * Salto doble desde el anillo (dos anillos de golpe), si hay carga y los anillos siguientes lo
 * permiten. Con otro planeta que no sea la Tierra usa su poder.
 */
function doubleJump() {
  if (
    state !== 'play' ||
    jumping ||
    charge < chargeMax() ||
    level + 2 > curGoal() ||
    (tutorial && level < 8) ||
    wh ||
    ['gusano', 'orbita'].includes(ringType(level + 1)) ||
    ['gusano', 'orbita'].includes(ringType(level + 2))
  ) {
    return;
  }
  if (!tutorial && curPlanet && curPlanet !== 'tierra') {
    usePower(false);
    return;
  }
  setJumping(true);
  setJumpT(0);
  setJumpTarget(2);
  setCrossed(false);
  setCharge(0);
  setShowHint(false);
  setUsedDouble(true);
  noteDouble();
  noise(0.25, 300, 6000, 0.25, 'bandpass');
  cowbell(SCALE[4] + 12);
  buzz([15, 30, 25]);
}
/** Salto simple al anillo siguiente. Con cargas de perihelio el salto es instantáneo. */
function jump() {
  setJumping(true);
  setJumpT(0);
  setJumpTarget(1);
  if (periLeft > 0 && !tutorial) {
    setPeriLeft(periLeft - 1);
    setJumpT(99);
    setGhostT(0.12);
    pfx.push({ k: 'destello', t: 0, a: pAng, l0: pLevel });
    noise(0.12, 6000, 9000, 0.2, 'highpass');
  }
  setJumpClear(999);
  noise(0.07, 2500, 7000, 0.07, 'highpass');
}
/**
 * Al aterrizar: cuenta puntos y rachas de aterrizajes perfectos, recoge estrellas y objetos,
 * lanza los peligros del anillo, avisa de tipos de anillo distintos y gana al llegar a la meta.
 *
 * @param {boolean} isDouble true si se llegó con un salto doble.
 */
function onLand(isDouble) {
  const z = zoneOf(level);
  const perfect = !isDouble && Math.min(jumpClear, clearance(level, false)) < PERFECT;
  let gain = isDouble ? Math.max(2, lastJT) : 1;
  if (perfect) {
    setStreak(Math.min(streak + 1, 5));
    gain = 1 + streak;
    setPerfCount(perfCount + 1);
    misEvent('perf');
    if (streak >= 3) {
      misEvent('streak3');
    }
  } else if (!isDouble) {
    setStreak(0);
  }
  if (isDouble && !starBoost) {
    texts.push({
      txt: lastJT === 3 ? 'Monte Olimpo +3' : 'Salto doble +2',
      x: 0,
      y: -R0 - 26,
      life: 1,
      size: 16,
      col: z.s2,
    });
  }
  if (lastJT === 3) {
    pfx.push({ k: 'crater', t: 0, a: pAng });
    const pr = rr(level),
      x0 = Math.cos(pAng) * pr,
      y0 = Math.sin(pAng) * pr;
    for (let i = 0; i < 40; i++) {
      const a = pAng + (Math.PI / 2) * (i % 2 ? 1 : -1) + (Math.random() - 0.5) * 0.7,
        v = 50 + Math.random() * 140;
      particles.push({
        x: x0,
        y: y0,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.7 + Math.random() * 0.6,
        col: ['#c8573a', '#e0866a', '#8f3a24', '#f0b090'][i % 4],
        s: 2 + Math.random() * 3,
      });
    }
    setShake(reduceMotion ? 0 : 6);
  }
  setLastJT(1);
  setStarBoost(false);
  if (perfect && charge < chargeMax()) {
    setCharge(charge + 1);
    pipFlash[charge - 1] = 1;
    if (charge === chargeMax()) {
      powerReadySound();
      buzz([20, 40, 20, 40, 60]);
      setChargeFlash(1);
      if (!readyHintDone) {
        setReadyHintDone(true);
        try {
          localStorage.setItem('orbita_p1_poderlisto', '1');
        } catch (e) {}
        texts.push({
          txt: '¡Poder listo!',
          x: 0,
          y: -R0 - 96,
          life: 2.2,
          size: 20,
          col: '#ffd36b',
          center: true,
        });
        texts.push({
          txt: 'Desliza hacia arriba (o tecla D)',
          x: 0,
          y: -R0 - 76,
          life: 2.2,
          size: 12,
          col: BONE,
          center: true,
        });
      }
      setShowHint(hintsShown < 3);
      if (showHint) {
        setHintT(2.2);
        setHintsShown(hintsShown + 1);
        try {
          localStorage.setItem('orbita_p1_pista', String(hintsShown));
        } catch (e) {}
      }
    }
  }
  setScore(score + gain);
  if (!tutorial) {
    misEvent('ring');
    misEvent('reach', level);
  }
  thump();
  setPulse(Math.max(pulse, 0.6));
  setLandPop(1);
  setAstFade(1);
  setAppear(0);
  if (!tutorial && runRecord > 0 && level > runRecord && !newRec) {
    setNewRec(true);
    setFlash(0.4);
    buzz([30, 40, 30]);
    texts.push({
      txt: '¡Nuevo récord!',
      x: 0,
      y: -R0 - 70,
      life: 1.8,
      size: 22,
      col: '#8fd0ff',
      center: true,
    });
    setTimeout(() => cowbell(SCALE[7] + 12), 90);
  }
  updateRingHUD();
  if (perfect) {
    cowbell(SCALE[Math.min(3 + streak, SCALE.length - 1)] + (streak >= 5 ? 12 : 0));
    texts.push({ txt: 'Perfecto +' + gain, x: 0, y: -R0 - 26, life: 1, size: 16, col: z.s2 });
    setTimeScale(0.4);
    setSlowTimer(0.1);
    buzz(15);
  } else {
    cowbell(SCALE[level % 3]);
  }
  if (level % 25 === 0) {
    texts.push({
      txt: 'Zona ' + (level / 25 + 1),
      x: 0,
      y: -R0 - 64,
      life: 1.6,
      size: 28,
      col: BONE,
      center: true,
    });
    setFlash(0.35);
    buzz(20);
  }
  ensureRings();
  const nt = ringType(level + 1);
  if (nt !== ringType(level) && TYPE_INFO[nt] && (seenTypes[nt] || 0) < 3) {
    seenTypes[nt] = (seenTypes[nt] || 0) + 1;
    try {
      localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes));
    } catch (e) {}
    // Sin texto: el anillo de tipo distinto destella para avisar que algo cambia (se aprende
    // jugando, como en Geometry Dash).
    {
      const nr = rings.get(level + 1);
      if (nr) {
        nr.flash = 1;
      }
    }
    buzz(12);
  }
  if (tutorial && level === 8) {
    setCharge(3);
    pipFlash[0] = pipFlash[1] = pipFlash[2] = 1;
    setChargeFlash(1);
    powerReadySound();
    texts.push({ txt: 'Salto doble cargado', x: 0, y: -R0 - 48, life: 1.6, size: 14, col: BONE });
  }
  hazardsOnLand();
  {
    const nr2 = rings.get(level + 1);
    if (nr2 && nr2.type === 'orbita') {
      nr2.phase = 0;
    }
  } // el hueco del siguiente empieza a girar desde que llegas
  const sr0 = rings.get(level);
  const near = it => {
    const sa = it.a + sr0.phase - (sr0.poff || 0),
      dd = Math.atan2(Math.sin(sa - pAng), Math.cos(sa - pAng));
    return Math.abs(dd) * rr(level) < 22;
  };
  const px0 = Math.cos(pAng) * rr(level),
    py0 = Math.sin(pAng) * rr(level);
  // estrella (moneda)
  if (sr0 && sr0.coin && !sr0.coin.got && near(sr0.coin)) {
    sr0.coin.got = true;
    setWallet(wallet + 1);
    setRunCoins(runCoins + 1);
    if (!tutorial) {
      misEvent('star');
    }
    try {
      localStorage.setItem('orbita_estrellas', String(wallet));
    } catch (e) {}
    if (!tutorial) {
      const set = lvStarsGot(lvl);
      if (!set.includes(level)) {
        set.push(level);
        try {
          const all = JSON.parse(localStorage.getItem('orbita_lvstars') || '{}');
          all[lvl] = set;
          localStorage.setItem('orbita_lvstars', JSON.stringify(all));
        } catch (e) {}
      }
    }
    updateWallet(true);
    coinChime();
    buzz(15);
    texts.push({ txt: '+1 ★', x: 0, y: -R0 - 48, life: 1.2, size: 16, col: '#ffd36b' });
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2,
        v = 40 + Math.random() * 100;
      particles.push({
        x: px0,
        y: py0,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.6 + Math.random() * 0.4,
        col: i % 2 ? '#fff6e0' : '#ffd36b',
        s: 1.5 + Math.random() * 2,
      });
    }
    if (!seenTypes.moneda) {
      seenTypes.moneda = 1;
      try {
        localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes));
      } catch (e) {}
      texts.push({
        txt: 'Estrellas: se guardan para personalizar tus planetas',
        x: 0,
        y: -R0 - 76,
        life: 2.4,
        size: 12,
        col: BONE,
        center: true,
      });
    }
  }
  // nebulosa o púlsar
  if (sr0 && sr0.obj && !sr0.obj.got && near(sr0.obj)) {
    sr0.obj.got = true;
    setPulse(1);
    const pul = sr0.obj.kind === 'pulsar';
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2,
        v = 40 + Math.random() * 120;
      particles.push({
        x: px0,
        y: py0,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.6 + Math.random() * 0.5,
        col: i % 2 ? '#fff6e0' : pul ? '#9cc8ff' : '#ff9cc6',
        s: 1.5 + Math.random() * 2,
      });
    }
    if (pul) {
      texts.push({
        txt: 'Radiación de púlsar: −1 anillo',
        x: 0,
        y: -R0 - 48,
        life: 1.4,
        size: 14,
        col: '#9cc8ff',
      });
      objChime(false);
      buzz([40, 20, 40]);
      setShake(reduceMotion ? 0 : 7);
      noise(0.45, 3000, 400, 0.3, 'lowpass');
      starPush();
      updateRingHUD();
      return;
    } else {
      texts.push({
        txt: 'Energía de nebulosa: +2 anillos',
        x: 0,
        y: -R0 - 48,
        life: 1.4,
        size: 14,
        col: '#ffb3d1',
      });
      objChime(true);
      buzz([10, 30, 10]);
      setScore(score + 2);
      updateRingHUD();
      if (level < curGoal()) {
        starLaunch();
        return;
      }
    }
  }
  // presentar cada cosa nueva la primera vez que aparece
  const nx = rings.get(level + 1);
  if (nx && nx.coin && !seenTypes.monedaVista) {
    seenTypes.monedaVista = 1;
    try {
      localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes));
    } catch (e) {}
    {
      const nr = rings.get(level + 1);
      if (nr) {
        nr.flash = 1;
      }
    }
    buzz(12);
  }
  if (nx && nx.obj && !nx.obj.got) {
    const kk = nx.obj.kind === 'pulsar' ? 'pulsar' : 'nebulosa';
    if (!seenTypes[kk]) {
      seenTypes[kk] = 1;
      try {
        localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes));
      } catch (e) {}
      {
        const nr = rings.get(level + 1);
        if (nr) {
          nr.flash = 1;
        }
      }
      buzz(12);
    }
  }
  if (wh && wh.ph === 'orb' && level >= WH_EXIT) {
    whStartOut();
    return;
  }
  if (level >= curGoal()) {
    win();
  }
}
/** Marca como quemados los anillos que ya alcanzó el agujero negro (en el nivel 2, sacude). */
function eatRings() {
  while (lastEaten + 1 <= sunLevel) {
    setLastEaten(lastEaten + 1);
    if (lastEaten >= 1) {
      burns.push({ k: lastEaten, life: 1 });
    }
    if (lvl === 2 && state === 'play' && !reduceMotion) {
      setShake(Math.max(shake, 3.5));
    }
  }
}
/**
 * El planeta muere: lo traga el agujero (cause 'sun') o explota. Guarda récords y reinicia la
 * partida sola al poco tiempo, sin pantalla intermedia.
 *
 * @param {number} x Posición horizontal del planeta, en unidades del juego desde el centro.
 * @param {number} y Posición vertical del planeta, en unidades del juego desde el centro.
 * @param {string} cause Causa: 'sun', 'nova', 'onda', 'comet', 'beam', 'sstar', choque…
 * @param {object} [who] Objeto culpable, que se resalta un momento.
 */
function die(x, y, cause, who) {
  if (tutorial) {
    tutRespawn(x, y);
    return;
  }
  setState('dead');
  setDeadT(0);
  setCanRestart(false);
  setCulprit(who || null);
  setCulpritT(who ? 1.4 : 0);
  if (cause === 'sun') {
    const r0 = Math.hypot(x, y);
    setSwallow({ p: 0, a: Math.atan2(y, x), r: r0, r0, done: false });
    setShake(0);
    setFlash(0.15);
    setTimeScale(1);
    setSlowTimer(0);
    stopMusic(true);
    suck();
    buzz([20, 60, 20, 60, 20, 60, 40]);
  } else {
    setSwallow(null);
    setShake(reduceMotion ? 0 : 16);
    setFlash(1);
    setTimeScale(0.03);
    setSlowTimer(0.28);
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2,
        v = 50 + Math.random() * 260;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 1 + Math.random() * 1.2,
        col: ['#2b63c9', '#4fa35a', '#ffffff', '#8fd0ff'][i % 4],
        s: 2 + Math.random() * 3.5,
      });
    }
    stopMusic();
    noise(1, 3500, 60, 0.9, 'lowpass');
    sub();
    buzz([40, 30, 90]);
  }
  const prevRing = bestOf(lvl),
    reached = level,
    before = unlockedIds();
  if (score > best) {
    setBest(score);
    saveBest();
  }
  if (reached > bestOf(lvl)) {
    setBestOf(lvl, reached);
  }
  saveRunStats();
  const rescued = rescuedCards(before);
  const rec = reached > prevRing;
  if (rescued) {
    markNewPlanets();
  }
  // como en Geometry Dash: sin pantalla, vuelves a intentarlo al instante
  setTimeout(
    () => {
      if (state !== 'dead') {
        return;
      }
      start();
      sesTries++;
      showTry(rec ? reached : 0);
    },
    cause === 'sun' ? 2400 : 850,
  );
}
let sesTries = 1; // intentos de esta sesión en el nivel; vuelve a 1 al entrar al nivel
/**
 * Muestra "Intento N" grande y tenue, que se desvanece; si fue récord, lo celebra en dorado.
 *
 * @param {number} recRing Anillo del récord recién logrado, o 0 si no hubo récord.
 */
function showTry(recRing) {
  let el = document.getElementById('tryn');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tryn';
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.innerHTML = 'Intento ' + sesTries + (recRing ? '<b>Récord · anillo ' + recRing + '</b>' : '');
  el.classList.remove('go');
  void el.offsetWidth;
  el.classList.add('go');
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initRun() {
  setup();
}

/**
 * Cambia `sesTries` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setSesTries(value) {
  sesTries = value;
  return value;
}

export {
  die,
  doubleJump,
  eatRings,
  ensureRings,
  jump,
  onLand,
  sesTries,
  setup,
  showTry,
  start,
  upgradeToDouble,
  winSound,
};

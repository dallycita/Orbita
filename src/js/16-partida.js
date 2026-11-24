/**
 * Ciclo de una partida: crea los anillos y sus obstáculos, prepara y arranca la partida, salta,
 * aterriza, gana y muere. También muestra el contador de intentos.
 * Los anillos se generan con la semilla fija SEED (rng), así cada nivel sale siempre igual.
 */
import { BONE, PR, R0, buzz, elHud, elPanel, reduceMotion } from './01-pantalla-y-utilidades.js';
import { SCALE, cowbell, noise, sub, suck, thump } from './02-audio.js';
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
  rescuedPlanets,
  saveRunStats,
  setPlutoOk,
  setShieldLeft,
  setUsedDouble,
  unlockedIds,
  usedDouble,
} from './07-planetas.js';
import {
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
  texts,
  tutorial,
} from './08-partida-estado.js';
import { SEED, ringType, seenTypes, setRngState } from './09-recorridos.js';
import {
  coinChime,
  objChime,
  obsAng,
  obsRad,
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
import { setWh, setWhShock, wh, whStartOut } from './13-agujero-de-gusano.js';
import { WH_EXIT, setBend, setWhRip } from './14-lente-gravitacional.js';
import { hazardsOnLand, hazardsReset, setWaveBeepT, setWaveProx } from './15-peligros.js';

import { COIN_RINGS, LEVELS } from './data/levels.js';
import { TYPE_INFO } from './data/courses.js';
import { powerReadySound, winSound } from './audio/sfx.js';
import { lvStarsGot } from './game/progress.js';
import { setPendingTut } from './core/screen.js';
import { misEvent, misWin, noteDouble } from './game/missions.js';
import { resetJourney } from './core/journey.js';
import { zoneOf } from './game/zones.js';
import { rr } from './core/geometry.js';
import { ensureRings, setGapC } from './game/rings.js';
import { emit } from './core/events.js';

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
    emit('tutorialWin');
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
  const rescued = rescuedPlanets(before).length > 0;
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
    emit('tutorialRespawn', x, y);
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
  const rescued = rescuedPlanets(before).length > 0;
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
  jump,
  onLand,
  sesTries,
  setup,
  showTry,
  start,
  upgradeToDouble,
};

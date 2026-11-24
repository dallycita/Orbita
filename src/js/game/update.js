/**
 * Lógica de la partida en cada cuadro: tiempo y cámara lenta, giro de los anillos, salto y
 * aterrizaje, avance del agujero negro, choques con asteroides y peligros, y agujero de gusano.
 */
import { BONE, CX, CY, PR, R0, S, SUN, buzz, reduceMotion } from '../core/display.js';
import { AC, noise, thump } from '../audio/engine.js';
import {
  TB,
  alarmTick,
  andFast,
  dangerFlash,
  dangerNow,
  kickQueue,
  musicOn,
  musicStart,
  setDangerFlash,
  setSwitchAt,
  setTensT,
  switchAt,
  switchMsg,
  tensT,
  tensionSet,
} from '../audio/music-tracks.js';
import {
  camera,
  run,
  setAppear,
  setAstFade,
  setCamLevel,
  setCrossed,
  setJumpT,
  setJumpTarget,
  setJumping,
  setLevel,
  setPAng,
  setPLevel,
  state,
} from '../core/state.js';
import { catchMargin, chargeMax, jumpDur, sizeK } from './planets.js';
import {
  effects,
  hole,
  input,
  outcome,
  pipFlash,
  setBurns,
  setChargeFlash,
  setCulpritT,
  setDeadT,
  setFlash,
  setHintT,
  setHoleFlare,
  setLandPop,
  setParticles,
  setPending,
  setPendingT,
  setPulse,
  setReadyT,
  setShake,
  setSlowTimer,
  setSunLevel,
  setT,
  setTexts,
  setTimeScale,
  setWinT,
  time,
  tutorialState,
} from '../core/run-state.js';
import {
  HOLE_MUL,
  beatTime,
  lastBeatIdx,
  obsAng,
  obsRad,
  pushFrom,
  pushT,
  pushing,
  setLastBeatIdx,
  setPushT,
  setPushing,
  stretchAt,
} from './beat.js';
import { novaSrc, setNovaSrc } from './hazard-state.js';
import {
  burnT,
  caronteSaves,
  ghostT,
  powerUpdate,
  ringSpark,
  setLastJT,
  shieldT,
  vaporize,
} from './powers.js';
import { ORB_W, setWhShock, wh, whEnter, whGap, whShock, whTrans } from './wormhole.js';
import {
  BEND_R,
  WH_EXIT,
  WH_K,
  bend,
  bendUpdate,
  bendW,
  lensP,
  setWhRip,
  whRip,
} from './gravitational-lens.js';
import { NOVA_LIFE, hazardsUpdate, novaBurst, novaHit, novaSound } from './hazards.js';
import { die, eatRings, jump, onLand } from './run.js';

import { introFade, setIntroFade } from '../core/screen.js';
import { advanceJourney, setJourneyBand } from '../core/journey.js';
import { GOAL } from '../data/levels.js';
import { zoneOf } from './zones.js';
import { rr } from '../core/geometry.js';

/**
 * Avanza el juego un cuadro.
 *
 * @param {number} dt Tiempo real desde el cuadro anterior, en segundos (antes de la cámara lenta).
 */
function update(dt) {
  // tiempo real: cámara lenta, sacudida, destello
  if (time.slowTimer > 0) {
    setSlowTimer(time.slowTimer - dt);
  } else {
    setTimeScale(time.timeScale + (1 - time.timeScale) * Math.min(1, dt * 5));
  }
  setCulpritT(Math.max(0, outcome.culpritT - dt));
  setHintT(Math.max(0, tutorialState.hintT - dt));
  if (input.pending) {
    setPendingT(input.pendingT + dt);
    if (input.pendingT > 0.09) {
      setPending(false);
    }
  }
  const bi = AC && musicOn && musicStart >= 0 ? Math.floor(beatTime() / TB) : -1;
  if (bi !== lastBeatIdx) {
    setLastBeatIdx(bi);
    if (bi >= 0 && bi % 2 === 0 && state === 'play' && !reduceMotion) {
      const pr0 = rr(run.pLevel),
        x0 = Math.cos(run.pAng) * pr0,
        y0 = Math.sin(run.pAng) * pr0,
        gold = run.charge >= chargeMax();
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2,
          v = 30 + Math.random() * 40;
        effects.particles.push({
          x: x0,
          y: y0,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: 0.35 + Math.random() * 0.2,
          col: gold ? '#ffd36b' : '#cfe6ff',
          s: 1 + Math.random() * 1.2,
        });
      }
    }
  }
  for (let i = 0; i < 10; i++) {
    pipFlash[i] = Math.max(0, pipFlash[i] - dt * 3);
  }
  setChargeFlash(Math.max(0, effects.chargeFlash - dt * 1.6));
  setReadyT(run.charge >= chargeMax() && state === 'play' ? effects.readyT + dt : 0);
  setAstFade(Math.max(0, run.astFade - dt * 5));
  setAppear(Math.min(1, run.appear + dt * 5));
  setLandPop(Math.max(0, effects.landPop - dt * 6));
  setShake(Math.max(0, effects.shake - dt * 40));
  setFlash(Math.max(0, effects.flash - dt * 2.6));
  setPulse(Math.max(0, effects.pulse - dt * 3.5));
  if (AC) {
    while (kickQueue.length && AC.currentTime >= kickQueue[0]) {
      kickQueue.shift();
      setPulse(1);
      if (dangerNow() > 0.55) {
        buzz(14);
      }
    }
  }
  if (switchAt && AC && AC.currentTime >= switchAt) {
    setSwitchAt(0);
    setFlash(0.35);
    setPulse(1);
    buzz([20, 30, 40]);
    effects.texts.push({
      txt: switchMsg,
      x: 0,
      y: -R0 - 96,
      life: 1.6,
      size: 20,
      col: zoneOf(run.level).s2,
      center: true,
    });
  }
  setTensT(tensT + dt);
  if (tensT > 0.08) {
    setTensT(0);
    tensionSet(dangerNow());
  }
  alarmTick(dt);
  setDangerFlash(Math.max(0, dangerFlash - dt * 2.2));
  const d = dt * time.timeScale;
  setT(time.t + d);
  powerUpdate(dt, d);
  const curR = run.rings.get(run.level),
    frozen =
      state === 'play' && !run.jumping && curR && curR.type === 'arrastre'
        ? run.rings.get(run.level + 1)
        : null;
  for (const r of run.rings.values()) {
    if (r.tid !== undefined) {
      r.tid += (r.tv || 0.5) * d;
    }
    if (r === frozen && !r.sync) {
      continue;
    }
    const ph0 = r.phase,
      fz = r.frozenT > 0;
    if (fz) {
      r.frozenT -= dt;
    } // Urano: el anillo congelado no gira (y al soltarse sigue desde ahí, sin saltos)
    if (r.holdT > 0) {
      r.holdT -= dt;
      continue;
    } // Neptuno: el viento sostiene el hueco encima de ti un momento
    if (r.type === 'marea') {
      r.phase += r.w * (1 + 0.8 * Math.sin(time.t * 1.4 + r.ws)) * d;
      if (fz) {
        r.poff = (r.poff || 0) + r.phase - ph0;
      }
      continue;
    }
    if (r.type === 'freno') {
      r.ft += d;
      r.flash = Math.max(0, r.flash - d * 4);
      if (r.ft >= r.fp) {
        r.ft = 0;
        r.sgn *= -1;
        if (run.rings.get(run.level + 1) === r && state === 'play') {
          r.flash = 1;
          noise(0.06, 3000, 900, 0.12, 'bandpass');
        }
      }
      r.phase += r.w * r.sgn * d;
    } else if (r.sync) {
      r.phase = r.w * beatTime();
    } else {
      r.phase += r.w * d;
    }
    if (fz) {
      r.poff = (r.poff || 0) + r.phase - ph0;
    }
  }

  if (run.lvl === 2 && !tutorialState.tutorial) {
    novaSound();
  }
  bendUpdate(dt * time.timeScale);
  if (whShock) {
    whShock.t += dt;
    if (whShock.t > 1.1) {
      setWhShock(null);
    }
  }
  if (whRip) {
    whRip.t += dt;
    if (whRip.t > 1.1) {
      setWhRip(null);
    }
  }
  if (wh && wh.flipT) {
    wh.flipT = Math.max(0, wh.flipT - dt * 4);
  }
  if (state === 'play' && wh && wh.ph !== 'orb') {
    whTrans(dt);
  } else if (state === 'play') {
    advanceJourney(
      d,
      0.35 + (run.jumping ? 1.1 : 0) + (andFast ? 0.35 : 0),
      Math.min(1, run.level / GOAL),
    );
    const bt = andFast ? 3 : run.level >= 28 ? 2 : run.level >= 15 ? 1 : 0;
    setJourneyBand(bt, d);
    if (wh && wh.ph === 'orb') {
      // dentro del gusano: giras tú sobre el anillo, y la corriente te lanza en el golpe
      setPAng(
        Math.atan2(
          Math.sin(run.pAng + wh.dir * ORB_W * d),
          Math.cos(run.pAng + wh.dir * ORB_W * d),
        ),
      );
      const bi = Math.floor(beatTime() / TB);
      if (!run.jumping && run.level < WH_EXIT && bi >= wh.nextB) {
        jump();
        wh.gapB = whGap();
        wh.nextB = bi + wh.gapB;
        setPulse(1);
      }
    } else if (!run.jumping && !pushing) {
      const cr = run.rings.get(run.level);
      if (cr && cr.type === 'arrastre') {
        setPAng(run.pAng + cr.w * d);
      } else {
        const df = Math.atan2(Math.sin(-Math.PI / 2 - run.pAng), Math.cos(-Math.PI / 2 - run.pAng));
        if (Math.abs(df) > 0.0005) {
          setPAng(run.pAng + df * Math.min(1, d * 5));
        }
      }
      setPAng(Math.atan2(Math.sin(run.pAng), Math.cos(run.pAng)));
    }
    if (pushing) {
      setPushT(pushT + d);
      const pp = Math.min(pushT / 0.32, 1);
      setPLevel(pushFrom + (run.level - pushFrom) * (1 - Math.pow(1 - pp, 3)));
      if (pp >= 1) {
        setPushing(false);
        setPLevel(run.level);
      }
    }
    if (run.jumping) {
      const dur = run.jumpTarget >= 2 ? 0.24 + (run.jumpTarget - 2) * 0.1 : jumpDur();
      setJumpT(run.jumpT + d);
      const p = Math.min(run.jumpT / dur, 1);
      setPLevel(run.level + run.jumpTarget * (1 - Math.pow(1 - p, 3)));
      if (
        run.jumpTarget >= 2 &&
        ((!run.crossed && run.pLevel >= run.level + 1) ||
          (run.jumpTarget === 3 &&
            run.crossed === true &&
            run.pLevel >= run.level + 2 &&
            setCrossed(2)))
      ) {
        // la Tierra atraviesa el anillo y lo rompe
        setCrossed(true);
        setShake(reduceMotion ? 0 : 6);
        setPulse(1);
        const R = rr(run.level + 1),
          cx0 = Math.cos(run.pAng) * R,
          cy0 = Math.sin(run.pAng) * R;
        for (let i = 0; i < 34; i++) {
          const a = Math.random() * Math.PI * 2,
            v = 60 + Math.random() * 200;
          effects.particles.push({
            x: cx0,
            y: cy0,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            life: 0.6 + Math.random() * 0.6,
            col: i % 2 ? BONE : zoneOf(run.level).s2,
            s: 2 + Math.random() * 3,
          });
        }
        noise(0.35, 5000, 200, 0.4, 'lowpass');
      }
      if (p >= 1) {
        setJumping(false);
        setLevel(run.level + run.jumpTarget);
        setPLevel(run.level);
        setLastJT(run.jumpTarget);
        onLand(run.jumpTarget >= 2);
        setJumpTarget(1);
      }
    }
    setCamLevel(camera.camLevel + (run.level - camera.camLevel) * Math.min(1, d * 6));
    // El agujero negro crece y se come los anillos; si el planeta se queda quieto, lo alcanza.
    // Si el planeta se aleja más de 2,4 anillos, acelera para no quedarse atrás.
    const gap = run.pLevel - hole.sunLevel;
    // en el tutorial avanza muy lento
    let sp =
      (tutorialState.tutorial ? 0.1 : 0.2 + Math.min(run.level * 0.006, 0.26)) *
      (HOLE_MUL[run.lvl] || 1);
    if (gap > 2.4) {
      sp += (gap - 2.4) * 1.15;
    }
    if (!(wh && wh.ph === 'orb')) {
      setSunLevel(hole.sunLevel + sp * d);
    } // dentro del gusano el agujero negro no te puede seguir
    eatRings();
    if (hole.sunLevel >= run.pLevel - catchMargin()) {
      const pr0 = rr(run.pLevel);
      die(Math.cos(run.pAng) * pr0, Math.sin(run.pAng) * pr0, 'sun');
      return;
    }
    effects.trail.push({ a: run.pAng, l: run.pLevel });
    if (effects.trail.length > 22) {
      effects.trail.shift();
    }

    const pr = rr(run.pLevel),
      [px, py] = lensP(Math.cos(run.pAng) * pr, Math.sin(run.pAng) * pr);
    if (!wh && bend.on && run.jumping && run.level === WH_K - 1) {
      // saltas dentro de la boca
      const [bx, by] = bendW();
      if (Math.hypot(Math.cos(run.pAng) * pr - bx, Math.sin(run.pAng) * pr - by) < BEND_R * 0.8) {
        whEnter();
        return;
      }
    }
    const check = run.jumping && run.jumpTarget === 1 && !input.pending ? [run.level + 1] : [];
    for (const k of check) {
      const ring = run.rings.get(k);
      if (!ring) {
        continue;
      }
      const R = rr(k);
      for (const o of ring.obs) {
        if (o.melt) {
          continue;
        }
        const oa = obsAng(ring, o),
          Rs = R * stretchAt(ring, oa),
          [ox, oy] = lensP(Math.cos(oa) * Rs, Math.sin(oa) * Rs);
        const dist = Math.hypot(px - ox, py - oy);
        if (dist < PR * sizeK() + obsRad(ring, o) * 0.66 && shieldT > 0 && !o.shSp) {
          o.shSp = 1;
          ringSpark(ox, oy);
        }
        if (
          dist < PR * sizeK() + obsRad(ring, o) * 0.66 &&
          burnT > 0 &&
          ghostT <= 0 &&
          shieldT <= 0
        ) {
          vaporize(ring, o, CX + ox * S, CY + oy * S);
          continue;
        }
        if (dist < PR * sizeK() + obsRad(ring, o) * 0.66 && ghostT <= 0 && shieldT <= 0) {
          if (caronteSaves(px, py, ox, oy)) {
            break;
          }
          die(px, py, k === run.level ? 'hit' : 'jump', { k, o });
          return;
        }
      }
    }
    if (novaSrc.length) {
      const bt = beatTime();
      for (const s of novaSrc) {
        const b = Math.floor((bt - s.b0) / s.P);
        if (b >= 0 && b < s.n && b !== s.lastB) {
          s.lastB = b;
          novaBurst(s);
        }
      }
      setNovaSrc(
        novaSrc.filter(s => !(bt > s.b0 + (s.n - 1) * s.P + NOVA_LIFE * (s.big ? 1.6 : 1) + 0.2)),
      );
      if (
        run.jumping &&
        run.jumpTarget === 1 &&
        !input.pending &&
        novaHit(px, py, bt, camera.camLevel) &&
        ghostT <= 0 &&
        shieldT <= 0
      ) {
        if (!caronteSaves(px, py)) {
          die(px, py, 'nova');
          return;
        }
      }
    }
    const hz = hazardsUpdate(d, px, py);
    if (hz && ghostT <= 0 && shieldT <= 0) {
      if (!caronteSaves(px, py)) {
        die(px, py, hz);
        return;
      }
    }
  } else {
    setCamLevel(camera.camLevel + (run.level - camera.camLevel) * Math.min(1, d * 6));
    if (state === 'dead' && hole.sunLevel < run.level + 3 && (!hole.swallow || hole.swallow.done)) {
      setSunLevel(hole.sunLevel + 0.9 * d);
      eatRings();
    }
  }
  if (state === 'dead') {
    setDeadT(outcome.deadT + d);
    advanceJourney(d, 0);
  }
  if (state === 'win') {
    setWinT(outcome.winT + dt);
    advanceJourney(dt, 2 + outcome.winT * 4, 1);
    setJourneyBand(3, dt);
    setPLevel(run.pLevel + dt * (1.2 + outcome.winT * 4));
    setSunLevel(hole.sunLevel - dt * (0.6 + outcome.winT * 0.8));
    effects.trail.push({ a: run.pAng, l: run.pLevel });
    if (effects.trail.length > 30) {
      effects.trail.shift();
    }
  }
  setHoleFlare(Math.max(0, effects.holeFlare - dt * 1.4));
  setIntroFade(Math.max(0, introFade - dt * 1.6));
  if (hole.swallow && !hole.swallow.done) {
    hole.swallow.p = Math.min(1, hole.swallow.p + dt / 1.8);
    const p = hole.swallow.p,
      hw = Math.max(rr(hole.sunLevel), SUN);
    hole.swallow.r = hole.swallow.r0 + (hw * 0.88 - hole.swallow.r0) * Math.pow(p, 2.2);
    hole.swallow.a += (1.1 + 9 * p * p) * dt;
    if (Math.random() < 0.35 + p) {
      const a = hole.swallow.a,
        ex = Math.cos(a) * hole.swallow.r,
        ey = Math.sin(a) * hole.swallow.r,
        v = 60 + Math.random() * 70;
      effects.particles.push({
        x: ex,
        y: ey,
        vx: -Math.sin(a) * v - Math.cos(a) * 30,
        vy: Math.cos(a) * v - Math.sin(a) * 30,
        life: 0.7 + Math.random() * 0.6,
        col: ['#2b63c9', '#4fa35a', '#ffffff', '#8fd0ff'][Math.floor(Math.random() * 4)],
        s: 1.5 + Math.random() * 2,
      });
    }
    if (p >= 1) {
      hole.swallow.done = true;
      setFlash(0.7);
      setPulse(1);
      setHoleFlare(1);
      setShake(reduceMotion ? 0 : 10);
      noise(0.6, 6000, 150, 0.5, 'lowpass');
      thump();
      buzz(70);
    }
  }

  for (const p of effects.particles) {
    const len = Math.hypot(p.x, p.y) || 1;
    p.vx += (-p.x / len) * 140 * d;
    p.vy += (-p.y / len) * 140 * d;
    p.vx *= Math.pow(0.6, d);
    p.vy *= Math.pow(0.6, d);
    p.x += p.vx * d;
    p.y += p.vy * d;
    p.life -= d * 0.8;
    if (len < Math.max(rr(hole.sunLevel), SUN)) {
      p.life -= d * 3;
    }
  }
  setParticles(effects.particles.filter(p => p.life > 0));
  for (const tx of effects.texts) {
    tx.life -= dt;
    if (!tx.center) {
      tx.y -= dt * 22;
    }
  }
  setTexts(effects.texts.filter(tx => tx.life > 0));
  for (const b of effects.burns) {
    b.life -= dt * 1.6;
  }
  const hw = Math.max(rr(hole.sunLevel), SUN);
  for (const db of effects.debris) {
    db.r -= (14 + 1400 / Math.max(db.r, 10)) * dt;
    db.a += (0.4 + 70 / Math.max(db.r, 10)) * dt;
    if (db.r < hw) {
      db.r = hw + 120 + Math.random() * 120;
      db.a = Math.random() * Math.PI * 2;
    }
  }
  setBurns(effects.burns.filter(b => b.life > 0));
}

export { update };

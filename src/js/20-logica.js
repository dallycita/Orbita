/**
 * Lógica de la partida en cada cuadro: tiempo y cámara lenta, giro de los anillos, salto y
 * aterrizaje, avance del agujero negro, choques con asteroides y peligros, y agujero de gusano.
 */
import { BONE, CX, CY, PR, R0, S, SUN, buzz, reduceMotion } from './01-pantalla-y-utilidades.js';
import { AC, noise, thump } from './02-audio.js';
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
} from './03-musica-ritmos.js';
import {
  appear,
  astFade,
  camLevel,
  charge,
  crossed,
  jumpT,
  jumpTarget,
  jumping,
  level,
  lvl,
  pAng,
  pLevel,
  rings,
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
} from './06-record-y-estado.js';
import { catchMargin, chargeMax, jumpDur, sizeK } from './07-planetas.js';
import {
  burns,
  chargeFlash,
  culpritT,
  deadT,
  debris,
  flash,
  hintT,
  holeFlare,
  landPop,
  particles,
  pending,
  pendingT,
  pipFlash,
  pulse,
  readyT,
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
  shake,
  slowTimer,
  sunLevel,
  swallow,
  t,
  texts,
  timeScale,
  trail,
  tutorial,
  winT,
} from './08-partida-estado.js';
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
} from './10-ritmo-y-objetos.js';
import { novaSrc, setNovaSrc } from './11-peligros-datos.js';
import {
  burnT,
  caronteSaves,
  ghostT,
  powerUpdate,
  ringSpark,
  setLastJT,
  shieldT,
  vaporize,
} from './12-poderes.js';
import { ORB_W, setWhShock, wh, whEnter, whGap, whShock, whTrans } from './13-agujero-de-gusano.js';
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
} from './14-lente-gravitacional.js';
import { NOVA_LIFE, hazardsUpdate, novaBurst, novaHit, novaSound } from './15-peligros.js';
import { die, eatRings, jump, onLand, rr } from './16-partida.js';

import { introFade, setIntroFade } from './core/screen.js';
import { advanceJourney, setJourneyBand } from './core/journey.js';
import { GOAL } from './data/levels.js';
import { zoneOf } from './game/zones.js';

/**
 * Avanza el juego un cuadro.
 *
 * @param {number} dt Tiempo real desde el cuadro anterior, en segundos (antes de la cámara lenta).
 */
function update(dt) {
  // tiempo real: cámara lenta, sacudida, destello
  if (slowTimer > 0) {
    setSlowTimer(slowTimer - dt);
  } else {
    setTimeScale(timeScale + (1 - timeScale) * Math.min(1, dt * 5));
  }
  setCulpritT(Math.max(0, culpritT - dt));
  setHintT(Math.max(0, hintT - dt));
  if (pending) {
    setPendingT(pendingT + dt);
    if (pendingT > 0.09) {
      setPending(false);
    }
  }
  const bi = AC && musicOn && musicStart >= 0 ? Math.floor(beatTime() / TB) : -1;
  if (bi !== lastBeatIdx) {
    setLastBeatIdx(bi);
    if (bi >= 0 && bi % 2 === 0 && state === 'play' && !reduceMotion) {
      const pr0 = rr(pLevel),
        x0 = Math.cos(pAng) * pr0,
        y0 = Math.sin(pAng) * pr0,
        gold = charge >= chargeMax();
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2,
          v = 30 + Math.random() * 40;
        particles.push({
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
  setChargeFlash(Math.max(0, chargeFlash - dt * 1.6));
  setReadyT(charge >= chargeMax() && state === 'play' ? readyT + dt : 0);
  setAstFade(Math.max(0, astFade - dt * 5));
  setAppear(Math.min(1, appear + dt * 5));
  setLandPop(Math.max(0, landPop - dt * 6));
  setShake(Math.max(0, shake - dt * 40));
  setFlash(Math.max(0, flash - dt * 2.6));
  setPulse(Math.max(0, pulse - dt * 3.5));
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
    texts.push({
      txt: switchMsg,
      x: 0,
      y: -R0 - 96,
      life: 1.6,
      size: 20,
      col: zoneOf(level).s2,
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
  const d = dt * timeScale;
  setT(t + d);
  powerUpdate(dt, d);
  const curR = rings.get(level),
    frozen =
      state === 'play' && !jumping && curR && curR.type === 'arrastre'
        ? rings.get(level + 1)
        : null;
  for (const r of rings.values()) {
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
      r.phase += r.w * (1 + 0.8 * Math.sin(t * 1.4 + r.ws)) * d;
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
        if (rings.get(level + 1) === r && state === 'play') {
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

  if (lvl === 2 && !tutorial) {
    novaSound();
  }
  bendUpdate(dt * timeScale);
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
    advanceJourney(d, 0.35 + (jumping ? 1.1 : 0) + (andFast ? 0.35 : 0), Math.min(1, level / GOAL));
    const bt = andFast ? 3 : level >= 28 ? 2 : level >= 15 ? 1 : 0;
    setJourneyBand(bt, d);
    if (wh && wh.ph === 'orb') {
      // dentro del gusano: giras tú sobre el anillo, y la corriente te lanza en el golpe
      setPAng(Math.atan2(Math.sin(pAng + wh.dir * ORB_W * d), Math.cos(pAng + wh.dir * ORB_W * d)));
      const bi = Math.floor(beatTime() / TB);
      if (!jumping && level < WH_EXIT && bi >= wh.nextB) {
        jump();
        wh.gapB = whGap();
        wh.nextB = bi + wh.gapB;
        setPulse(1);
      }
    } else if (!jumping && !pushing) {
      const cr = rings.get(level);
      if (cr && cr.type === 'arrastre') {
        setPAng(pAng + cr.w * d);
      } else {
        const df = Math.atan2(Math.sin(-Math.PI / 2 - pAng), Math.cos(-Math.PI / 2 - pAng));
        if (Math.abs(df) > 0.0005) {
          setPAng(pAng + df * Math.min(1, d * 5));
        }
      }
      setPAng(Math.atan2(Math.sin(pAng), Math.cos(pAng)));
    }
    if (pushing) {
      setPushT(pushT + d);
      const pp = Math.min(pushT / 0.32, 1);
      setPLevel(pushFrom + (level - pushFrom) * (1 - Math.pow(1 - pp, 3)));
      if (pp >= 1) {
        setPushing(false);
        setPLevel(level);
      }
    }
    if (jumping) {
      const dur = jumpTarget >= 2 ? 0.24 + (jumpTarget - 2) * 0.1 : jumpDur();
      setJumpT(jumpT + d);
      const p = Math.min(jumpT / dur, 1);
      setPLevel(level + jumpTarget * (1 - Math.pow(1 - p, 3)));
      if (
        jumpTarget >= 2 &&
        ((!crossed && pLevel >= level + 1) ||
          (jumpTarget === 3 && crossed === true && pLevel >= level + 2 && setCrossed(2)))
      ) {
        // la Tierra atraviesa el anillo y lo rompe
        setCrossed(true);
        setShake(reduceMotion ? 0 : 6);
        setPulse(1);
        const R = rr(level + 1),
          cx0 = Math.cos(pAng) * R,
          cy0 = Math.sin(pAng) * R;
        for (let i = 0; i < 34; i++) {
          const a = Math.random() * Math.PI * 2,
            v = 60 + Math.random() * 200;
          particles.push({
            x: cx0,
            y: cy0,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            life: 0.6 + Math.random() * 0.6,
            col: i % 2 ? BONE : zoneOf(level).s2,
            s: 2 + Math.random() * 3,
          });
        }
        noise(0.35, 5000, 200, 0.4, 'lowpass');
      }
      if (p >= 1) {
        setJumping(false);
        setLevel(level + jumpTarget);
        setPLevel(level);
        setLastJT(jumpTarget);
        onLand(jumpTarget >= 2);
        setJumpTarget(1);
      }
    }
    setCamLevel(camLevel + (level - camLevel) * Math.min(1, d * 6));
    // El agujero negro crece y se come los anillos; si el planeta se queda quieto, lo alcanza.
    // Si el planeta se aleja más de 2,4 anillos, acelera para no quedarse atrás.
    const gap = pLevel - sunLevel;
    // en el tutorial avanza muy lento
    let sp = (tutorial ? 0.1 : 0.2 + Math.min(level * 0.006, 0.26)) * (HOLE_MUL[lvl] || 1);
    if (gap > 2.4) {
      sp += (gap - 2.4) * 1.15;
    }
    if (!(wh && wh.ph === 'orb')) {
      setSunLevel(sunLevel + sp * d);
    } // dentro del gusano el agujero negro no te puede seguir
    eatRings();
    if (sunLevel >= pLevel - catchMargin()) {
      const pr0 = rr(pLevel);
      die(Math.cos(pAng) * pr0, Math.sin(pAng) * pr0, 'sun');
      return;
    }
    trail.push({ a: pAng, l: pLevel });
    if (trail.length > 22) {
      trail.shift();
    }

    const pr = rr(pLevel),
      [px, py] = lensP(Math.cos(pAng) * pr, Math.sin(pAng) * pr);
    if (!wh && bend.on && jumping && level === WH_K - 1) {
      // saltas dentro de la boca
      const [bx, by] = bendW();
      if (Math.hypot(Math.cos(pAng) * pr - bx, Math.sin(pAng) * pr - by) < BEND_R * 0.8) {
        whEnter();
        return;
      }
    }
    const check = jumping && jumpTarget === 1 && !pending ? [level + 1] : [];
    for (const k of check) {
      const ring = rings.get(k);
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
          die(px, py, k === level ? 'hit' : 'jump', { k, o });
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
        jumping &&
        jumpTarget === 1 &&
        !pending &&
        novaHit(px, py, bt, camLevel) &&
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
    setCamLevel(camLevel + (level - camLevel) * Math.min(1, d * 6));
    if (state === 'dead' && sunLevel < level + 3 && (!swallow || swallow.done)) {
      setSunLevel(sunLevel + 0.9 * d);
      eatRings();
    }
  }
  if (state === 'dead') {
    setDeadT(deadT + d);
    advanceJourney(d, 0);
  }
  if (state === 'win') {
    setWinT(winT + dt);
    advanceJourney(dt, 2 + winT * 4, 1);
    setJourneyBand(3, dt);
    setPLevel(pLevel + dt * (1.2 + winT * 4));
    setSunLevel(sunLevel - dt * (0.6 + winT * 0.8));
    trail.push({ a: pAng, l: pLevel });
    if (trail.length > 30) {
      trail.shift();
    }
  }
  setHoleFlare(Math.max(0, holeFlare - dt * 1.4));
  setIntroFade(Math.max(0, introFade - dt * 1.6));
  if (swallow && !swallow.done) {
    swallow.p = Math.min(1, swallow.p + dt / 1.8);
    const p = swallow.p,
      hw = Math.max(rr(sunLevel), SUN);
    swallow.r = swallow.r0 + (hw * 0.88 - swallow.r0) * Math.pow(p, 2.2);
    swallow.a += (1.1 + 9 * p * p) * dt;
    if (Math.random() < 0.35 + p) {
      const a = swallow.a,
        ex = Math.cos(a) * swallow.r,
        ey = Math.sin(a) * swallow.r,
        v = 60 + Math.random() * 70;
      particles.push({
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
      swallow.done = true;
      setFlash(0.7);
      setPulse(1);
      setHoleFlare(1);
      setShake(reduceMotion ? 0 : 10);
      noise(0.6, 6000, 150, 0.5, 'lowpass');
      thump();
      buzz(70);
    }
  }

  for (const p of particles) {
    const len = Math.hypot(p.x, p.y) || 1;
    p.vx += (-p.x / len) * 140 * d;
    p.vy += (-p.y / len) * 140 * d;
    p.vx *= Math.pow(0.6, d);
    p.vy *= Math.pow(0.6, d);
    p.x += p.vx * d;
    p.y += p.vy * d;
    p.life -= d * 0.8;
    if (len < Math.max(rr(sunLevel), SUN)) {
      p.life -= d * 3;
    }
  }
  setParticles(particles.filter(p => p.life > 0));
  for (const tx of texts) {
    tx.life -= dt;
    if (!tx.center) {
      tx.y -= dt * 22;
    }
  }
  setTexts(texts.filter(tx => tx.life > 0));
  for (const b of burns) {
    b.life -= dt * 1.6;
  }
  const hw = Math.max(rr(sunLevel), SUN);
  for (const db of debris) {
    db.r -= (14 + 1400 / Math.max(db.r, 10)) * dt;
    db.a += (0.4 + 70 / Math.max(db.r, 10)) * dt;
    if (db.r < hw) {
      db.r = hw + 120 + Math.random() * 120;
      db.a = Math.random() * Math.PI * 2;
    }
  }
  setBurns(burns.filter(b => b.life > 0));
}

export { update };

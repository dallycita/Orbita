/**
 * Dibuja un cuadro de la partida: cielo, agujero negro, anillos, asteroides, jugador, partículas y
 * textos, en ese orden (lo de abajo se pinta primero). En el Sistema solar los planetas pasan en el
 * fondo en su orden real.
 */
import {
  BONE,
  CX,
  CY,
  H,
  PR,
  R0,
  S,
  SUN,
  W,
  clamp,
  ctx,
  frac,
  reduceMotion,
  rgba,
  stars,
} from './01-pantalla-y-utilidades.js';
import { dangerFlash, dangerNow } from './03-musica-ritmos.js';
import {
  appear,
  astFade,
  charge,
  jumping,
  level,
  lvl,
  pAng,
  pLevel,
  rings,
  runRecord,
  state,
} from './06-record-y-estado.js';
import { chargeMax } from './07-planetas.js';
import {
  TUT_TIPS,
  burns,
  culprit,
  culpritT,
  curGoal,
  debris,
  flash,
  holeFlare,
  landPop,
  particles,
  pulse,
  shake,
  sunLevel,
  swallow,
  t,
  texts,
  trail,
  tutorial,
  winT,
} from './08-partida-estado.js';
import {
  bassBreath,
  beatKick,
  drawCoin,
  drawNebula,
  drawPulsar,
  obsAng,
  obsRad,
  stretchAt,
} from './10-ritmo-y-objetos.js';
import { skyFlash } from './11-peligros-datos.js';
import { bhWob, setStrainK, strainK, strainNow } from './12-poderes.js';
import { wh } from './13-agujero-de-gusano.js';
import { bend, bendRad, bendW, drawBendSphere, lensJ, lensP } from './14-lente-gravitacional.js';
import { drawFlare, drawHazards, drawNova } from './15-peligros.js';

import { drawAndromeda, drawGalBG, drawMagallanes } from './31-fondos-2d.js';
import { GLBG, REMOLINO_PHOTO, remolinoSource } from './32-fondos-9-motor.js';
import { drawPlayer } from './render/planets.js';
import { brandHole, drawLogo } from './render/black-hole.js';
import {
  camZoom,
  hideEarth,
  homeT,
  introFade,
  logoT0,
  setCamZoom,
  viewInside,
} from './core/screen.js';
import { GOAL } from './data/levels.js';
import { zoneOf } from './game/zones.js';
import { rr } from './core/geometry.js';
import { drawPowerFx, drawPowerScene, drawRingPower } from './render/powers.js';
import { drawAst, drawCharge, drawPowerAura } from './render/sprites.js';

/**
 * Dibuja la escena completa de la partida en el lienzo principal, con temblor y zoom de cámara.
 * Lo llama 21-dibujo en cada cuadro de juego.
 */
function renderScene() {
  const z = zoneOf(level);
  ctx.save();
  ctx.fillStyle = z.bg;
  ctx.fillRect(0, 0, W, H);
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }
  if (lvl === 2 && !tutorial && !reduceMotion) {
    setCamZoom(camZoom + (1 + 0.05 * dangerNow() - camZoom) * 0.06);
    ctx.translate(CX, CY);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-CX, -CY);
  }

  // estrellas (en Andrómeda, la galaxia entera ocupa el cielo)
  const sr = Math.max(W, H) * 0.62;
  const ww = state === 'win' ? Math.min(1, winT / 1.2) : 0;
  const andro =
    lvl >= 1 &&
    !tutorial &&
    (state === 'play' || state === 'dead' || state === 'win' || state === 'menu');
  const solar =
    lvl === 0 &&
    !tutorial &&
    (state === 'play' || state === 'dead' || state === 'win' || state === 'menu');
  let lw = null;
  if (bend.str > 0.01 && !viewInside) {
    const [wx, wy] = bendW();
    lw = [CX + wx * S, CY + wy * S, bendRad() * S * 0.92, bend.str];
  }
  if (solar) {
    GLBG.draw('mw', { beat: beatKick(), wh: lw });
  }
  if (andro) {
    if (lvl === 1) {
      if (!GLBG.draw('lmc', { beat: beatKick() })) {
        drawMagallanes();
      }
    } else if (lvl === 2) {
      if (!GLBG.draw('and2', { beat: beatKick() }) && !GLBG.draw('and', { beat: beatKick() })) {
        drawAndromeda();
      }
    } else if (lvl >= 3 && GLBG.draw('gx', { beat: beatKick(), kind: lvl, wh: lw })) {
    } else if (lvl === 4) {
      const src = remolinoSource();
      if (
        !src ||
        !GLBG.draw('photo', {
          name: REMOLINO_PHOTO ? 'm51' : 'm51-dibujo',
          src,
          beat: beatKick(),
          fx: 0.5,
          fy: 0.42,
          zoom: REMOLINO_PHOTO ? 1.2 : 1.05,
        })
      ) {
        drawGalBG(lvl);
      }
    } else {
      drawGalBG(lvl);
    }
  }
  if (skyFlash > 0 && lvl === 1) {
    // la Gran Nube se ilumina con la explosión
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gf = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * 0.8);
    if (gf && gf.addColorStop) {
      gf.addColorStop(0, 'rgba(255,190,220,' + (0.42 * skyFlash).toFixed(3) + ')');
      gf.addColorStop(0.5, 'rgba(255,110,170,' + (0.22 * skyFlash).toFixed(3) + ')');
      gf.addColorStop(1, 'rgba(160,120,255,' + (0.08 * skyFlash).toFixed(3) + ')');
      ctx.fillStyle = gf;
    }
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if ((!andro && !solar) || ww > 0) {
    for (const s of stars) {
      const a = s.a + t * 0.015,
        rad = s.r * sr * (1 + ww * frac(winT * 0.35 + s.tw) * 0.8),
        x = CX + Math.cos(a) * rad,
        y = CY + Math.sin(a) * rad;
      if (ww > 0) {
        const r2 = rad * (1 - 0.18 * ww);
        ctx.globalAlpha = 0.4 * ww;
        ctx.strokeStyle = BONE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(a) * r2, CY + Math.sin(a) * r2);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.12 + 0.22 * (0.5 + 0.5 * Math.sin(t * 1.3 + s.tw));
      ctx.fillStyle = BONE;
      ctx.fillRect(x, y, s.s * 0.8, s.s * 0.8);
    }
  }
  ctx.globalAlpha = 1;

  // agujero negro: crece desde el centro y se traga los anillos
  const sunW = Math.max(rr(sunLevel), SUN),
    // bhWob: el empujón de Júpiter lo hace temblar
    sunR = (sunW + pulse * 2) * S * (1 + 0.07 * Math.sin(t * 38) * bhWob);
  const g = ctx.createRadialGradient(CX, CY, sunR * 0.9, CX, CY, sunR * 2.5);
  g.addColorStop(0, 'rgba(255,90,31,.32)');
  g.addColorStop(0.35, 'rgba(255,90,31,.08)');
  g.addColorStop(1, 'rgba(255,90,31,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(CX, CY, sunR * 2.5, 0, Math.PI * 2);
  ctx.fill();
  // restos cayendo en espiral
  for (const db of debris) {
    ctx.globalAlpha = 0.22 * clamp((db.r - sunW) / 40, 0, 1);
    ctx.fillStyle = BONE;
    ctx.fillRect(
      CX + Math.cos(db.a) * db.r * S - 0.8,
      CY + Math.sin(db.a) * db.r * S - 0.8,
      1.6,
      1.6,
    );
  }
  ctx.globalAlpha = 1;
  brandHole(CX, CY, sunR, 1, pulse * 0.35 + holeFlare);
  // anillos que el agujero negro acaba de tragarse: se estiran y caen dentro
  for (const b of burns) {
    const R = sunW * S * (1 + 0.3 * b.life);
    ctx.globalAlpha = b.life * 0.8;
    ctx.strokeStyle = z.s1;
    ctx.lineWidth = 5 * b.life + 1;
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const bk = state === 'play' || state === 'menu' ? beatKick() : 0,
    bb = state === 'play' ? bassBreath() : 0;
  if (bk > 0.01 || bb > 0.01) {
    const zg = zoneOf(level),
      gr = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * 0.75);
    if (gr && gr.addColorStop) {
      gr.addColorStop(0, rgba(zg.s1, 0.05 * bb + 0.07 * bk));
      gr.addColorStop(1, rgba(zg.s1, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    }
  }
  // anillos y asteroides
  const keys = [...rings.keys()].sort((a, b) => a - b);
  for (const k of keys) {
    const R = rr(k);
    if (k <= sunLevel || R < sunW + 2) {
      continue;
    }
    const ring = rings.get(k),
      zc = zoneOf(k);
    let alpha;
    if (k < level) {
      alpha = clamp((R - SUN) / (R0 - SUN), 0, 1) * 0.35;
    } else {
      alpha = [1, 0.85, 0.14, 0.07, 0.04, 0.02, 0.01][Math.min(k - level, 6)];
    }
    alpha *= clamp((226 - R) / 30, 0, 1);
    if (alpha <= 0.01) {
      continue;
    }
    const cur = k === level && state !== 'dead';
    const rb = k <= level + 1 ? bk : 0;
    ctx.globalAlpha = Math.min(1, alpha * (cur ? 0.9 : 0.55) + rb * 0.35 * alpha);
    ctx.strokeStyle = zc.ring;
    ctx.lineWidth = (cur ? 2 : 1) + (cur ? pulse * 1.2 : 0) + rb * 1.3;
    if (lvl === 2 && !tutorial) {
      // órbita de luz: un halo suave y una línea fina y brillante
      const ga = ctx.globalAlpha,
        lw = ctx.lineWidth;
      ctx.strokeStyle = 'rgba(190,210,255,1)';
      ctx.globalAlpha = ga * 0.18;
      ctx.lineWidth = lw * 4.5;
      ctx.beginPath();
      ctx.arc(CX, CY, R * S, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = ga;
      ctx.lineWidth = Math.max(1, lw * 0.75);
      ctx.strokeStyle = '#f4f1ff';
    }
    const ringPath = () => {
      ctx.beginPath();
      if (bend.str > 0.01) {
        for (let i = 0; i <= 160; i++) {
          const a = (i / 160) * Math.PI * 2,
            [x, y] = lensP(Math.cos(a) * R, Math.sin(a) * R);
          i ? ctx.lineTo(CX + x * S, CY + y * S) : ctx.moveTo(CX + x * S, CY + y * S);
        }
        ctx.closePath();
        return;
      }
      if (ring.type === 'marea') {
        ctx.ellipse(CX, CY, R * S * 1.05, R * S * 0.95, ring.tid, 0, Math.PI * 2);
      } else {
        ctx.arc(CX, CY, R * S, 0, Math.PI * 2);
      }
    };
    if (!tutorial && k >= level) {
      // contorno oscuro detrás y el anillo en blanco firme, para que se lea sobre cielos claros
      const ga = ctx.globalAlpha,
        lw = ctx.lineWidth,
        ss = ctx.strokeStyle;
      ctx.strokeStyle = '#03040a';
      ctx.globalAlpha = Math.min(1, ga * 0.55);
      ctx.lineWidth = lw + 5;
      ringPath();
      ctx.stroke();
      if (cur) {
        ctx.strokeStyle = 'rgba(255,255,255,1)';
        ctx.globalAlpha = ga * 0.16;
        ctx.lineWidth = lw * 5;
        ringPath();
        ctx.stroke();
      }
      ctx.strokeStyle = cur || k === level + 1 ? '#ffffff' : ss;
      ctx.globalAlpha = Math.min(1, ga * (cur ? 1.15 : 1.35));
      ctx.lineWidth = lw * (cur ? 1.3 : 1.25);
    }
    ringPath();
    ctx.stroke();
    ctx.globalAlpha = alpha;
    if (ring.type === 'arrastre' && k >= level && k <= level + 1) {
      ctx.strokeStyle = '#c9a0ff';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = alpha * 0.8;
      const sgn = ring.w >= 0 ? 1 : -1;
      for (let i = 0; i < 12; i++) {
        const a = ring.phase + (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.arc(CX, CY, R * S, a, a + sgn * 0.14, sgn < 0);
        ctx.stroke();
      }
      ctx.globalAlpha = alpha;
    }
    if (ring.flash > 0 && k === level + 1) {
      ctx.globalAlpha = ring.flash;
      ctx.strokeStyle = zc.s2;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(CX, CY, R * S, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha;
    }
    // asteroides visibles solo en el anillo al que vas a saltar
    let aA = 0,
      sc = 1;
    if (k === level + 1) {
      aA = appear;
      sc = 0.4 + 0.6 * appear;
    } else if (k === level && astFade > 0) {
      aA = astFade;
      sc = 0.5 + 0.5 * astFade;
    } else if (wh && wh.ph === 'orb' && k === level + 2 && ring.type === 'orbita') {
      aA = 0.3;
      sc = 0.8;
    }
    if (aA > 0.01) {
      for (const o of ring.obs) {
        if (o.star || o.gone) {
          continue;
        }
        if (o.melt) {
          const u = Math.min(1, (t - o.melt) / (o.burn ? 0.16 : 0.7)),
            oa = obsAng(ring, o),
            x = CX + Math.cos(oa) * R * S,
            y = CY + Math.sin(oa) * R * S,
            rr4 = obsRad(ring, o) * S * sc * (o.burn ? 1 + u : 1.15 - 0.65 * u * u);
          if (o.burn) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(x, y, 0, x, y, rr4 * 2);
            g.addColorStop(0, 'rgba(255,255,245,' + (1 - u) + ')');
            g.addColorStop(0.5, 'rgba(255,190,90,' + 0.8 * (1 - u) + ')');
            g.addColorStop(1, 'rgba(255,90,20,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, rr4 * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            continue;
          }
          // Venus: la roca pasa de rojo oscuro a naranja y a blanco, y se escurre hacia el agujero
          // negro
          const ba = Math.atan2(CY - y, CX - x),
            hc =
              u < 0.45
                ? [170 + 180 * u, 40 + 120 * u, 20]
                : [255, 95 + 300 * (u - 0.45), 30 + 360 * (u - 0.45)];
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(ba);
          ctx.scale(1 + 0.9 * u * u, 1 - 0.25 * u);
          ctx.rotate(-ba);
          drawAst(0, 0, rr4, o.seed, t * 0.8 + o.seed, zc.ast, (1 - u * 0.8) * aA);
          ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr4 * (1.6 + u));
          g.addColorStop(
            0,
            'rgba(' + hc.map(v => Math.min(255, v | 0)).join(',') + ',' + (0.6 + 0.35 * u) + ')',
          );
          g.addColorStop(0.55, 'rgba(255,90,30,' + 0.45 * (1 - u * 0.4) + ')');
          g.addColorStop(1, 'rgba(255,60,20,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, rr4 * (1.6 + u), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          if (Math.random() < 0.35 * aA) {
            const wx = (x - CX) / S,
              wy = (y - CY) / S,
              v = 30 + Math.random() * 50;
            particles.push({
              x: wx,
              y: wy,
              vx: Math.cos(ba) * v + (Math.random() - 0.5) * 20,
              vy: Math.sin(ba) * v + (Math.random() - 0.5) * 20,
              life: 0.5 + Math.random() * 0.5,
              col: u < 0.5 ? '#ff6a2a' : '#ffd08a',
              s: 1.4 + Math.random() * 1.8,
            });
          } // gotas
          continue;
        }
        const oa = obsAng(ring, o);
        const sR = R * stretchAt(ring, oa),
          wx0 = Math.cos(oa) * sR,
          wy0 = Math.sin(oa) * sR,
          [lx, ly] = lensP(wx0, wy0);
        if (bend.str > 0.01) {
          const [mt, mr, ang] = lensJ(wx0, wy0);
          ctx.save();
          ctx.translate(CX + lx * S, CY + ly * S);
          ctx.rotate(ang);
          ctx.scale(mr, Math.min(mt, 3.2));
          ctx.rotate(-ang);
          drawAst(0, 0, obsRad(ring, o) * S * sc, o.seed, t * 0.8 + o.seed, zc.ast, aA);
          ctx.restore();
        } else {
          drawAst(
            CX + lx * S,
            CY + ly * S,
            obsRad(ring, o) * S * sc,
            o.seed,
            t * 0.8 + o.seed,
            zc.ast,
            aA,
          );
        }
      }
    }
    if (k >= level && k <= level + 2 && (ring.frozenT > 0 || ring.revT > 0 || ring.windT > 0)) {
      drawRingPower(ring, R, Math.max(alpha, k === level + 2 ? 0.5 : alpha));
    }
    if (ring.type === 'nova' && !tutorial && k >= level && k <= level + 2) {
      drawNova(
        ring,
        R,
        k === level + 1 ? Math.max(aA, 0.0) : k === level ? Math.max(0.25, aA) : 0.35 * alpha,
        k === level + 1,
      );
    }
    if (aA > 0.01 && k === level + 1) {
      if (ring.obj && !ring.obj.got) {
        const sa = ring.obj.a + ring.phase - (ring.poff || 0),
          ox = CX + Math.cos(sa) * R * S,
          oy = CY + Math.sin(sa) * R * S;
        if (ring.obj.kind === 'pulsar') {
          drawPulsar(ox, oy, 4.5 * S, aA);
        } else {
          drawNebula(ox, oy, 5 * S, aA);
        }
      }
      if (ring.coin && !ring.coin.got) {
        const sa = ring.coin.a + ring.phase - (ring.poff || 0);
        drawCoin(CX + Math.cos(sa) * R * S, CY + Math.sin(sa) * R * S, 4.2 * S, aA);
      }
    }
  }
  ctx.globalAlpha = 1;

  // la salida del sistema solar
  if (state === 'play' && curGoal() > level) {
    const R = rr(curGoal()),
      vis = clamp((262 - R) / 44, 0, 1);
    if (vis > 0.01) {
      const Rs = R * S,
        bt = 0.5 + 0.5 * Math.sin(t * 5);
      ctx.globalAlpha = vis * (0.6 + 0.35 * bt);
      ctx.strokeStyle = z.s2;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.arc(CX, CY, Rs, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const la = -Math.PI / 2 + 0.45;
      ctx.globalAlpha = vis;
      ctx.fillStyle = z.s2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 12px Unbounded, system-ui, sans-serif';
      const fl = curGoal() - level,
        nm = tutorial ? 'Meta' : 'Salida';
      ctx.fillText(
        fl === 1 ? nm + ' · ¡el último!' : nm + ' · faltan ' + fl,
        CX + Math.cos(la) * (Rs + 16),
        CY + Math.sin(la) * (Rs + 16),
      );
      ctx.globalAlpha = 1;
    }
  }
  // tu récord (donde caíste la última vez) marcado en el recorrido, en azul como la Tierra
  if (state === 'play' && runRecord > level && runRecord < GOAL) {
    const R = rr(runRecord),
      vis = clamp((250 - R) / 40, 0, 1);
    if (vis > 0.01 && R > sunW + 2) {
      const Rs = R * S,
        bt = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.globalAlpha = vis * (0.5 + 0.3 * bt);
      ctx.strokeStyle = '#8fd0ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.arc(CX, CY, Rs, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const la = -Math.PI / 2 - 0.45;
      ctx.globalAlpha = vis;
      ctx.fillStyle = '#8fd0ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 12px Unbounded, system-ui, sans-serif';
      ctx.fillText('Tu récord', CX + Math.cos(la) * (Rs + 16), CY + Math.sin(la) * (Rs + 16));
      ctx.globalAlpha = 1;
    }
  }
  // marca de dónde vas a caer: justo encima de ti
  if (state === 'play' && !jumping) {
    const Rn = rr(level + 1) * S;
    ctx.strokeStyle = BONE;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CX, CY, Rn, pAng - 0.07, pAng + 0.07);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // el asteroide que te mató, señalado
  if (culprit && culpritT > 0) {
    const ring = rings.get(culprit.k);
    if (ring) {
      const oa = obsAng(ring, culprit.o),
        R = rr(culprit.k) * S;
      ctx.globalAlpha = Math.min(1, culpritT);
      ctx.strokeStyle = z.s2;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(
        CX + Math.cos(oa) * R,
        CY + Math.sin(oa) * R,
        Math.max(1, (culprit.o.r + 7) * S),
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawBendSphere(); // la boca tapa lo que pasa detrás de ella
  if (state === 'play' || state === 'dead') {
    drawPowerScene();
  }
  // estela y jugador
  if (state !== 'dead' && !hideEarth) {
    if (!bend.fixed) {
      for (let i = 1; i < trail.length; i++) {
        const p0 = trail[i - 1],
          p1 = trail[i],
          r0 = rr(p0.l) * S,
          r1 = rr(p1.l) * S;
        const rdy = state === 'play' && charge >= chargeMax();
        ctx.globalAlpha = (i / trail.length) * (rdy ? 0.6 : 0.3);
        ctx.strokeStyle = rdy ? '#ffd36b' : '#8fd0ff';
        ctx.lineWidth = (i / trail.length) * PR * (rdy ? 2 : 1.4) * S;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const [ax, ay] = lensP((Math.cos(p0.a) * r0) / S, (Math.sin(p0.a) * r0) / S),
          [bx, by] = lensP((Math.cos(p1.a) * r1) / S, (Math.sin(p1.a) * r1) / S);
        ctx.moveTo(CX + ax * S, CY + ay * S);
        ctx.lineTo(CX + bx * S, CY + by * S);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    const onM = !jumping && rings.get(level) && rings.get(level).type === 'marea';
    const pr = rr(pLevel) * S * (onM ? stretchAt(rings.get(level), pAng) : 1),
      [lpx, lpy] = lensP((Math.cos(pAng) * pr) / S, (Math.sin(pAng) * pr) / S),
      px = CX + lpx * S,
      py = CY + lpy * S;
    if (state === 'play') {
      drawHazards();
    }
    if (state === 'play') {
      drawPowerAura(px, py);
    }
    if (bend.str > 0.01 && !viewInside) {
      const [mt, mr, ang] = lensJ((Math.cos(pAng) * pr) / S, (Math.sin(pAng) * pr) / S);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.scale(mr, Math.min(mt, 4.5));
      ctx.rotate(-ang);
      drawPlayer(
        0,
        0,
        PR * S * 1.15 * (jumping ? 1.1 : 1) * (1 + landPop * 0.25) * (1 + 0.08 * bk),
      );
      ctx.restore();
    } else {
      setStrainK(strainNow());
      const sa = Math.atan2(CY - py, CX - px),
        jit = strainK > 0.3 ? (Math.random() - 0.5) * strainK * 1.6 : 0;
      ctx.save();
      ctx.translate(px + jit, py + jit);
      ctx.rotate(sa);
      ctx.scale(1 + 0.22 * strainK, 1 - 0.1 * strainK);
      ctx.rotate(-sa);
      drawPlayer(
        0,
        0,
        PR * S * 1.15 * (jumping ? 1.1 : 1) * (1 + landPop * 0.25) * (1 + 0.08 * bk),
      );
      ctx.restore();
    }
    if (state === 'play') {
      drawPowerFx(px, py, PR * S * 1.15);
      drawCharge(px, py, z);
    }
  }
  if (swallow && !swallow.done) {
    const p = swallow.p,
      sr = swallow.r * S;
    const px = CX + Math.cos(swallow.a) * sr,
      py = CY + Math.sin(swallow.a) * sr;
    const rad = PR * S * 1.15 * (1 - 0.5 * p);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.atan2(CY - py, CX - px) - Math.PI / 2);
    ctx.translate(0, rad * 1.4 * p * p);
    ctx.scale(1 - 0.6 * p, 1 + 2.8 * p * p);
    ctx.globalAlpha = 1 - clamp((p - 0.82) / 0.18, 0, 1);
    drawPlayer(0, 0, rad);
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fillStyle = rgba(z.s2, 0.35 * p);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,' + 0.85 * p * p + ')';
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // partículas
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.fillStyle = p.col;
    if (p.s > 1.8) {
      ctx.beginPath();
      ctx.arc(CX + p.x * S, CY + p.y * S, p.s * 0.55, 0, Math.PI * 2);
      ctx.fill();
    } // las partículas grandes, redondas
    else {
      ctx.fillRect(CX + p.x * S - p.s / 2, CY + p.y * S - p.s / 2, p.s, p.s);
    }
  }
  ctx.globalAlpha = 1;

  // textos flotantes
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const tx of texts) {
    ctx.globalAlpha = clamp(tx.life, 0, 1);
    ctx.font = '900 ' + tx.size + 'px Unbounded, system-ui, sans-serif';
    ctx.fillStyle = tx.col;
    ctx.fillText(tx.txt, CX + tx.x * S, CY + tx.y * S);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();

  if (state === 'play') {
    const danger = clamp((1.1 - (pLevel - sunLevel)) / 0.8, 0, 1);
    if (danger > 0) {
      const vg = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.35,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.75,
      );
      vg.addColorStop(0, 'rgba(255,40,70,0)');
      vg.addColorStop(1, 'rgba(255,40,70,' + danger * (0.35 + 0.15 * Math.sin(t * 14)) + ')');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }
  }
  if (flash > 0) {
    ctx.globalAlpha = flash * 0.35;
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (tutorial && state === 'play' && TUT_TIPS[level]) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = BONE;
    let fs = 16;
    ctx.font = '500 ' + fs + 'px Unbounded, system-ui, sans-serif';
    const tip = TUT_TIPS[level],
      m = ctx.measureText ? ctx.measureText(tip) : null,
      w = (m && m.width) || 0;
    if (w > W - 48) {
      fs = Math.max(12, (fs * (W - 48)) / w);
      ctx.font = '500 ' + fs + 'px Unbounded, system-ui, sans-serif';
    }
    ctx.globalAlpha = 0.92;
    ctx.fillText(tip, CX, Math.max(150, H * 0.24));
    ctx.restore();
  }
  if (state === 'home' && homeT >= logoT0) {
    drawLogo(W / 2, Math.max(120, H * 0.24), Math.min(46, W * 0.1), homeT - logoT0);
  }
  if (dangerFlash > 0 && state === 'play') {
    // borde rojo que late con la alarma
    const g = ctx.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.35,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.75,
    );
    if (g && g.addColorStop) {
      g.addColorStop(0, 'rgba(255,40,20,0)');
      g.addColorStop(1, 'rgba(255,40,20,' + (dangerFlash * 0.55).toFixed(3) + ')');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }
  if (introFade > 0) {
    ctx.globalAlpha = introFade;
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  drawFlare();
}

export { renderScene };

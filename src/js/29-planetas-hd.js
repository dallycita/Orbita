/**
 * Planetas en HD y pantalla de planetas: texturas procedurales en WebGL (PLGL), anillos, el
 * planeta del jugador en la partida y el carrusel de planetas con su escáner.
 * Sin WebGL todo cae a un dibujo 2D más simple (drawBigPlanet2D).
 */
import { BONE, H, W, ctx, cvs, rgba, stars } from './01-pantalla-y-utilidades.js';
import { AC } from './02-audio.js';
import { setState, state } from './06-record-y-estado.js';
import { PLANETS_P, curPlanet, planetOk, setCurPlanet } from './07-planetas.js';
import { setT, t } from './08-partida-estado.js';
import { elHome } from './26-pantalla-inicio.js';
import { uiOut, uiTone } from './28-sonidos-interfaz.js';
import { muted } from './core/settings.js';
import {
  STAT_ROWS,
  applyScanBars,
  pRot,
  scanApplyAt,
  scanK,
  scanLineT,
  scanOn,
  setPRot,
  setScan,
  setScanApplyAt,
  setScanK,
  setScanLineT,
  setScanOn,
  statWords,
} from './30-escanear.js';
import { PLGL, drawBigPlanet } from './render/planets.js';
import { uiGlass } from './audio/ui-sounds.js';

let elPl;
let pIndex = 0;
let pSwap = 0;
let pDir = 1;
let pTarget = 0;
let pPos = 0;
let pDrag = 0;
let pSlots = [];
let pScan = false;
let pScanT = 0;
let pSK = 0;
let pUse = 0;
const pGeom = () => ({ R0: Math.min(W * 0.2, H * 0.15), cx0: W / 2, cy0: H * 0.3 });

/**
 * Dibuja un cuadro de la pantalla de planetas: fondo, carrusel en órbita y escáner.
 *
 * @param {number} dt Tiempo desde el cuadro anterior, en segundos.
 */
function renderPlanetsScene(dt) {
  setT(t + dt);
  pSwap = Math.max(0, pSwap - dt * 3.2);
  const target = scanOn ? 1 : 0;
  setScanK(scanK + (target - scanK) * Math.min(1, dt * 4.2));
  if (Math.abs(target - scanK) < 0.003) {
    setScanK(target);
  }
  setPRot(pRot + dt * (0.35 + 7 * Math.sin(Math.PI * scanK)));
  if (scanOn && scanK > 0.9 && scanLineT < 1) {
    setScanLineT(Math.min(1, scanLineT + dt / 0.75));
  }
  if (scanApplyAt && performance.now() >= scanApplyAt) {
    setScanApplyAt(0);
    applyScanBars();
  }
  const P = PLANETS_P[pIndex],
    locked = !planetOk(P),
    hide = P.secret && !locked ? false : P.secret && locked;
  ctx.save();
  ctx.fillStyle = '#05060c';
  ctx.fillRect(0, 0, W, H);
  const neb = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, Math.max(W, H) * 0.6);
  neb.addColorStop(0, rgba(P.col, locked ? 0.05 : 0.16));
  neb.addColorStop(1, rgba(P.col, 0));
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, W, H);
  const sr = Math.max(W, H) * 0.62;
  for (const s of stars) {
    const a = s.a + t * 0.01,
      x = W / 2 + Math.cos(a) * s.r * sr,
      y = H * 0.4 + Math.sin(a) * s.r * sr;
    ctx.globalAlpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3 + s.tw));
    ctx.fillStyle = BONE;
    ctx.fillRect(x, y, s.s * 0.8, s.s * 0.8);
  }
  if (scanK < 0.01) {
    drawPlanetOrbit(dt, P);
    ctx.restore();
    return;
  }
  ctx.globalAlpha = 1 - pSwap;
  const R =
    Math.min(W * 0.27, H * 0.17) *
    (P.id === 'pluton' ? 0.78 : 1) *
    (1 - pSwap * 0.15) *
    (1 - 0.55 * scanK);
  const cx = W / 2 + pDir * pSwap * W * 0.25,
    cy = H * 0.38 * (1 - scanK) + H * 0.165 * scanK + Math.sin(t * 0.8) * 4 * (1 - scanK);
  drawBigPlanet(P.id, cx, cy, R, pRot, locked && hide, 'left');
  // la línea del escáner recorre el planeta
  if (scanOn && scanLineT > 0 && scanLineT < 1) {
    const yy = cy - R * 1.25 + R * 2.5 * scanLineT,
      w2 = R * 1.6;
    const lg = ctx.createLinearGradient(cx - w2, yy, cx + w2, yy);
    if (lg && lg.addColorStop) {
      lg.addColorStop(0, 'rgba(143,208,255,0)');
      lg.addColorStop(0.5, 'rgba(200,235,255,.95)');
      lg.addColorStop(1, 'rgba(143,208,255,0)');
      ctx.fillStyle = lg;
    }
    ctx.globalAlpha = 1;
    ctx.fillRect(cx - w2, yy - 1, w2 * 2, 2);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#8fd0ff';
    ctx.fillRect(cx - w2, cy - R * 1.25, w2 * 2, yy - (cy - R * 1.25));
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
/**
 * Carrusel de la pantalla de planetas: el elegido grande arriba y los demás sobre una órbita;
 * al cambiar de planeta, todo gira con él.
 *
 * @param {number} dt Tiempo desde el cuadro anterior, en segundos.
 * @param {object} P Planeta elegido (de PLANETS_P).
 */
function drawPlanetOrbit(dt, P) {
  const N = PLANETS_P.length;
  pPos += (pTarget - pPos) * Math.min(1, dt * 7.5);
  const pos = pPos + pDrag;
  pSK += ((pScan ? 1 : 0) - pSK) * Math.min(1, dt * 3.2);
  if (Math.abs((pScan ? 1 : 0) - pSK) < 0.002) {
    pSK = pScan ? 1 : 0;
  }
  // al entrar y salir del escaneo el planeta rueda rápido
  setPRot(pRot + dt * 6.5 * Math.sin(Math.PI * pSK));
  const G = pGeom(),
    R0 = G.R0 * (1 - 0.3 * pSK),
    cx0 = G.cx0,
    cy0 = G.cy0 - G.R0 * 0.12 * pSK + Math.sin(t * 0.8) * 3 * (1 - pSK);
  const RA = Math.max(W, H) * 1.25,
    yTop = H * 0.45,
    acx = W / 2,
    acy = yTop + RA;
  const step = Math.asin(Math.min(0.95, Math.max(W * 0.3, R0 * 1.6) / RA));
  const arcSlot = o => {
    const th = o * step;
    return [acx + RA * Math.sin(th), acy - RA * Math.cos(th)];
  };
  // la órbita: una línea tenue con un brillo naranja bajo el planeta elegido
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(236,230,216,.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(acx, acy, RA, -Math.PI / 2 - 1.2, -Math.PI / 2 + 1.2);
  ctx.stroke();
  const gl = ctx.createLinearGradient(W / 2 - R0 * 1.2, 0, W / 2 + R0 * 1.2, 0);
  if (gl && gl.addColorStop) {
    gl.addColorStop(0, 'rgba(255,161,85,0)');
    gl.addColorStop(0.5, 'rgba(255,161,85,.85)');
    gl.addColorStop(1, 'rgba(255,161,85,0)');
    ctx.strokeStyle = gl;
  }
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(acx, acy, RA, -Math.PI / 2 - (R0 * 1.2) / RA, -Math.PI / 2 + (R0 * 1.2) / RA);
  ctx.stroke();
  ctx.restore();
  // cada planeta en su lugar de la órbita; el de en medio sube y crece
  const list = [];
  for (let i = 0; i < N; i++) {
    let o = i - pos;
    o = (((o % N) + N + N / 2) % N) - N / 2;
    const ao = Math.abs(o);
    if (ao > 2.7) {
      continue;
    }
    let x, y, r;
    const a1 = arcSlot(Math.sign(o) || 1),
      r1 = R0 * 0.36;
    if (ao <= 1) {
      const e = ao * ao * (3 - 2 * ao);
      x = cx0 + (a1[0] - cx0) * e;
      y = cy0 + (a1[1] - cy0) * e;
      r = R0 + (r1 - R0) * e;
    } else {
      const s2 = arcSlot(o);
      x = s2[0];
      y = s2[1];
      r = r1 * Math.pow(0.72, ao - 1);
    }
    list.push({ i, o, ao, x, y, r });
  }
  list.sort((a, b) => b.ao - a.ao);
  pSlots = [];
  for (const it of list) {
    const Q = PLANETS_P[it.i],
      ok = planetOk(Q);
    const fade = (1 - Math.max(0, (it.ao - 2.1) / 0.6)) * (it.ao > 0.5 ? 1 - 0.8 * pSK : 1),
      dim = 0.5 + 0.5 * Math.max(0, 1 - it.ao);
    const rr0 = it.r * (Q.id === 'pluton' ? 0.82 : 1);
    ctx.save();
    ctx.globalAlpha = fade * (ok ? dim : 0.9);
    drawBigPlanet(Q.id, it.x, it.y, rr0, pRot + it.i, !ok, {
      x: ((W / 2 - it.x) / W) * 1.6 - 0.55,
      y: -0.45,
    });
    if (ok && it.ao > 0.2) {
      ctx.globalAlpha = (1 - dim) * 0.55 * fade;
      ctx.fillStyle = '#05060c';
      ctx.beginPath();
      ctx.arc(it.x, it.y, rr0 * 1.02, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (Q.id === curPlanet && fade > 0.05) {
      // marca dorada bajo el planeta que estás usando
      const my = it.y + rr0 * (Q.id === 'saturno' ? 0.95 : 1.22) + 6,
        a0 = fade * (0.75 + 0.25 * Math.sin(t * 3));
      ctx.save();
      ctx.globalAlpha = a0 * 0.35;
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath();
      ctx.arc(it.x, my, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = a0;
      ctx.beginPath();
      ctx.arc(it.x, my, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    pSlots.push({ i: it.i, o: it.o, x: it.x, y: it.y, r: Math.max(rr0, 26) });
  }
  if (pUse > 0) {
    pUse = Math.max(0, pUse - dt * 1.6);
    const u = 1 - pUse;
    ctx.save();
    ctx.globalAlpha = pUse * 0.8;
    ctx.strokeStyle = '#ffd36b';
    ctx.lineWidth = 2.5 * pUse + 0.5;
    ctx.beginPath();
    ctx.arc(cx0, cy0, R0 * (1.05 + 0.55 * u), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = pUse * 0.25;
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(cx0, cy0, R0 * 1.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (pScan) {
    // escaneo: una mira que gira alrededor del planeta y una línea de luz que lo recorre
    pScanT += dt;
    const k = Math.min(1, pScanT / 0.5),
      Rr = R0 * 1.16;
    ctx.save();
    ctx.translate(cx0, cy0);
    ctx.globalAlpha = 0.55 * k;
    ctx.strokeStyle = '#8fd0ff';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([2, 7]);
    ctx.lineDashOffset = -t * 12;
    ctx.beginPath();
    ctx.arc(0, 0, Rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.rotate(t * 0.35);
    ctx.globalAlpha = 0.9 * k;
    ctx.strokeStyle = '#ffa155';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, Rr, -0.5, 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, Rr, Math.PI - 0.5, Math.PI + 0.1);
    ctx.stroke();
    ctx.rotate(-t * 0.35);
    ctx.globalAlpha = 0.7 * k;
    ctx.strokeStyle = '#ece6d8';
    ctx.lineWidth = 1.4;
    for (let a = 0; a < 4; a++) {
      const an = (a * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(an) * (Rr + 4), Math.sin(an) * (Rr + 4));
      ctx.lineTo(Math.cos(an) * (Rr + 14), Math.sin(an) * (Rr + 14));
      ctx.stroke();
    }
    ctx.restore();
    const SD = 0.9,
      NP = 3;
    let ph = -1,
      dn = 1;
    if (pScanT < SD * NP) {
      const n = Math.floor(pScanT / SD);
      ph = (pScanT - n * SD) / SD;
      dn = n % 2 ? -1 : 1;
    } else {
      const q = (pScanT - SD * NP) % 3.5;
      if (q < 1.2) {
        ph = q / 1.2;
        dn = 1;
      }
    }
    if (ph >= 0) {
      const e = ph * ph * (3 - 2 * ph),
        f = dn > 0 ? e : 1 - e,
        yy = cy0 - R0 * 1.1 + 2.2 * R0 * f,
        w2 = R0 * 1.12,
        strong = pScanT < SD * NP ? 1 : 0.45;
      const lg = ctx.createLinearGradient(cx0 - w2, 0, cx0 + w2, 0);
      if (lg && lg.addColorStop) {
        lg.addColorStop(0, 'rgba(143,208,255,0)');
        lg.addColorStop(0.5, 'rgba(210,240,255,.95)');
        lg.addColorStop(1, 'rgba(143,208,255,0)');
        ctx.fillStyle = lg;
      }
      ctx.save();
      ctx.globalAlpha = strong;
      ctx.fillRect(cx0 - w2, yy - 1, w2 * 2, 2);
      ctx.beginPath();
      ctx.arc(cx0, cy0, R0 * 1.02, 0, Math.PI * 2);
      ctx.clip(); // rejilla holográfica sobre la parte ya escaneada
      const y0 = dn > 0 ? cy0 - R0 * 1.1 : yy,
        y1 = dn > 0 ? yy : cy0 + R0 * 1.1;
      ctx.globalAlpha = 0.1 * strong;
      ctx.fillStyle = '#8fd0ff';
      ctx.fillRect(cx0 - w2, y0, w2 * 2, y1 - y0);
      ctx.globalAlpha = 0.22 * strong;
      ctx.strokeStyle = '#8fd0ff';
      ctx.lineWidth = 1;
      const gs = Math.max(8, R0 / 7);
      ctx.beginPath();
      for (let gy = cy0 - R0; gy < cy0 + R0; gy += gs) {
        if (gy >= y0 && gy <= y1) {
          ctx.moveTo(cx0 - R0, gy);
          ctx.lineTo(cx0 + R0, gy);
        }
      }
      for (let gx = cx0 - R0; gx < cx0 + R0; gx += gs) {
        ctx.moveTo(gx, y0);
        ctx.lineTo(gx, y1);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}
const POW_ICO = {
  luna: '<circle cx="12" cy="12" r="8"/><path d="M15.5 4.8a8 8 0 0 1 0 14.4 6.5 6.5 0 0 0 0-14.4z" class="f"/>',
  mercurio: '<path d="M13.5 2.5 5.5 13.5h6l-1 8 8-11h-6z"/>',
  venus: '<path d="M18.5 9A7 7 0 1 0 19 15"/><path d="M19.5 4v5h-5"/>',
  tierra: '<path d="M6 12.5l6-6 6 6M6 18.5l6-6 6 6"/>',
  marte: '<path d="M2.5 19.5 9.5 7l4 6 2.5-3.5 5.5 10z"/>',
  jupiter:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3.5M12 18v3.5M2.5 12H6M18 12h3.5M5.3 5.3l2.4 2.4M16.3 16.3l2.4 2.4M18.7 5.3l-2.4 2.4M7.7 16.3l-2.4 2.4"/>',
  saturno:
    '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="3.4" transform="rotate(-18 12 12)"/>',
  urano:
    '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M20.2 7.2 3.8 16.8M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
  neptuno: '<path d="M3 8.5h11a3 3 0 1 0-3-3M3 12.5h16a3 3 0 1 1-3 3M3 16.5h7"/>',
  pluton: '<circle cx="9" cy="12" r="5.5"/><circle cx="18.5" cy="8" r="2.8"/>',
  sol: '<path d="M12 21.5c-4 0-6.5-2.8-6.5-6.3 0-3.7 3-5.4 3.5-9.7 2.4 1.6 3.4 3.8 3.4 5.6 1-.7 1.7-2 1.8-3.4 2.3 1.9 4.3 4.3 4.3 7.5 0 3.5-2.5 6.3-6.5 6.3z"/>',
};
/** Actualiza el HTML de la pantalla de planetas para el planeta elegido. */
function renderPlanets() {
  if (!elPl) {
    return;
  }
  const P = PLANETS_P[pIndex],
    ok = planetOk(P),
    sel = P.id === curPlanet,
    hide = P.secret && !ok;
  const G = pGeom(),
    SCN =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  let scanUI = '';
  if (!hide) {
    scanUI =
      '<button type="button" class="pscan' +
      (pScan ? ' on' : '') +
      '" style="left:' +
      (G.cx0 + G.R0 * (pScan ? 0.62 : 0.78)).toFixed(0) +
      'px;top:' +
      (G.cy0 + G.R0 * (pScan ? 0.42 : 0.78)).toFixed(0) +
      'px" aria-label="Escanear" aria-pressed="' +
      pScan +
      '">' +
      SCN +
      '<span>' +
      (pScan ? 'Cerrar' : 'Escanear') +
      '</span></button>';
  }
  elPl.innerHTML =
    '<div class="pswipe"></div><button type="button" class="back" aria-label="Volver al inicio">' +
    ARC_L +
    CHEV_L +
    '</button><div class="ptop">PLANETAS</div>' +
    scanUI +
    '<div class="pinfo po" style="--dir:' +
    pDir +
    '"><div class="pidx">◂ ' +
    (pIndex + 1) +
    ' / ' +
    PLANETS_P.length +
    ' ▸</div><div class="pname">' +
    (hide ? '???' : P.name) +
    '</div>' +
    (pScan && !hide
      ? '<div class="pread">' +
        STAT_ROWS.map(([k, lab, hint, dat, good], i) => {
          const v = P.st[k],
            col = v === 0 ? '#ece6d8' : good(v) ? '#7ad38a' : '#ff8a4d';
          const [word, eff] = statWords(k, v);
          return (
            '<div class="prc" style="animation-delay:' +
            (0.75 + i * 0.9) +
            's"><small>' +
            lab +
            '</small><b style="color:' +
            col +
            '">' +
            word +
            '</b><i>' +
            eff +
            '</i><em>' +
            dat(P).replace(/^[^:]*: /, '') +
            '</em></div>'
          );
        }).join('') +
        '</div>' +
        '<p class="ppowd"><span>' +
        P.power[0] +
        '</span> · ' +
        P.power[1] +
        '</p>'
      : '') +
    (hide || pScan
      ? ''
      : '<div class="ppow' +
        (ok ? '' : ' off') +
        '"><svg viewBox="0 0 24 24" aria-hidden="true">' +
        (POW_ICO[P.id] || POW_ICO.tierra) +
        '</svg>' +
        P.power[0] +
        '</div>') +
    (pScan && !hide
      ? ''
      : '<p class="pdesc">' + (hide ? 'Un planeta que no se rinde…' : P.desc) + '</p>') +
    (ok && sel
      ? '<div class="pinuse"><i></i>En uso</div>'
      : ok
        ? '<button type="button" class="pbtn">' + 'Usar' + '</button>'
        : '<div class="plock">▸ ' + P.how + '</div>') +
    '</div>';
  elPl.classList.toggle('scanning', scanOn && !hide);
  if (!elPl.querySelectorAll || !elPl.querySelector) {
    return;
  }
  elPl
    .querySelectorAll('.arrow')
    .forEach(b => b.addEventListener('click', () => planetStep(Number(b.dataset.d))));
  const sw = elPl.querySelector('.pswipe');
  if (sw && sw.addEventListener) {
    let x0 = null,
      moved = 0;
    sw.addEventListener('pointerdown', e => {
      x0 = e.clientX;
      moved = 0;
      try {
        sw.setPointerCapture(e.pointerId);
      } catch (_) {}
    });
    sw.addEventListener('pointermove', e => {
      if (x0 === null) {
        return;
      }
      const dx = e.clientX - x0;
      moved = Math.max(moved, Math.abs(dx));
      pDrag = -dx / Math.max(160, W * 0.32);
    });
    const end = e => {
      if (x0 === null) {
        return;
      }
      const dx = e.clientX - x0;
      x0 = null;
      if (moved > 30) {
        const n = Math.round(-dx / Math.max(160, W * 0.32)) || (dx < 0 ? 1 : -1);
        pTarget += 0;
        pPos += pDrag;
        pDrag = 0;
        uiGlass(n > 0 ? 1 : -1);
        planetStep(n);
        return;
      }
      pDrag = 0;
      const r = cvs.getBoundingClientRect ? cvs.getBoundingClientRect() : { left: 0, top: 0 },
        x = e.clientX - r.left,
        y = e.clientY - r.top; // tocar un planeta vecino lo trae al centro
      let best = null;
      for (const sl of pSlots) {
        const d2 = Math.hypot(x - sl.x, y - sl.y);
        if (d2 < sl.r * 1.2 && (!best || Math.abs(sl.o) < Math.abs(best.o))) {
          best = sl;
        }
      }
      if (best && Math.abs(best.o) > 0.5) {
        const n = Math.round(best.o);
        uiGlass(n > 0 ? 1 : -1);
        planetStep(n);
      }
    };
    sw.addEventListener('pointerup', end);
    sw.addEventListener('pointercancel', () => {
      x0 = null;
      pDrag = 0;
    });
  }
  const pb = elPl.querySelector('.pbtn');
  if (pb && !pb.disabled) {
    pb.addEventListener('click', () => {
      setCurPlanet(P.id);
      pUse = 1;
      try {
        localStorage.setItem('orbita_p1_planeta', curPlanet);
      } catch (e) {}
      if (AC && !muted) {
        try {
          const n = AC.currentTime;
          uiTone(880, n, 0.14, 0.05);
          uiTone(1320, n + 0.09, 0.22, 0.04);
        } catch (e) {}
      }
      renderPlanets();
    });
  }
  const bk = elPl.querySelector('.back');
  if (bk) {
    bk.addEventListener('click', closePlanets);
  }
  const sb = elPl.querySelector('.scanbtn');
  if (sb) {
    sb.addEventListener('click', () => setScan(true));
  }
  const ps = elPl.querySelector('.pscan');
  if (ps) {
    ps.addEventListener('click', () => {
      pScan = !pScan;
      pScanT = 0;
      if (pScan && AC && !muted) {
        try {
          const n = AC.currentTime,
            o = AC.createOscillator(),
            g = AC.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(500, n);
          o.frequency.exponentialRampToValueAtTime(1800, n + 0.6);
          g.gain.setValueAtTime(0.0001, n);
          g.gain.exponentialRampToValueAtTime(0.05, n + 0.05);
          g.gain.exponentialRampToValueAtTime(0.0001, n + 0.7);
          o.connect(g);
          g.connect(uiOut());
          o.start(n);
          o.stop(n + 0.75);
        } catch (e) {}
      }
      renderPlanets();
    });
  }
  const sc = elPl.querySelector('.sclose');
  if (sc) {
    sc.addEventListener('click', () => setScan(false));
  }
  if (scanOn && !hide) {
    setScanApplyAt(performance.now() + 120);
  }
  if (scanOn && hide) {
    setScanOn(false);
  }
}
/**
 * Pasa al planeta siguiente o anterior del carrusel.
 *
 * @param {number} d Pasos: 1 siguiente, -1 anterior.
 */
function planetStep(d) {
  pScan = false;
  pTarget += d;
  pIndex = ((pTarget % PLANETS_P.length) + PLANETS_P.length) % PLANETS_P.length;
  pDir = d > 0 ? 1 : -1;
  pSwap = 1;
  renderPlanets();
  warmNext(d);
}
/**
 * Prepara en segundo plano la textura HD del planeta que viene, para que el cambio sea fluido.
 *
 * @param {number} d Dirección del último paso: 1 o -1.
 */
function warmNext(d) {
  const n = PLANETS_P[(pIndex + (d || 1) + PLANETS_P.length) % PLANETS_P.length];
  setTimeout(() => {
    try {
      if (state === 'planets') {
        PLGL.warm(n.id, true);
      }
    } catch (e) {}
  }, 450);
}
/** Abre la pantalla de planetas con el planeta que usa el jugador al centro. */
function openPlanets() {
  try {
    localStorage.removeItem('orbita_pl_nuevo');
  } catch (e) {}
  setScanOn(false);
  setScanK(0);
  setState('planets');
  pIndex = Math.max(
    0,
    PLANETS_P.findIndex(P => P.id === curPlanet),
  );
  pTarget = pPos = pIndex;
  pDrag = 0;
  pSwap = 0;
  pScan = false;
  renderPlanets();
  if (elPl) {
    elPl.classList.remove('off');
  }
  if (elHome) {
    elHome.classList.add('off');
  }
}
/** Cierra la pantalla de planetas y vuelve al inicio. */
function closePlanets() {
  setScanOn(false);
  if (elPl) {
    elPl.classList.remove('scanning');
  }
  if (elPl) {
    elPl.classList.add('off');
  }
  setState('home');
  if (elHome) {
    elHome.classList.remove('off');
  }
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initPlanetsScreen() {
  elPl = document.getElementById('planets');
}

export { elPl, openPlanets, planetStep, renderPlanetsScene };

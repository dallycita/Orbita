/**
 * Historia de introducción: un agujero negro errante entra al sistema solar, se traga el Sol y
 * los planetas, y la cámara se acerca a la Tierra hasta la escala del juego.
 * Todo se mide con `introT` (segundos desde el inicio) contra los tiempos `T_*`; las posiciones
 * están en unidades de un sistema de 224 de radio que `SI` escala a la pantalla.
 */
import {
  BONE,
  CX,
  CY,
  H,
  PR,
  S,
  SUN,
  W,
  buzz,
  clamp,
  ctx,
  elHud,
  elPanel,
  reduceMotion,
  rgba,
  stars,
} from './01-pantalla-y-utilidades.js';
import { AC, master, noise, noiseHit, suck, thump } from './02-audio.js';
import { setAppear, setLvl, setState, state } from './06-record-y-estado.js';
import {
  flash,
  holeFlare,
  pulse,
  setFlash,
  setHoleFlare,
  setPulse,
  setShake,
  setT,
  shake,
  sunLevel,
  t,
} from './08-partida-estado.js';

import { PLGL, drawBigPlanet, drawEarth } from './render/planets.js';
import { homeAmbience, introDrone } from './audio/ui-sounds.js';
import { bhDiskK } from './render/black-hole.js';
import {
  openScreen,
  registerScreen,
  setIntroFade,
  setStoryReturn,
  setStorySeen,
  setTutAfterStory,
  storyReturn,
  tutAfterStory,
} from './core/screen.js';
import { setDoblesHechos } from './game/progress.js';
import { ZONES } from './game/zones.js';
import { easeIO } from './core/math.js';
import { MENU_HTML } from './screens/menu.js';
import { rr } from './core/geometry.js';

// Planetas de la intro. r: radio de la órbita y s: tamaño, en unidades de la intro.
const PLANETS = [
  { n: 'Mercurio', r: 38, s: 3.5, c: '#a9a6a0' },
  { n: 'Venus', r: 60, s: 5.5, c: '#e3c27a' },
  { n: 'Tierra', r: 84, s: 6.5, earth: true },
  { n: 'Marte', r: 106, s: 4.5, c: '#c1543a' },
  { n: 'Júpiter', r: 134, s: 11, c: '#d7a86e', bands: true },
  { n: 'Saturno', r: 162, s: 9, c: '#e6cf8f', ring: true },
  { n: 'Urano', r: 186, s: 7, c: '#8fd3e0' },
  { n: 'Neptuno', r: 208, s: 7, c: '#3f6fd6' },
];
// Segundo de la intro en que el agujero negro se traga cada planeta.
const EAT_AT = {
  Mercurio: 6.6,
  Venus: 7.3,
  Marte: 8.0,
  Júpiter: 8.7,
  Saturno: 9.4,
  Urano: 10.1,
  Neptuno: 10.8,
};
// Tiempos de la intro, en segundos.
const INTRO_END = 15.9;
const T_ZOOM = 13.9;
const ZOOM_DUR = 1.8;
const T_ENTER = 2.2;
const T_ARRIVE = 4.1;
const T_SUN_END = 5.8;
const T_DISK_END = 6.2;
const T_EARTH = 6.6;
const SUN_COLS = ['#fff3cf', '#ffd36b', '#ff9a3d', '#ff5a1f'];
let introT = 0;
let ip = [];
let iparts = [];
let SI = 1;
let cues = {};
/**
 * Reinicia el reloj, las partículas y los planetas de la intro.
 */
function introSetup() {
  introT = 0;
  iparts = [];
  cues = {};
  ip = PLANETS.map((p, i) =>
    Object.assign({}, p, {
      a: i * 2.1 + 0.4,
      eatAt: p.earth ? null : EAT_AT[p.n],
      done: false,
      ph: 0,
      rr: p.r,
      sounded: false,
    }),
  );
}
// true solo la primera vez que se pide cada señal `k`, para disparar sonidos una vez.
const once = k => (cues[k] ? false : (cues[k] = true));
/**
 * Posición del agujero negro: llega desde afuera por una curva de Bézier y se instala donde
 * estaba el Sol.
 *
 * @returns {{x: number, y: number}} Posición relativa al centro, en unidades de la intro.
 */
function bhPos() {
  if (introT < T_ARRIVE) {
    const u = easeIO(clamp((introT - T_ENTER) / (T_ARRIVE - T_ENTER), 0, 1));
    const a = (1 - u) * (1 - u),
      b = 2 * (1 - u) * u,
      c = u * u;
    return { x: a * 320 + b * 240 + c * 42, y: a * -360 + b * 40 + c * -14 };
  }
  const u = easeIO(clamp((introT - T_ARRIVE) / (T_SUN_END - T_ARRIVE), 0, 1));
  return { x: 42 * (1 - u), y: -14 * (1 - u) };
}
// El agujero negro crece al alimentarse; diskK y sunK son el avance (de 0 a 1) del disco y de la
// destrucción del Sol.
const bhRadius = () => 8 + 12 * clamp((introT - T_ARRIVE) / (T_DISK_END - T_ARRIVE), 0, 1);
const diskK = () => clamp((introT - 4.8) / (T_DISK_END - 4.8), 0, 1);
const sunK = () => clamp((introT - T_ARRIVE) / (T_SUN_END - T_ARRIVE), 0, 1);

/**
 * Empieza la historia de introducción desde el principio.
 */
function startIntro() {
  homeAmbience(false);
  setState('intro');
  introSetup();
  elPanel.classList.add('hide');
  elHud.style.opacity = 0;
  introDrone(true);
}
// Acercamiento final de la cámara: introZoomK es su avance (de 0 a 1) y zoomZ el aumento que deja
// la escena a la escala del juego. EARTH_W es la velocidad angular de la Tierra en la intro: con
// la tercera ley de Kepler, proporcional a r^-1,5 respecto de una órbita de 60.
const introZoomK = () => easeIO(clamp((introT - T_ZOOM) / ZOOM_DUR, 0, 1));
let EARTH_W;
const holeGameR = () => Math.max(rr(sunLevel), SUN) * S;
const zoomZ = () => holeGameR() / (20 * SI);
const earthEndR = () => (rr(0) * S) / (zoomZ() * SI);
const zoomF = () => 1 + (zoomZ() - 1) * introZoomK();
/**
 * Termina la intro, la marca como vista y vuelve a donde se abrió (inicio o niveles) o, la
 * primera vez, deja el panel listo para jugar el nivel 1.
 *
 * @param {boolean} skipped true si se saltó; el juego aparece con un fundido más corto.
 */
function endIntro(skipped) {
  setStorySeen(true);
  try {
    localStorage.setItem('orbita_p1_historia', '1');
  } catch (e) {}
  introDrone(false);
  setAppear(0);
  setIntroFade(skipped ? 0.6 : 0);
  if (storyReturn && !tutAfterStory) {
    const r = storyReturn;
    setStoryReturn(null);
    if (r === 'levels') {
      openScreen('levels');
    } else {
      openScreen('home');
    }
    return;
  }
  setStoryReturn(null);
  setTutAfterStory(false);
  setLvl(0);
  setState('menu');
  elPanel.innerHTML = MENU_HTML();
  elPanel.classList.add('top');
  elPanel.classList.remove('hide');
}
/**
 * Sonido de un planeta tragado: un tono que cae con ruido sordo.
 */
function eatSound() {
  if (!AC) {
    return;
  }
  try {
    const t0 = AC.currentTime,
      o = AC.createOscillator(),
      g = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(320, t0);
    o.frequency.exponentialRampToValueAtTime(45, t0 + 1.2);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + 1.35);
    noiseHit(t0, 1.1, 'lowpass', 2200, 0.3, master, 80);
  } catch (e) {}
}

/**
 * Avanza la intro: dispara los sonidos de cada momento, deshace el Sol, tira de las partículas
 * hacia el agujero negro y mueve los planetas.
 *
 * @param {number} dt Tiempo desde el cuadro anterior, en segundos.
 */
function updateIntro(dt) {
  if (state === 'intro') {
    introT += dt;
  }
  setT(t + dt);
  setFlash(Math.max(0, flash - dt * 2.2));
  setHoleFlare(Math.max(0, holeFlare - dt * 1.4));
  setPulse(Math.max(0, pulse - dt * 3.5));
  setShake(Math.max(0, shake - dt * 25));
  SI = Math.max(0.4, Math.min(W / 2 / 224, (CY - 80) / 224));
  if (introT >= T_ENTER && once('enter')) {
    noise(1.9, 80, 700, 0.3, 'lowpass');
    buzz([10, 60, 10, 60]);
  }
  if (introT >= T_ARRIVE && once('arrive')) {
    suck();
    setShake(reduceMotion ? 0 : 6);
    buzz([30, 30, 30, 30, 60]);
  }
  if (introT >= T_SUN_END && once('disk')) {
    setHoleFlare(1);
    setPulse(1);
    setFlash(0.5);
    thump();
    noise(0.7, 5000, 120, 0.45, 'lowpass');
    buzz(50);
  }
  const b = bhPos(),
    sk = sunK(),
    holeR = bhRadius();
  // El Sol se deshace en una espiral de fuego alrededor del agujero negro.
  if (state === 'intro' && sk > 0 && sk < 1) {
    const sR = 20 * Math.pow(1 - sk, 0.7),
      sx = b.x * sk * 0.5,
      sy = b.y * sk * 0.5;
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2,
        px = sx + Math.cos(a) * sR,
        py = sy + Math.sin(a) * sR;
      const dx = px - b.x,
        dy = py - b.y,
        l = Math.hypot(dx, dy) || 1,
        v = 90 + Math.random() * 80;
      iparts.push({
        x: px,
        y: py,
        vx: (-dy / l) * v,
        vy: (dx / l) * v,
        life: 1.2 + Math.random(),
        col: SUN_COLS[i % 4],
        s: 1.5 + Math.random() * 2.5,
      });
    }
  }
  for (const p of ip) {
    if (p.done) {
      continue;
    }
    const w = 0.9 * Math.pow(60 / p.r, 1.5);
    if (p.eatAt != null && introT >= p.eatAt) {
      if (!p.sounded) {
        p.sounded = true;
        eatSound();
        buzz(20);
      }
      p.ph = Math.min(1, (introT - p.eatAt) / 1.3);
      p.rr = p.r + (holeR * 0.85 - p.r) * Math.pow(p.ph, 2.2);
      p.a += (w + 1.2 + 9 * p.ph * p.ph) * dt;
      if (Math.random() < 0.25 + p.ph) {
        const ex = Math.cos(p.a) * p.rr,
          ey = Math.sin(p.a) * p.rr,
          v = 40 + Math.random() * 60;
        iparts.push({
          x: ex,
          y: ey,
          vx: -Math.sin(p.a) * v,
          vy: Math.cos(p.a) * v,
          life: 0.8 + Math.random() * 0.5,
          col: p.c,
          s: 1.5 + Math.random() * 2,
        });
      }
      if (p.ph >= 1) {
        p.done = true;
        setHoleFlare(Math.max(holeFlare, 0.7));
        setPulse(1);
        thump();
      }
    } else {
      // La Tierra llega arriba justo cuando aparece "Escapa".
      p.a = p.earth ? -Math.PI / 2 + EARTH_W * Math.min(0, introT - T_ZOOM) : p.a + w * dt;
      if (p.earth && introT > T_EARTH) {
        const k = easeIO(Math.min((introT - T_EARTH) / 6, 1));
        p.rr = p.r - (p.r - earthEndR()) * k;
      }
    }
  }
  const pull = introT >= T_ARRIVE ? 260 : 0;
  for (const q of iparts) {
    const dx = q.x - b.x,
      dy = q.y - b.y,
      l = Math.hypot(dx, dy) || 1;
    q.vx -= (dx / l) * pull * dt;
    q.vy -= (dy / l) * pull * dt;
    q.vx *= Math.pow(0.6, dt);
    q.vy *= Math.pow(0.6, dt);
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.life -= dt * (l < holeR ? 4 : 0.6);
  }
  iparts = iparts.filter(q => q.life > 0);
  if (state === 'intro' && introT > INTRO_END) {
    endIntro(false);
  }
}

// Id de cada planeta en el juego, para dibujarlo con su imagen.
const INTRO_ID = {
  Mercurio: 'mercurio',
  Venus: 'venus',
  Marte: 'marte',
  Júpiter: 'jupiter',
  Saturno: 'saturno',
  Urano: 'urano',
  Neptuno: 'neptuno',
};
/**
 * Dibuja un planeta de la intro; al ser tragado se estira hacia el agujero negro y se desvanece.
 *
 * @param {object} p Planeta de la intro.
 * @param {number} x Posición horizontal, en píxeles de pantalla.
 * @param {number} y Posición vertical, en píxeles de pantalla.
 * @param {number} rad Radio, en píxeles de pantalla.
 * @param {number} ph Avance de la caída, de 0 (intacto) a 1 (tragado).
 */
function drawPlanet(p, x, y, rad, ph) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(CY - y, CX - x) - Math.PI / 2);
  if (ph > 0) {
    ctx.translate(0, rad * 1.4 * ph * ph);
    ctx.scale(1 - 0.6 * ph, 1 + 2.8 * ph * ph);
    ctx.globalAlpha = 1 - clamp((ph - 0.82) / 0.18, 0, 1);
  }
  const glId = INTRO_ID[p.n];
  if (p.earth) {
    drawEarth(0, 0, rad);
  } else if (glId && PLGL.ok()) {
    drawBigPlanet(glId, 0, 0, rad, t * 0.3, false, 'below');
  } else {
    if (p.ring) {
      ctx.strokeStyle = p.c;
      ctx.lineWidth = Math.max(1, rad * 0.25);
      ctx.beginPath();
      ctx.ellipse(0, 0, rad * 2, rad * 0.55, 0.35, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    if (p.bands) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(120,70,30,.45)';
      ctx.fillRect(-rad, -rad * 0.35, rad * 2, rad * 0.18);
      ctx.fillRect(-rad, rad * 0.15, rad * 2, rad * 0.22);
      ctx.restore();
    }
    const sh = ctx.createLinearGradient(0, rad, 0, -rad);
    sh.addColorStop(0, 'rgba(10,14,30,0)');
    sh.addColorStop(0.5, 'rgba(10,14,30,.15)');
    sh.addColorStop(1, 'rgba(10,14,30,.75)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    if (p.ring) {
      ctx.strokeStyle = p.c;
      ctx.lineWidth = Math.max(1, rad * 0.25);
      ctx.beginPath();
      ctx.ellipse(0, 0, rad * 2, rad * 0.55, 0.35, 0, Math.PI);
      ctx.stroke();
    }
  }
  if (ph > 0) {
    ctx.globalAlpha = (1 - clamp((ph - 0.82) / 0.18, 0, 1)) * 0.85 * ph * ph;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
/**
 * Texto de la historia que aparece y se desvanece entre dos momentos; se achica si no cabe.
 *
 * @param {string} txt Texto; `\n` separa líneas.
 * @param {number} t0 Inicio, en segundos de la intro.
 * @param {number} t1 Fin, en segundos de la intro.
 * @param {number} size Tamaño de letra, en píxeles.
 * @param {number} y Centro vertical, en píxeles de pantalla.
 */
function caption(txt, t0, t1, size, y) {
  if (introT < t0 || introT > t1) {
    return;
  }
  const a = Math.min(1, (introT - t0) / 0.4, (t1 - introT) / 0.4),
    lines = txt.split('\n');
  ctx.globalAlpha = a;
  ctx.fillStyle = BONE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fs = size;
  ctx.font = '500 ' + fs + 'px Unbounded, system-ui, sans-serif';
  for (const l of lines) {
    const m = ctx.measureText ? ctx.measureText(l) : null,
      w = (m && m.width) || 0;
    if (w > W - 40) {
      fs = Math.min(fs, (size * (W - 40)) / w);
    }
  }
  ctx.font = '500 ' + fs + 'px Unbounded, system-ui, sans-serif';
  lines.forEach((l, i) => ctx.fillText(l, CX, y + (i - (lines.length - 1) / 2) * fs * 1.4));
  ctx.globalAlpha = 1;
}
/**
 * Dibuja un cuadro de la intro: órbitas, Sol, agujero negro, planetas, partículas y textos.
 */
function renderIntro() {
  const z = ZONES[0],
    b = bhPos(),
    sk = sunK(),
    dk = diskK();
  ctx.save();
  ctx.fillStyle = z.bg;
  ctx.fillRect(0, 0, W, H);
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }
  const sr = Math.max(W, H) * 0.62;
  for (const s of stars) {
    const zw = introZoomK(),
      warp = Math.sin(Math.PI * zw);
    const a = s.a + t * 0.015,
      rad = s.r * sr * (1 + zw * 0.6),
      x = CX + Math.cos(a) * rad,
      y = CY + Math.sin(a) * rad;
    if (warp > 0.05) {
      const r2 = rad * (1 - 0.12 * warp);
      ctx.globalAlpha = 0.35 * warp;
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
  ctx.strokeStyle = BONE;
  ctx.lineWidth = 1;
  for (const p of ip) {
    if (p.done) {
      continue;
    }
    if (p.earth) {
      ctx.globalAlpha = 0.18 + (0.82 - 0.18) * introZoomK();
      ctx.lineWidth = 1 + introZoomK();
      ctx.beginPath();
      ctx.arc(CX, CY, p.rr * SI * zoomF(), 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      continue;
    }
    ctx.globalAlpha =
      0.09 * (p.eatAt != null && introT >= p.eatAt ? 1 - p.ph : 1) * (1 - introZoomK());
    ctx.beginPath();
    ctx.arc(CX, CY, p.r * SI, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // El Sol: intacto, y luego estirado hacia el agujero negro.
  if (sk < 1) {
    const sR = 20 * Math.pow(1 - sk, 0.7) * SI,
      sx = CX + b.x * sk * 0.5 * SI,
      sy = CY + b.y * sk * 0.5 * SI;
    ctx.save();
    ctx.translate(sx, sy);
    if (sk > 0) {
      ctx.rotate(Math.atan2(CY + b.y * SI - sy, CX + b.x * SI - sx));
      ctx.scale(1 + 1.4 * sk, 1 - 0.45 * sk);
    }
    const g = ctx.createRadialGradient(0, 0, sR * 0.3, 0, 0, sR * 3);
    g.addColorStop(0, 'rgba(255,200,90,.5)');
    g.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, sR * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(0, 0, sR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3cf';
    ctx.beginPath();
    ctx.arc(0, 0, sR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // El agujero negro solo se ve por cómo dobla la luz, hasta que se alimenta y aparece su disco.
  if (introT >= T_ENTER) {
    const zf = zoomF(),
      hx = CX + b.x * SI * zf,
      hy = CY + b.y * SI * zf,
      hR = bhRadius() * SI * zf * (1 + pulse * 0.06);
    if (dk > 0) {
      ctx.globalAlpha = dk;
      const g = ctx.createRadialGradient(hx, hy, hR * 0.9, hx, hy, hR * 2.6);
      g.addColorStop(0, rgba(z.s2, 0.42));
      g.addColorStop(0.35, rgba(z.s2, 0.1));
      g.addColorStop(1, rgba(z.s2, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, hy, hR * 2.6, 0, Math.PI * 2);
      ctx.fill();
      bhDiskK(hx, hy, hR, 0.96, 1.06, 1.6, 0, Math.PI * 2, dk);
    }
    ctx.globalAlpha = 0.18 * (1 - dk);
    ctx.strokeStyle = BONE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hx, hy, hR * 1.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(hx, hy, hR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dk > 0.5 ? z.s1 : BONE;
    ctx.globalAlpha = 0.55 + 0.45 * dk;
    ctx.lineWidth = 1.4 + holeFlare * 6;
    ctx.shadowColor = z.s2;
    ctx.shadowBlur = dk * (16 + holeFlare * 40);
    ctx.beginPath();
    ctx.arc(hx, hy, hR * 1.01, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  const zk2 = introZoomK();
  if (zk2 > 0) {
    const ra = [0.9, 0.47, 0.08, 0.04, 0.02];
    for (let k = 1; k < 5; k++) {
      ctx.globalAlpha = zk2 * ra[k];
      ctx.strokeStyle = BONE;
      ctx.lineWidth = k === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.arc(CX, CY, rr(k) * S, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  for (const p of ip) {
    if (p.done) {
      continue;
    }
    let pa = p.a,
      pr = p.rr * SI,
      ps = Math.max(2, p.s * SI);
    if (p.earth) {
      pr *= zoomF();
      ps = ps + (PR * S * 1.15 - ps) * zk2;
    }
    const x = CX + Math.cos(pa) * pr,
      y = CY + Math.sin(pa) * pr;
    let jx = 0,
      jy = 0;
    if (p.earth && introT > T_EARTH && !reduceMotion) {
      const k = Math.min((introT - T_EARTH) / 6, 1) * (1 - zk2);
      jx = (Math.random() - 0.5) * 2.5 * k;
      jy = (Math.random() - 0.5) * 2.5 * k;
    }
    drawPlanet(p, x + jx, y + jy, ps, p.ph);
    if (p.ph > 0 && p.ph < 0.85) {
      ctx.globalAlpha = 1 - p.ph / 0.85;
      ctx.fillStyle = BONE;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '500 12px Unbounded, system-ui, sans-serif';
      ctx.fillText(
        p.n,
        CX + Math.cos(p.a) * p.r * SI,
        CY + Math.sin(p.a) * p.r * SI - p.s * SI - 14,
      );
      ctx.globalAlpha = 1;
    }
  }
  for (const q of iparts) {
    ctx.globalAlpha = clamp(q.life, 0, 1) * (1 - zk2);
    ctx.fillStyle = q.col;
    ctx.fillRect(CX + q.x * SI - q.s / 2, CY + q.y * SI - q.s / 2, q.s, q.s);
  }
  ctx.globalAlpha = 1;
  const ty = Math.max(70, CY - 236 * SI);
  caption('Nuestro sistema solar.', 0.4, 2.2, 16, ty);
  caption('Un agujero negro errante\nentró al sistema solar.', 2.3, 4.3, 15, ty);
  caption('Se tragó al Sol.', 4.4, 6.1, 16, ty);
  caption('Luego vino por los planetas.', 6.3, 8.0, 15, ty);
  caption('Solo queda la Tierra.', 12.2, 13.7, 16, ty);
  caption('Escapa.', 13.7, 15.0, 30, ty);
  if (state === 'intro' && zk2 === 0) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = BONE;
    ctx.font = '300 12px Unbounded, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Toca para saltar la intro', CX, H - 34);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (flash > 0) {
    ctx.globalAlpha = flash * 0.45;
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initIntro() {
  registerScreen('intro', startIntro);
  introSetup();
  try {
    setDoblesHechos(parseInt(localStorage.getItem('orbita_p1_dobles') || '0', 10) || 0);
  } catch (e) {}
  EARTH_W = 0.9 * Math.pow(60 / 84, 1.5);
}

export { endIntro, renderIntro, startIntro, updateIntro };

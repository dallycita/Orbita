/**
 * Entrada a la pantalla de inicio: un agujero negro enorme dobla la luz, se come rocas y destroza
 * una estrella; luego se aleja hasta su tamaño de juego mientras se forma el logotipo.
 * Incluye la música de misterio de los menús. El reloj de la animación es `homeT`, en segundos.
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
  reduceMotion,
  stars,
} from './01-pantalla-y-utilidades.js';
import { AC, ROOT, master, noiseHit } from './02-audio.js';
import { echoBus } from './03-musica-ritmos.js';
import { sunLevel, t } from './08-partida-estado.js';
import { rr } from './16-partida.js';
import { easeIO } from './23-intro.js';
import { BR0, BR1, SK, bhCore, bhDiskK, drawLogo, setSfl, sfl } from './24-presentacion.js';
import {
  bigSuck,
  gwChirp,
  rockIn,
  showOut,
  showStop,
  uiOut,
  uiTone,
} from './28-sonidos-interfaz.js';
import { drawPlayer } from './29-planetas-hd.js';
import { muted } from './core/settings.js';

/**
 * Enciende o apaga la música de misterio de los menús: un zumbido profundo que respira, notas de
 * cristal flotando y un viento cósmico. Encenderla dos veces no la duplica.
 *
 * @param {boolean} on Verdadero para encenderla (sube en 2,5 s); falso para apagarla (en 0,8 s).
 */
function homeAmbience(on) {
  if (!AC) {
    return;
  }
  try {
    const n = AC.currentTime;
    if (on && !amb) {
      const g = AC.createGain();
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.9, n + 2.5);
      g.connect(master);
      const nodes = [];
      const lp = AC.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 260;
      lp.Q.value = 2;
      lp.connect(g);
      const lfo = AC.createOscillator(),
        lfoG = AC.createGain();
      lfo.frequency.value = 0.07;
      lfoG.gain.value = 160;
      lfo.connect(lfoG);
      lfoG.connect(lp.frequency);
      lfo.start(n);
      nodes.push(lfo);
      for (const [f, ty, gn] of [
        [ROOT / 8, 'sine', 0.32],
        [(ROOT / 8) * 1.498, 'sine', 0.18],
        [(ROOT / 8) * 1.006, 'sawtooth', 0.08],
      ]) {
        const o = AC.createOscillator(),
          og = AC.createGain();
        o.type = ty;
        o.frequency.value = f;
        og.gain.value = gn;
        o.connect(og);
        og.connect(lp);
        o.start(n);
        nodes.push(o);
      }
      const glass = AC.createGain();
      glass.gain.value = 0.018;
      glass.connect(g);
      glass.connect(echoBus());
      for (const [semi, rate] of [
        [12, 0.11],
        [19, 0.07],
        [27, 0.05],
        [24, 0.13],
      ]) {
        const o = AC.createOscillator(),
          og = AC.createGain(),
          tr = AC.createOscillator(),
          trg = AC.createGain();
        o.type = 'sine';
        o.frequency.value = (ROOT / 2) * Math.pow(2, semi / 12);
        og.gain.value = 0.5;
        tr.frequency.value = rate;
        trg.gain.value = 0.5;
        tr.connect(trg);
        trg.connect(og.gain);
        o.connect(og);
        og.connect(glass);
        o.start(n);
        tr.start(n);
        nodes.push(o, tr);
      }
      amb = { g, nodes };
    } else if (!on && amb) {
      const a = amb;
      amb = null;
      a.g.gain.cancelScheduledValues(n);
      a.g.gain.setValueAtTime(Math.max(a.g.gain.value, 0.0001), n);
      a.g.gain.exponentialRampToValueAtTime(0.0001, n + 0.8);
      a.nodes.forEach(o => {
        try {
          o.stop(n + 0.9);
        } catch (e) {}
      });
    }
  } catch (e) {}
}
// ---- La demostración: el agujero negro dobla la luz, se come rocas y destroza una estrella ----
// HOME_BIG: segundo en que el agujero empieza a alejarse; HOME_IN: segundo en que llega a su
// tamaño de juego (fin de la entrada).
const HOME_BIG = 6.4,
  HOME_IN = 8.0;
let logoT0 = -99;
let hsRipple = 0,
  camZoom = 1;
let homeT = HOME_IN,
  amb = null,
  hsFlare = 0,
  hsBoost = 0,
  hsShake = 0,
  hsJet = 0,
  hsEvents = {};
const ROCKS = [
  [0.5, 0.3, 2.1, 1],
  [1.1, 2.4, 1.9, -1],
  [1.6, 4.1, 2.2, 1],
  [2.0, 5.3, 1.8, 1],
  [3.7, 1.2, 2.0, -1],
  [4.1, 3.4, 1.9, 1],
]; // [nace (s), ángulo (rad), duración de la caída (s), sentido del giro]
// La estrella destrozada por la marea (evento de disrupción de marea, TDE): empieza (s), dura (s)
// y ángulo inicial (rad).
const TDE = { t0: 2.3, dur: 2.7, a0: -0.25 };
/**
 * Toca un golpe grave que baja de tono, por la salida de sonido de la demostración.
 *
 * @param {number} f0 Frecuencia inicial, en Hz.
 * @param {number} f1 Frecuencia final, en Hz.
 * @param {number} dur Duración, en segundos.
 * @param {number} gain Volumen máximo, de 0 a 1.
 */
function hsLow(f0, f1, dur, gain) {
  const n = AC.currentTime,
    o = AC.createOscillator(),
    g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, n);
  o.frequency.exponentialRampToValueAtTime(f1, n + dur);
  g.gain.setValueAtTime(0.0001, n);
  g.gain.exponentialRampToValueAtTime(gain, n + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
  o.connect(g);
  g.connect(showOut());
  o.start(n);
  o.stop(n + dur + 0.05);
}
/**
 * Sonido de un momento de la demostración.
 *
 * @param {string} kind 'rock' (una roca cae), 'tear' (la estrella se estira) o 'feed' (se la
 *   traga).
 */
function hsSound(kind) {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime;
    if (kind === 'rock') {
      hsLow(140, 42, 0.5, 0.35);
      uiTone(ROOT * Math.pow(2, [0, 3, 7, 10][Math.floor(Math.random() * 4)] / 12), n, 1.2, 0.05);
    } else if (kind === 'tear') {
      // la estrella se estira: un gemido que cae
      const o = AC.createOscillator(),
        g = AC.createGain(),
        lp = AC.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(330, n);
      o.frequency.exponentialRampToValueAtTime(55, n + 2.4);
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1800, n);
      lp.frequency.exponentialRampToValueAtTime(200, n + 2.4);
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(0.12, n + 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, n + 2.6);
      o.connect(lp);
      lp.connect(g);
      g.connect(showOut());
      o.start(n);
      o.stop(n + 2.7);
      const o2 = AC.createOscillator(),
        g2 = AC.createGain();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(660, n);
      o2.frequency.exponentialRampToValueAtTime(110, n + 2.4);
      g2.gain.setValueAtTime(0.0001, n);
      g2.gain.exponentialRampToValueAtTime(0.05, n + 0.8);
      g2.gain.exponentialRampToValueAtTime(0.0001, n + 2.5);
      o2.connect(g2);
      g2.connect(showOut());
      o2.start(n);
      o2.stop(n + 2.6);
    } else if (kind === 'feed') {
      // se la traga: golpe, destello y chorros
      hsLow(90, 30, 1.6, 0.9);
      noiseHit(n, 0.7, 'lowpass', 3000, 0.35, showOut(), 60);
      for (const [f0, f1, gn] of [
        [220, 1760, 0.06],
        [330, 2640, 0.03],
      ]) {
        const o = AC.createOscillator(),
          g = AC.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f0, n + 0.1);
        o.frequency.exponentialRampToValueAtTime(f1, n + 1.3);
        g.gain.setValueAtTime(0.0001, n + 0.1);
        g.gain.exponentialRampToValueAtTime(gn, n + 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, n + 1.5);
        o.connect(g);
        g.connect(uiOut());
        o.start(n + 0.1);
        o.stop(n + 1.6);
      }
      uiTone(ROOT / 2, n, 3, 0.08);
      uiTone((ROOT / 2) * Math.pow(2, 7 / 12), n + 0.05, 2.8, 0.06);
      uiTone(ROOT, n + 0.1, 2.6, 0.05);
    }
  } catch (e) {}
}
/**
 * Toca una nota de cristal (con un armónico breve) con eco.
 *
 * @param {number} f Frecuencia, en Hz.
 * @param {number} t0 Momento de inicio, en segundos del reloj de audio.
 * @param {number} dur Duración, en segundos.
 * @param {number} gain Volumen máximo, de 0 a 1.
 */
function glassNote(f, t0, dur, gain) {
  const o = AC.createOscillator(),
    o2 = AC.createOscillator(),
    g = AC.createGain(),
    g2 = AC.createGain();
  o.type = 'sine';
  o.frequency.value = f;
  o2.type = 'sine';
  o2.frequency.value = f * 2.01;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g2.gain.setValueAtTime(0.0001, t0);
  g2.gain.exponentialRampToValueAtTime(gain * 0.25, t0 + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.4);
  o.connect(g);
  o2.connect(g2);
  g2.connect(g);
  g.connect(uiOut());
  g.connect(echoBus());
  o.start(t0);
  o2.start(t0);
  o.stop(t0 + dur + 0.05);
  o2.stop(t0 + dur + 0.05);
}
/**
 * Sonidos del logotipo al formarse, en la misma tonalidad de la música de misterio: un respiro
 * grave cuando aparece la Ó, una nota por letra y la Tierra cayendo en el acento. Se llama cada
 * cuadro; `hsEvents` evita repetir cada sonido.
 */
function logoSounds() {
  if (!(logoT0 > 0) || !AC || muted) {
    return;
  }
  const lp = homeT - logoT0,
    n = AC.currentTime;
  try {
    if (lp >= 0 && !hsEvents.Lsw) {
      hsEvents.Lsw = 1; // la Ó aparece: un respiro grave que sube y se abre
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(ROOT / 4, n);
      o.frequency.exponentialRampToValueAtTime(ROOT / 2, n + 1.2);
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(0.12, n + 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, n + 1.8);
      o.connect(g);
      g.connect(uiOut());
      o.start(n);
      o.stop(n + 1.9);
    }
    [12, 15, 19, 22, 24].forEach((sm, i) => {
      if (lp >= 0.7 + i * 0.16 && !hsEvents['L' + i]) {
        hsEvents['L' + i] = 1;
        glassNote((ROOT / 2) * Math.pow(2, sm / 12), n, 1.8, 0.045);
      }
    });
    if (lp >= 1.6 && !hsEvents.Lacc) {
      hsEvents.Lacc = 1;
      glassNote(ROOT * Math.pow(2, 7 / 12), n, 2.6, 0.05);
      glassNote(ROOT * 2, n + 0.12, 3, 0.03);
    }
  } catch (e) {}
}
/**
 * Avanza un cuadro la demostración: lanza a su hora cada sonido y golpe (rocas, estrella, onda
 * gravitacional) una sola vez, y apaga los destellos y temblores.
 *
 * @param {number} dt Tiempo del cuadro, en segundos.
 */
function updateHomeShow(dt) {
  hsFlare = Math.max(0, hsFlare - dt * 1.6);
  hsBoost = Math.max(0, hsBoost - dt * 0.5);
  hsShake = Math.max(0, hsShake - dt * 20);
  hsJet = Math.max(0, hsJet - dt * 0.75);
  setSfl(Math.max(sfl - dt * 1.3, hsFlare));
  ROCKS.forEach(([tb, a0, d], i) => {
    if (homeT >= tb && !hsEvents['s' + i]) {
      hsEvents['s' + i] = 1;
      rockIn(d, clamp(Math.cos(a0), -1, 1) * 0.85);
    }
  });
  if (homeT >= TDE.t0 + TDE.dur - 1.4 && !hsEvents.suck) {
    hsEvents.suck = 1;
    bigSuck(1.4);
  }
  if (homeT >= TDE.t0 + TDE.dur - 0.75 && !hsEvents.chirp) {
    hsEvents.chirp = 1;
    gwChirp();
  }
  if (hsEvents.feed) {
    hsRipple += dt;
  }
  if (homeT >= HOME_BIG && !hsEvents.bedOff) {
    hsEvents.bedOff = 1;
    showStop(1.5);
  }
  logoSounds();
  ROCKS.forEach(([tb, , d], i) => {
    if (homeT >= tb + d && !hsEvents['r' + i]) {
      hsEvents['r' + i] = 1;
      hsFlare = Math.max(hsFlare, 0.55);
      hsShake = Math.max(hsShake, 3);
      buzz(18);
      hsSound('rock');
    }
  });
  if (homeT >= TDE.t0 + 0.5 && !hsEvents.tear) {
    hsEvents.tear = 1;
    hsSound('tear');
    buzz([10, 40, 10, 40, 10, 40]);
  }
  if (homeT >= TDE.t0 + TDE.dur && !hsEvents.feed) {
    hsEvents.feed = 1;
    hsFlare = 1;
    hsBoost = 1;
    hsJet = 1;
    hsShake = reduceMotion ? 0 : 14;
    buzz([60, 40, 140]);
    hsSound('feed');
  }
}
/**
 * Punto de una trayectoria en espiral hacia el horizonte, cada vez más rápida al acercarse.
 *
 * @param {number} cx Centro horizontal del agujero, en píxeles de pantalla.
 * @param {number} cy Centro vertical del agujero, en píxeles de pantalla.
 * @param {number} R Radio del horizonte, en píxeles de pantalla.
 * @param {number} r0 Radio inicial, en píxeles de pantalla.
 * @param {number} a0 Ángulo inicial, en radianes.
 * @param {number} u Avance de la caída, de 0 a 1.
 * @param {number} dir Sentido del giro (1 o -1).
 * @returns {number[]} [x, y, r]: posición y distancia al centro, en píxeles de pantalla.
 */
function spiralPos(cx, cy, R, r0, a0, u, dir) {
  const r = r0 + (R * 0.92 - r0) * Math.pow(u, 1.7),
    a = a0 + dir * (u * 1.6 + u * u * u * 4.2);
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.82, r];
}
/**
 * Dibuja un cuadro de la entrada: el agujero negro grande (lente de estrellas, chorros, rocas en
 * espiral y la estrella destrozada) que se aleja hasta su lugar de juego.
 */
function renderHomeIntro() {
  const T = homeT,
    p = easeIO(clamp((T - HOME_BIG) / (HOME_IN - HOME_BIG), 0, 1));
  ctx.save();
  ctx.fillStyle = '#05060c';
  ctx.fillRect(0, 0, W, H);
  if (hsShake > 0) {
    ctx.translate((Math.random() - 0.5) * hsShake, (Math.random() - 0.5) * hsShake);
  }
  const Rbig = Math.min(W, H) * 0.24 * (1 + 0.04 * clamp(T / HOME_BIG, 0, 1)),
    Rg = Math.max(rr(sunLevel), SUN) * S;
  const R = Rbig + (Rg - Rbig) * p,
    cx = W / 2 + (CX - W / 2) * p,
    cy = H * 0.47 + (CY - H * 0.47) * p;
  // La luz de las estrellas se dobla alrededor del agujero negro: cada estrella se aparta del
  // centro como RE²/d (RE hace de radio de Einstein) y cerca del anillo se estira en un arco.
  const sr = Math.max(W, H) * 0.62,
    RE = R * 1.7;
  for (const s of stars) {
    const a = s.a + t * 0.015;
    let x = CX + Math.cos(a) * s.r * sr,
      y = CY + Math.sin(a) * s.r * sr;
    const dx = x - cx,
      dy = y - cy,
      d = Math.hypot(dx, dy) || 1;
    if (d < R * 1.02) {
      continue;
    }
    const dl = d + ((RE * RE) / d) * 0.45 * (1 - p);
    x = cx + (dx / d) * dl;
    y = cy + (dy / d) * dl;
    const tang = clamp((RE * 1.3) / d, 0, 1) * (1 - p);
    ctx.globalAlpha = 0.14 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.3 + s.tw)) + 0.3 * tang;
    ctx.fillStyle = BONE;
    if (tang > 0.25) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(dy, dx) + Math.PI / 2);
      ctx.fillRect(-s.s * (1 + tang * 3), -s.s * 0.4, s.s * 2 * (1 + tang * 3), s.s * 0.8);
      ctx.restore();
    } else {
      ctx.fillRect(x, y, s.s * 0.8, s.s * 0.8);
    }
  }
  ctx.globalAlpha = 1;
  const k = SK + (0.96 - SK) * p,
    f0 = BR0 + (1.06 - BR0) * p,
    f1 = BR1 + (1.6 - BR1) * p;
  const g = ctx.createRadialGradient(cx, cy, R, cx, cy, R * (4.5 + hsBoost * 2));
  g.addColorStop(0, 'rgba(255,100,28,' + (0.22 + hsBoost * 0.35) + ')');
  g.addColorStop(1, 'rgba(255,100,28,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-20, -20, W + 40, H + 40);
  if (p > 0) {
    const ra = [0.9, 0.47, 0.08, 0.04, 0.02];
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = p * ra[i];
      ctx.strokeStyle = BONE;
      ctx.lineWidth = i === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.arc(CX, CY, rr(i) * S, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  bhDiskK(cx, cy, R, k, f0, f1, Math.PI - 0.03, Math.PI * 2 + 0.03, 1);
  // chorros de energía por los polos al alimentarse
  if (hsJet > 0) {
    for (const sgn of [-1, 1]) {
      const len = R * (3.2 + 2.5 * (1 - hsJet)),
        w0 = R * 0.08,
        w1 = R * 0.32,
        y1 = cy + sgn * len;
      const jg = ctx.createLinearGradient(cx, cy, cx, y1);
      jg.addColorStop(0, 'rgba(232,240,255,' + 0.85 * hsJet + ')');
      jg.addColorStop(1, 'rgba(143,208,255,0)');
      ctx.fillStyle = jg;
      ctx.beginPath();
      ctx.moveTo(cx - w0, cy);
      ctx.lineTo(cx - w1 * (0.8 + 0.2 * Math.sin(t * 40)), y1);
      ctx.lineTo(cx + w1, y1);
      ctx.lineTo(cx + w0, cy);
      ctx.closePath();
      ctx.fill();
    }
  }
  bhCore(cx, cy, R, 1 - 0.6 * p);
  bhDiskK(cx, cy, R, k, f0, f1, 0, Math.PI, 1);
  if (hsRipple > 0 && hsRipple < 2.2) {
    for (let i = 0; i < 4; i++) {
      const q = hsRipple - i * 0.18;
      if (q <= 0) {
        continue;
      }
      const rr2 = R * (1.4 + q * 5),
        al = Math.max(0, 0.5 * (1 - q / 2.2)) * (1 - i * 0.2);
      ctx.globalAlpha = al;
      ctx.strokeStyle = '#e8f0ff';
      ctx.lineWidth = 2 * (1 - q / 2.2) + 0.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rr2, rr2 * (0.55 + 0.45 * p), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (hsBoost > 0) {
    ctx.globalAlpha = hsBoost * 0.5;
    ctx.strokeStyle = '#fff3cf';
    ctx.lineWidth = R * 0.12 * hsBoost;
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 1.5, R * 1.5 * k, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // rocas que caen en espiral y se estiran
  if (p === 0) {
    const r0 = Math.max(W, H) * 0.62;
    ROCKS.forEach(([tb, a0, d, dir]) => {
      const u = (T - tb) / d;
      if (u <= 0 || u >= 1) {
        return;
      }
      const pts = [];
      for (let j = 0; j < 7; j++) {
        const uu = Math.max(0, u - j * 0.035 * (0.4 + u));
        pts.push(spiralPos(cx, cy, R, r0, a0, uu, dir));
      }
      ctx.lineCap = 'round';
      for (let j = pts.length - 1; j > 0; j--) {
        ctx.globalAlpha = (1 - j / pts.length) * 0.9;
        ctx.strokeStyle = j < 2 ? '#d8c6b0' : '#b49a7e';
        ctx.lineWidth = Math.max(1, (5 - j * 0.6) * (1 - u * 0.5));
        ctx.beginPath();
        ctx.moveTo(pts[j - 1][0], pts[j - 1][1]);
        ctx.lineTo(pts[j][0], pts[j][1]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ece6d8';
      ctx.beginPath();
      ctx.arc(pts[0][0], pts[0][1], 3.5 * (1 - u * 0.6), 0, Math.PI * 2);
      ctx.fill();
    });
    // la estrella que es destrozada: se estira en un río de fuego que se enrolla alrededor del
    // disco
    const u = (T - TDE.t0) / TDE.dur;
    if (u > 0 && u < 1) {
      const tail = Math.min(0.6, u * 0.9),
        N = 40;
      ctx.lineCap = 'round';
      for (let j = 0; j < N; j++) {
        const ua = Math.max(0, u - (tail * j) / N),
          ub = Math.max(0, u - (tail * (j + 1)) / N);
        const A = spiralPos(cx, cy, R, r0 * 0.95, TDE.a0, ua, 1),
          B = spiralPos(cx, cy, R, r0 * 0.95, TDE.a0, ub, 1);
        ctx.globalAlpha = (1 - j / N) * 0.95;
        ctx.strokeStyle = j < 6 ? '#fff6e0' : j < 18 ? '#ffd36b' : '#ff7a2a';
        ctx.lineWidth = Math.max(1, R * 0.12 * (1 - j / N) * (u < 0.3 ? 0.6 + u : 1));
        ctx.beginPath();
        ctx.moveTo(A[0], A[1]);
        ctx.lineTo(B[0], B[1]);
        ctx.stroke();
      }
      const H0 = spiralPos(cx, cy, R, r0 * 0.95, TDE.a0, u, 1),
        hr = R * 0.22 * (1 - u * 0.7);
      const sg = ctx.createRadialGradient(H0[0], H0[1], 0, H0[0], H0[1], hr * 3);
      sg.addColorStop(0, 'rgba(255,246,224,.9)');
      sg.addColorStop(1, 'rgba(255,200,90,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(H0[0], H0[1], hr * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath();
      ctx.ellipse(
        H0[0],
        H0[1],
        hr * (1 + u * 1.5),
        hr * (1 - u * 0.5),
        Math.atan2(H0[1] - cy, H0[0] - cx) + Math.PI / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  if (p > 0.4) {
    ctx.globalAlpha = (p - 0.4) / 0.6;
    drawPlayer(CX, CY - rr(0) * S, PR * S * 1.15);
    ctx.globalAlpha = 1;
  }
  if (hsFlare > 0.6) {
    ctx.globalAlpha = (hsFlare - 0.6) * 0.6;
    ctx.fillStyle = '#fff6e0';
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.globalAlpha = 1;
  }
  if (T < 0.9) {
    ctx.globalAlpha = 1 - T / 0.9;
    ctx.fillStyle = '#05060c';
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (logoT0 > 0 && T >= logoT0) {
    drawLogo(W / 2, Math.max(120, H * 0.24), Math.min(46, W * 0.1), T - logoT0);
  }
}

/**
 * Cambia `camZoom` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setCamZoom(value) {
  camZoom = value;
  return value;
}

/**
 * Cambia `homeT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHomeT(value) {
  homeT = value;
  return value;
}

/**
 * Cambia `hsBoost` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHsBoost(value) {
  hsBoost = value;
  return value;
}

/**
 * Cambia `hsEvents` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHsEvents(value) {
  hsEvents = value;
  return value;
}

/**
 * Cambia `hsFlare` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHsFlare(value) {
  hsFlare = value;
  return value;
}

/**
 * Cambia `hsJet` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHsJet(value) {
  hsJet = value;
  return value;
}

/**
 * Cambia `hsRipple` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHsRipple(value) {
  hsRipple = value;
  return value;
}

/**
 * Cambia `hsShake` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setHsShake(value) {
  hsShake = value;
  return value;
}

/**
 * Cambia `logoT0` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLogoT0(value) {
  logoT0 = value;
  return value;
}

export {
  HOME_BIG,
  HOME_IN,
  camZoom,
  homeAmbience,
  homeT,
  hsBoost,
  hsEvents,
  hsFlare,
  hsJet,
  hsRipple,
  hsShake,
  logoSounds,
  logoT0,
  renderHomeIntro,
  updateHomeShow,
};

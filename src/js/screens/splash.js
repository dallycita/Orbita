/**
 * Presentación de marca (10 s): el agujero negro se encoge hasta ser la Ó del logotipo de Órbita y
 * la Tierra escapa para ser su acento. También da el dibujo del agujero negro de la marca
 * (`bhDiskK`, `bhCore`, `brandHole`, `drawLogo`), que usan otras pantallas, con versión WebGL
 * (`BHGL`) y respaldo 2D con degradados cónicos.
 */
import {
  BONE,
  CX,
  CY,
  H,
  W,
  buzz,
  clamp,
  ctx,
  elHud,
  elPanel,
  stars,
} from '../core/display.js';
import { AC, NOISE, ROOT, master, noiseHit } from '../audio/engine.js';
import { setState, state } from '../core/state.js';
import { flash, setFlash, setT, t } from '../core/run-state.js';
import { afterSplash } from './levels.js';
import {
  BR1,
  LOGO,
  bhCore,
  bhDisk,
  drawAccent,
  easeIO2,
  setSfl,
  setSplashFont,
  sfl,
  splashFont,
} from '../render/black-hole.js';

// SK: aplastamiento del disco visto a 37°; BR0 y BR1: radios interior y exterior del disco, en
// radios del horizonte.
const SPLASH_END = 10;
let splashT = 0;
let splashBus = null;
let sflared = false;

/**
 * Programa todo el sonido de la presentación de una vez: un rumor que crece, las letras como
 * notas, la Tierra que cae y un golpe final. Va por `splashBus` para poder apagarlo al saltarla.
 */
function splashSounds() {
  if (!AC) {
    return;
  }
  try {
    const n = AC.currentTime + 0.05;
    splashBus = AC.createGain();
    splashBus.gain.value = 0.9;
    splashBus.connect(master);
    const osc = (type, f0, f1, t0, dur, peak, att) => {
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t0);
      if (f1) {
        o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      }
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + att);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(splashBus);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
      return o;
    };
    osc('sine', 38, 58, n, 6, 0.35, 2.5); // rumor grave
    // Barrido de ruido que sube.
    const src = AC.createBufferSource();
    src.buffer = NOISE;
    const f = AC.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1.1;
    f.frequency.setValueAtTime(200, n + 3);
    f.frequency.exponentialRampToValueAtTime(6000, n + 5.5);
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, n + 3);
    g.gain.exponentialRampToValueAtTime(0.28, n + 5.45);
    g.gain.exponentialRampToValueAtTime(0.0001, n + 5.6);
    src.connect(f);
    f.connect(g);
    g.connect(splashBus);
    src.start(n + 3);
    src.stop(n + 5.7);
    // Una nota por letra (escala pentatónica menor).
    [0, 3, 5, 7, 10].forEach((s, i) =>
      osc('triangle', ROOT * Math.pow(2, s / 12), 0, n + 4 + i * 0.22, 0.7, 0.12, 0.005),
    );
    // la Tierra cae en el acento
    osc('sine', ROOT * 2 * Math.pow(2, 7 / 12), 0, n + 5.3, 1.4, 0.1, 0.004);
    osc('sine', 72, 38, n + 5.5, 1.6, 0.9, 0.005); // golpe
    noiseHit(n + 5.5, 1.6, 'highpass', 3000, 0.35, splashBus);
    // Acorde final: cada nota con dos osciladores desafinados para que suene ancho.
    for (const s of [0, 3, 7, 12]) {
      for (const det of [-7, 7]) {
        const o = AC.createOscillator(),
          gg = AC.createGain(),
          lp = AC.createBiquadFilter();
        o.type = 'sawtooth';
        o.frequency.value = (ROOT / 2) * Math.pow(2, s / 12);
        o.detune.value = det;
        lp.type = 'lowpass';
        lp.frequency.value = 1300;
        gg.gain.setValueAtTime(0.0001, n + 5.5);
        gg.gain.exponentialRampToValueAtTime(0.035, n + 5.6);
        gg.gain.exponentialRampToValueAtTime(0.0001, n + 9.5);
        o.connect(lp);
        lp.connect(gg);
        gg.connect(splashBus);
        o.start(n + 5.5);
        o.stop(n + 9.6);
      }
    }
    // Campanas.
    osc('sine', ROOT * 4, 0, n + 5.55, 2.8, 0.07, 0.005);
    osc('sine', ROOT * 4 * Math.pow(2, 7 / 12), 0, n + 5.6, 2.6, 0.05, 0.005);
  } catch (e) {}
}
/** Empieza la presentación: oculta el panel y el HUD y lanza su sonido. */
function startSplash() {
  setState('splash');
  splashT = 0;
  sflared = false;
  setSfl(0);
  elPanel.classList.add('hide');
  elHud.style.opacity = 0;
  splashSounds();
}
/** Salta la presentación: apaga su sonido en 0,25 s y pasa a lo que sigue. */
function skipSplash() {
  if (splashBus && AC) {
    try {
      const n = AC.currentTime;
      splashBus.gain.cancelScheduledValues(n);
      splashBus.gain.setValueAtTime(splashBus.gain.value, n);
      splashBus.gain.exponentialRampToValueAtTime(0.0001, n + 0.25);
    } catch (e) {}
  }
  afterSplash();
}
/**
 * Avanza la presentación: destello cuando la Tierra cae en el acento (a 5,5 s) y fin a los 10 s.
 *
 * @param {number} dt Tiempo del cuadro, en segundos.
 */
function updateSplash(dt) {
  setT(t + dt);
  if (state === 'splash') {
    splashT += dt;
  }
  setFlash(Math.max(0, flash - dt * 2));
  setSfl(Math.max(0, sfl - dt * 1.3));
  if (state === 'splash' && !sflared && splashT >= 5.5) {
    sflared = true;
    setFlash(0.35);
    setSfl(1);
    buzz([30, 40, 80]);
  }
  if (state === 'splash' && splashT >= SPLASH_END) {
    afterSplash();
  }
}
/**
 * Dibuja un cuadro de la presentación: el agujero negro grande viaja a su lugar en el logotipo y
 * se encoge hasta la Ó, salen las letras y la Tierra, y al final todo se funde a negro.
 */
function renderSplash() {
  const T = splashT;
  ctx.save();
  ctx.fillStyle = '#05060c';
  ctx.fillRect(0, 0, W, H);
  const sr = Math.max(W, H) * 0.62;
  for (const s of stars) {
    const x = CX + Math.cos(s.a + t * 0.004) * s.r * sr,
      y = CY + Math.sin(s.a + t * 0.004) * s.r * sr;
    ctx.globalAlpha = 0.1 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.3 + s.tw));
    ctx.fillStyle = BONE;
    ctx.fillRect(x, y, s.s * 0.8, s.s * 0.8);
  }
  ctx.globalAlpha = 1;
  const fs = Math.min(54, W * 0.11),
    Rf = fs * LOGO.r,
    word = 'RBITA',
    ls = fs * LOGO.track;
  ctx.font =
    LOGO.weight + ' ' + fs + 'px ' + (splashFont ? 'Unbounded' : 'system-ui') + ', sans-serif';
  const mw = s => {
    const m = ctx.measureText(s);
    return (m && m.width) || s.length * fs * 0.8;
  };
  const tw = mw(word) + ls * (word.length - 1),
    total = Rf * LOGO.disk + Rf * LOGO.txt + tw,
    fx = (W - total) / 2 + Rf * LOGO.disk,
    fy = H * 0.45;
  const Rs = Math.min(W, H) * 0.17,
    u = easeIO2(clamp((T - 3.3) / 2.2, 0, 1));
  const R =
    Rs * (0.94 + 0.06 * clamp(T / 3.3, 0, 1)) +
    (Rf - Rs * (0.94 + 0.06 * clamp(T / 3.3, 0, 1))) * u;
  const cx = W / 2 + (fx - W / 2) * u,
    cy = fy,
    a = 1,
    dim = state === 'pretitle' ? 0.5 : 0.5 * (1 - clamp(T / 1.2, 0, 1));
  const g = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 4.5);
  g.addColorStop(0, 'rgba(255,100,28,' + 0.2 * a + ')');
  g.addColorStop(1, 'rgba(255,100,28,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const df = BR1 + (LOGO.disk - BR1) * u; // el disco se acorta al convertirse en la O
  bhDisk(cx, cy, R, Math.PI - 0.03, Math.PI * 2 + 0.03, a, df);
  bhCore(cx, cy, R, a);
  bhDisk(cx, cy, R, 0, Math.PI, a, df);
  if (dim > 0) {
    ctx.globalAlpha = dim;
    ctx.fillStyle = '#05060c';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  // letras una por una, por delante del disco (el disco pasa por detrás de la R)
  const tx = cx + R * LOGO.txt,
    base = cy + fs * 0.36;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  for (let i = 0; i < word.length; i++) {
    const la = clamp((T - (4 + i * 0.22)) / 0.32, 0, 1);
    if (la <= 0) {
      continue;
    }
    const lx = tx + mw(word.slice(0, i)) + ls * i,
      ly = base + (1 - easeIO2(la)) * 14;
    ctx.globalAlpha = la;
    ctx.fillStyle = BONE;
    ctx.fillText(word[i], lx, ly);
  }
  ctx.globalAlpha = 1;
  // la Tierra sale disparada del agujero negro y se convierte en el acento
  if (T > 4.95) {
    const p = clamp((T - 4.95) / 0.45, 0, 1);
    drawAccent(cx, cy, R, 1 - Math.pow(1 - p, 3));
  }
  if (state === 'splash' && T > 0.8 && T < 9) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = BONE;
    ctx.font = '300 12px Unbounded, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Toca para saltar', CX, H - 34);
    ctx.globalAlpha = 1;
  }
  if (T > 9.2) {
    ctx.globalAlpha = clamp((T - 9.2) / 0.8, 0, 1);
    ctx.fillStyle = '#05060c';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (flash > 0) {
    ctx.globalAlpha = flash * 0.4;
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initSplash() {
  try {
    if (document.fonts && document.fonts.load) {
      document.fonts.load('400 52px Unbounded').then(
        () => {
          setSplashFont(true);
        },
        () => {},
      );
    }
  } catch (e) {}
}

export { renderSplash, skipSplash, splashT, updateSplash };

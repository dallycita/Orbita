/**
 * Poderes de cada planeta: se cargan con saltos Perfectos y se usan deslizando hacia arriba o con
 * la tecla D. Cada uno nace de un dato real del planeta y tiene su propio efecto visual y sonido.
 * Los efectos en curso viven en `pfx` ({k: tipo, t: segundos desde que empezó}); `powerUpdate` los
 * avanza y `drawPowerFx`, `drawPowerScene` y `drawRingPower` los dibujan.
 */
import {
  CX,
  CY,
  H,
  PR,
  R0,
  S,
  SUN,
  W,
  buzz,
  clamp,
  ctx,
  frac,
  reduceMotion,
  rgba,
} from './01-pantalla-y-utilidades.js';
import { AC, ROOT, SCALE, cowbell, noise, sub } from './02-audio.js';
import {
  charge,
  jumpT,
  jumpTarget,
  jumping,
  level,
  pAng,
  pLevel,
  rings,
  setCharge,
  setCrossed,
  setJumpT,
  setJumpTarget,
  setJumping,
  state,
} from './06-record-y-estado.js';
import {
  catchMargin,
  chargeMax,
  curP,
  curPlanet,
  jumpDur,
  pst,
  setShieldLeft,
  setUsedDouble,
  shieldLeft,
  sizeK,
} from './07-planetas.js';
import {
  curGoal,
  flash,
  lastEaten,
  particles,
  setFlash,
  setHoleFlare,
  setLastEaten,
  setPending,
  setPulse,
  setShake,
  setShowHint,
  setSlowTimer,
  setSunLevel,
  setTexts,
  setTimeScale,
  shake,
  slowTimer,
  sunLevel,
  t,
  texts,
  tutorial,
} from './08-partida-estado.js';
import { beatTime, obsAng, obsRad } from './10-ritmo-y-objetos.js';
import { rr } from './16-partida.js';

import { uiTone } from './28-sonidos-interfaz.js';

import { muted } from './core/settings.js';
import { PLGL, drawPlayer } from './render/planets.js';
import { noteDouble } from './game/progress.js';

let ghostT = 0;
let shieldT = 0;
let eclipseT = 0;
let pfx = [];
let lastJT = 1;
let periLeft = 0;
let predT = 0;
let strainK = 0;
let burnT = 0;
let ringBoostNow = 0;
/**
 * Cuánto se estira el planeta por la marea del agujero negro: crece al acercarse a él y con la
 * fragilidad del planeta (resistencia negativa).
 *
 * @returns {number} Estiramiento, de 0 a 1 (0 fuera de partida o en el tutorial).
 */
function strainNow() {
  if (tutorial || state !== 'play') {
    return 0;
  }
  const frag = clamp(-pst().res / 50, 0, 1),
    near = clamp((1.5 - (pLevel - sunLevel - catchMargin())) / 1.1, 0, 1);
  return near * (0.25 + 0.75 * frag);
}
function powerName() {
  const P = curP();
  return P && P.power ? P.power[0] : '';
}
let bhWob = 0;
let BURN_DUR = 1.5;
/**
 * Anuncia un poder: destello de encendido, acorde propio del planeta y su nombre en pantalla.
 *
 * @param {string} [col] Color del destello y del texto, en CSS.
 */
function powerShout(col) {
  pfx.push({ k: 'ignite', t: 0, col: col || '#ffd36b' });
  setPulse(1);
  try {
    if (AC && !muted) {
      const n = AC.currentTime;
      [0, 5, 12].forEach((sm, i) =>
        uiTone(
          ROOT *
            Math.pow(
              2,
              (sm +
                {
                  luna: 3,
                  mercurio: 9,
                  venus: 2,
                  marte: -2,
                  jupiter: -5,
                  saturno: 4,
                  urano: 7,
                  neptuno: 10,
                  pluton: -7,
                  sol: 0,
                }[curPlanet] || 0) / 12,
            ),
          n + i * 0.05,
          0.8,
          0.04,
        ),
      );
    }
  } catch (e) {}
  setTexts(texts.filter(x => !x.tip && x.key !== 'pow' && x.y !== -R0 - 96 && x.y !== -R0 - 76));
  texts.push({
    txt: powerName(),
    x: 0,
    y: -R0 - 96,
    life: 1.4,
    size: 20,
    col: col || '#ffd36b',
    center: true,
    key: 'pow',
  });
}
/**
 * Usa el poder del planeta actual y gasta la carga. Plutón no tiene poder activo: Caronte lo
 * salva solo (ver `caronteSaves`), así que aquí solo avisa si está listo.
 *
 * @param {boolean} mid Verdadero si se usa a mitad de un salto (Marte y Mercurio lo aprovechan).
 */
function usePower(mid) {
  const id = curPlanet;
  if (id === 'pluton') {
    if (!texts.some(x => x.key === 'pow')) {
      texts.push({
        txt: shieldLeft > 0 ? 'Caronte está listo: te salvará una vez' : 'Caronte ya te salvó',
        x: 0,
        y: -R0 - 30,
        life: 1.2,
        size: 13,
        col: '#d9c7b4',
        center: true,
        key: 'pow',
      });
    }
    return;
  }
  setCharge(0);
  setShowHint(false);
  setPending(false);
  setUsedDouble(true);
  noteDouble();
  buzz([15, 30, 25]);
  const nr = rings.get(level + 1);
  if (id === 'marte') {
    // Monte Olimpo: salto triple
    const up = Math.min(3, curGoal() - level);
    if (mid) {
      const p1 = Math.min(jumpT / jumpDur(), 1),
        e1 = 1 - Math.pow(1 - p1, 3);
      setJumpT((1 - Math.cbrt(1 - e1 / up)) * (0.24 + (up - 2) * 0.1));
    } else {
      setJumping(true);
      setJumpT(0);
    }
    setJumpTarget(up);
    setCrossed(false);
    pfx.push({ k: 'olimpo', t: 0 });
    noise(0.4, 200, 5000, 0.3, 'bandpass');
    cowbell(SCALE[5] + 12);
    powerShout('#ff8a5c');
  } else if (id === 'luna') {
    // Eclipse: cámara lenta
    eclipseT = 2.5;
    setTimeScale(0.42);
    setSlowTimer(2.5);
    pfx.push({ k: 'eclipse', t: 0 });
    noise(1.2, 3000, 200, 0.2, 'lowpass');
    powerShout('#dfe6ff');
  } else if (id === 'mercurio') {
    // Perihelio: tus dos siguientes saltos son instantáneos
    periLeft = 2;
    if (mid) {
      periLeft = 1;
      pfx.push({ k: 'destello', t: 0, a: pAng, l0: pLevel });
      setJumpT(99);
      ghostT = 0.15;
    }
    setFlash(0.2);
    noise(0.18, 6000, 9000, 0.25, 'highpass');
    cowbell(SCALE[7] + 12);
    powerShout('#ffe9b8');
  } else if (id === 'venus') {
    // Efecto invernadero: derrite los dos asteroides más cercanos del anillo de arriba
    if (nr) {
      const near = nr.obs
        .filter(o => !o.melt && !o.star)
        .map(o => [
          Math.abs(Math.atan2(Math.sin(obsAng(nr, o) - pAng), Math.cos(obsAng(nr, o) - pAng))),
          o,
        ])
        .sort((a, b) => a[0] - b[0])
        .slice(0, 2);
      for (const [, o] of near) {
        o.melt = t;
      }
      nr.heatT = 1;
    }
    pfx.push({ k: 'calor', t: 0 });
    noise(0.9, 400, 2500, 0.3, 'bandpass');
    powerShout('#ffb070');
  } else if (id === 'jupiter') {
    // Empujón gravitacional: aleja al agujero negro
    setSunLevel(Math.max(-1.6, sunLevel - 0.4));
    setLastEaten(Math.min(lastEaten, Math.floor(sunLevel)));
    // El resto del empujón y el temblor del agujero negro llegan con la onda (ver powerUpdate).
    pfx.push({ k: 'empujon', t: 0, a: pAng, l: pLevel, left: 0.8 });
    sub();
    noise(0.8, 2500, 120, 0.4, 'lowpass');
    powerShout('#f0c08a');
  } else if (id === 'saturno') {
    // Anillos protectores: un rato sin choques (shieldT, en segundos)
    shieldT = 1.5;
    pfx.push({ k: 'anillos', t: 0 });
    noise(0.5, 500, 4000, 0.2, 'bandpass');
    cowbell(SCALE[4] + 12);
    powerShout('#f3dfa6');
  } else if (id === 'urano') {
    // Congelar: los dos anillos de arriba se detienen (el segundo, un poco más)
    if (nr) {
      nr.frozenT = 3;
      nr.frz0 = 3;
      nr.frzA = pAng;
      nr.shat = 0;
    }
    {
      const n2 = rings.get(level + 2);
      if (n2) {
        n2.frozenT = 3.6;
        n2.frz0 = 3.6;
        n2.frzA = pAng;
        n2.shat = 0;
      }
    }
    pfx.push({ k: 'hielo', t: 0 });
    noise(0.5, 7000, 2500, 0.18, 'highpass');
    powerShout('#bff0ff');
  } else if (id === 'neptuno') {
    // Predicción: ves dónde estarán los asteroides cuando caigas
    predT = 3;
    pfx.push({ k: 'viento', t: 0 });
    noise(0.6, 2500, 600, 0.2, 'bandpass');
    try {
      if (AC) {
        [0, 7, 12].forEach((sm, i) =>
          uiTone(ROOT * 2 * Math.pow(2, sm / 12), AC.currentTime + i * 0.07, 0.9, 0.035),
        );
      }
    } catch (e) {}
    powerShout('#9cc0ff');
  } else if (id === 'sol') {
    // Arder: 1.5 segundos en los que los asteroides que tocas se vuelven plasma
    burnT = BURN_DUR;
    pfx.push({ k: 'arder', t: 0 });
    setFlash(0.25);
    setShake(reduceMotion ? 0 : 5);
    sub();
    noise(1.4, 300, 3000, 0.35, 'bandpass');
    powerShout('#ffb347');
  }
}
/**
 * Sol: vaporiza un asteroide que el planeta toca mientras arde (lo marca como fundido, con
 * chispas de plasma, temblor y sonido).
 *
 * @param {object} ring Anillo del asteroide.
 * @param {object} o Asteroide.
 * @param {number} x Posición horizontal del choque, en píxeles de pantalla.
 * @param {number} y Posición vertical del choque, en píxeles de pantalla.
 */
function vaporize(ring, o, x, y) {
  o.melt = t;
  o.burn = 1;
  setShake(Math.max(shake, reduceMotion ? 0 : 4));
  setFlash(Math.max(flash, 0.12));
  buzz([12]);
  const wx = (x - CX) / S,
    wy = (y - CY) / S;
  pfx.push({ k: 'plasma', t: 0, x: wx, y: wy });
  for (let i = 0; i < 34; i++) {
    const a = Math.random() * Math.PI * 2,
      v = 60 + Math.random() * 190;
    particles.push({
      x: wx,
      y: wy,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.35 + Math.random() * 0.45,
      col: ['#ffffff', '#fff3c4', '#ffd36b', '#ff9a3c', '#ff5a1f'][i % 5],
      s: 1.2 + Math.random() * 2.6,
    });
  }
  noise(0.35, 5000, 400, 0.3, 'lowpass');
}
/**
 * Caronte (Plutón): si algo iba a destruir al planeta con la carga llena, su luna se interpone
 * una sola vez, se rompe en pedazos de hielo y el choque frena al planeta (el agujero negro se
 * acerca).
 *
 * @param {number} x Posición horizontal del planeta, en unidades del mundo (centro en el agujero).
 * @param {number} y Posición vertical del planeta, en unidades del mundo.
 * @param {number} [tx] Posición horizontal de lo que golpea; sin ella, el golpe viene del centro.
 * @param {number} [ty] Posición vertical de lo que golpea, en unidades del mundo.
 * @returns {boolean} Verdadero si Caronte salvó al planeta.
 */
function caronteSaves(x, y, tx, ty) {
  if (tutorial || curPlanet !== 'pluton' || shieldLeft <= 0 || charge < chargeMax()) {
    return false;
  }
  const ta = tx !== undefined ? Math.atan2(ty - y, tx - x) : Math.atan2(-y, -x);
  pfx.push({ k: 'caronte', t: 0, x, y, a: ta, ca: caronteAng() });
  setShieldLeft(0);
  setCharge(0);
  ghostT = 0.9;
  setSunLevel(Math.min(pLevel - catchMargin() - 0.6, sunLevel + 0.6));
  setFlash(0.4);
  setShake(reduceMotion ? 0 : 8);
  buzz([30, 20, 60]);
  noise(0.6, 3000, 200, 0.35, 'lowpass'); // el choque te frena: el agujero negro se acerca
  {
    const cx = x + Math.cos(ta) * PR * sizeK() * 1.9,
      // Caronte se rompe en pedazos de hielo (gris, con su polo rojizo)
      cy = y + Math.sin(ta) * PR * sizeK() * 1.9;
    for (let i = 0; i < 46; i++) {
      const a = ta + (Math.random() - 0.5) * 2.6,
        v = 50 + Math.random() * 210;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.7 + Math.random() * 0.7,
        col: ['#bdb5ad', '#8e8780', '#e9e4de', '#9a5a46', '#ffffff', '#6f6a66'][i % 6],
        s: i % 4 ? 1 + Math.random() * 1.5 : 2.4 + Math.random() * 2.6,
      });
    }
  }
  texts.push({
    txt: '¡Caronte te salvó!',
    x: 0,
    y: -R0 - 96,
    life: 1.6,
    size: 20,
    col: '#d9c7b4',
    center: true,
  });
  return true;
}
/** Ángulo de Caronte en su órbita alrededor de Plutón, en radianes. */
const caronteAng = () => t * 2.2;
/**
 * Saturno: con los anillos protectores, la roca que toca al planeta rebota en el disco de hielo y
 * salta en chispas.
 *
 * @param {number} x Posición horizontal del choque, en unidades del mundo.
 * @param {number} y Posición vertical del choque, en unidades del mundo.
 */
function ringSpark(x, y) {
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2,
      v = 40 + Math.random() * 150;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.4 + Math.random() * 0.5,
      col: ['#ffffff', '#f3e6c4', '#d9e8f0', '#cbb68a'][i % 4],
      s: 0.8 + Math.random() * 1.4,
    });
  }
  try {
    if (AC && !muted) {
      [19, 24].forEach((sm, i) =>
        uiTone(ROOT * 2 * Math.pow(2, sm / 12), AC.currentTime + i * 0.04, 0.4, 0.03),
      );
    }
  } catch (e) {}
}
/**
 * Avanza un cuadro los poderes: descuenta sus tiempos, funde los asteroides derretidos, gira los
 * anillos empujados, aplica la onda de Júpiter cuando llega al agujero negro y suelta el polvo
 * del salto triple de Marte.
 *
 * @param {number} dt Tiempo real del cuadro, en segundos (sin la cámara lenta).
 * @param {number} d Tiempo de juego del cuadro, en segundos (no se usa aquí).
 */
function powerUpdate(dt, d) {
  ghostT = Math.max(0, ghostT - dt);
  shieldT = Math.max(0, shieldT - dt);
  burnT = Math.max(0, burnT - dt);
  eclipseT = Math.max(0, eclipseT - dt);
  predT = Math.max(0, predT - dt);
  if (eclipseT > 0 && slowTimer > 0) {
    setTimeScale(0.42);
  }
  for (const r of rings.values()) {
    if (r.revT) {
      r.revT = Math.max(0, r.revT - dt * 1.2);
    }
    if (r.windT) {
      r.windT = Math.max(0, r.windT - dt * 1.5);
    }
    if (r.heatT) {
      r.heatT = Math.max(0, r.heatT - dt * 0.9);
    }
    for (const o of r.obs) {
      if (o.melt && !o.gone && t - o.melt > (o.burn ? 0.16 : 0.7)) {
        o.gone = true;
        if (o.burn) {
          continue;
        }
        const R = rr(r.k !== undefined ? r.k : level + 1),
          oa = obsAng(r, o);
        // Gotas de roca fundida que caen hacia el agujero negro.
        for (let i = 0; i < 30; i++) {
          const a = Math.random() * Math.PI * 2,
            v = 15 + Math.random() * 70;
          particles.push({
            x: Math.cos(oa) * R,
            y: Math.sin(oa) * R,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            life: 0.9 + Math.random() * 0.8,
            col: ['#fff1c0', '#ffb347', '#ff6a2a', '#d23a10', '#7a7068'][i % 5],
            s: 1.5 + Math.random() * 3,
          });
        }
      }
    }
    if (r.spin) {
      r.spin.t += dt / 0.4;
      const u = Math.min(1, r.spin.t),
        e = 1 - Math.pow(1 - u, 3);
      r.off = r.spin.from + (r.spin.to - r.spin.from) * e;
      if (u >= 1) {
        r.spin = null;
      }
    }
  }
  for (const f of pfx) {
    f.t += dt;
    if (f.k === 'empujon' && f.t >= 0.42 && f.left > 0) {
      // la magnetosfera llega al agujero negro y lo empuja
      if (!f.hit) {
        f.hit = 1;
        setHoleFlare(1);
        bhWob = 1;
        setShake(reduceMotion ? 0 : 10);
        sub();
        noise(0.7, 1800, 90, 0.35, 'lowpass');
      }
      const q = Math.min(f.left, dt * 2.8);
      f.left -= q;
      setSunLevel(Math.max(-1.6, sunLevel - q));
      setLastEaten(Math.min(lastEaten, Math.floor(sunLevel)));
    }
    if (f.k === 'arder' && burnT > 0) {
      f.t = Math.min(f.t, 0.5);
    }
  }
  pfx = pfx.filter(f => f.t < (f.k === 'arder' ? 1.2 : f.k === 'viento' ? 3.2 : 1.6));
  bhWob = Math.max(0, bhWob - dt * 1.1);
  if (jumping && jumpTarget === 3 && state === 'play' && Math.random() < 0.9) {
    // Marte: la tormenta de polvo que deja el salto
    const pr = rr(pLevel),
      x = Math.cos(pAng) * pr,
      y = Math.sin(pAng) * pr,
      a = pAng + Math.PI + (Math.random() - 0.5) * 1.2,
      v = 20 + Math.random() * 60;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * v + (Math.random() - 0.5) * 40,
      vy: Math.sin(a) * v + (Math.random() - 0.5) * 40,
      life: 0.8 + Math.random() * 0.7,
      col: ['#c8573a', '#e0866a', '#8f3a24', '#f0b090'][Math.floor(Math.random() * 4)],
      s: 2 + Math.random() * 3.5,
    });
  }
}
// ---- Efectos de los poderes sobre el planeta ----

/**
 * Número pseudoaleatorio fijo para cada par (i, k): da variaciones estables entre cuadros.
 *
 * @param {number} i Índice del elemento.
 * @param {number} k Canal (otro valor distinto para el mismo elemento).
 * @returns {number} Valor de 0 a 1.
 */
const hsh = (i, k) => frac(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);
/** Transición suave (smoothstep) de 0 a 1 cuando x va de a a b. */
const smst = (a, b, x) => {
  const u = clamp((x - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};
/** @returns {number[]} Posición [x, y] del planeta, en píxeles de pantalla. */
function plPos() {
  const pr = rr(pLevel) * S;
  return [CX + Math.cos(pAng) * pr, CY + Math.sin(pAng) * pr];
}
/**
 * Traza un copo de hielo: estrella de seis puntas con el trazo actual.
 *
 * @param {number} x Centro horizontal, en píxeles de pantalla.
 * @param {number} y Centro vertical, en píxeles de pantalla.
 * @param {number} s Largo de cada brazo, en píxeles de pantalla.
 * @param {number} rot Giro, en radianes.
 */
function flake(x, y, s, rot) {
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = rot + (i * Math.PI) / 3,
      c = Math.cos(a) * s,
      d = Math.sin(a) * s;
    ctx.moveTo(x - c, y - d);
    ctx.lineTo(x + c, y + d);
  }
  ctx.stroke();
}
/**
 * Dibuja el aire que tiembla por el calor alrededor del planeta (tres contornos ondulados).
 *
 * @param {number} px Centro horizontal del planeta, en píxeles de pantalla.
 * @param {number} py Centro vertical del planeta, en píxeles de pantalla.
 * @param {number} r Radio del planeta, en píxeles de pantalla.
 * @param {string} col Color del trazo, en CSS.
 * @param {number} k Intensidad, de 0 a 1.
 */
function heatHaze(px, py, r, col, k) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = k * (0.22 - i * 0.05);
    ctx.strokeStyle = col;
    ctx.beginPath();
    for (let j = 0; j <= 48; j++) {
      const th = (j / 48) * Math.PI * 2,
        rq =
          r * (1.22 + 0.16 * i) +
          Math.sin(th * 7 + t * 13 + i * 2) * r * 0.045 +
          Math.sin(th * 3 - t * 9) * r * 0.03;
      j
        ? ctx.lineTo(px + Math.cos(th) * rq, py + Math.sin(th) * rq)
        : ctx.moveTo(px + Math.cos(th) * rq, py + Math.sin(th) * rq);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}
/**
 * Júpiter: auroras en sus dos polos (las más potentes del sistema solar, que Hubble ve en
 * ultravioleta), con la huella de Ío.
 *
 * @param {number} px Centro horizontal del planeta, en píxeles de pantalla.
 * @param {number} py Centro vertical del planeta, en píxeles de pantalla.
 * @param {number} r Radio del planeta, en píxeles de pantalla.
 * @param {number} tt Tiempo desde que se usó el poder, en segundos.
 */
function drawAurora(px, py, r, tt) {
  const k = Math.min(1, tt / 0.12) * Math.min(1, (1.4 - tt) / 0.5);
  if (k <= 0) {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (const pole of [-1, 1]) {
    const cy = py + pole * r * 0.84,
      w = pole < 0 ? 1 : 0.8,
      fl = 0.75 + 0.25 * Math.sin(t * 23 + pole * 3) * Math.sin(t * 7.7);
    const g = ctx.createRadialGradient(px, cy, 0, px, cy, r * 0.95);
    g.addColorStop(0, 'rgba(190,170,255,' + 0.55 * k * w * fl + ')');
    g.addColorStop(0.5, 'rgba(120,110,255,' + 0.22 * k * w + ')');
    g.addColorStop(1, 'rgba(90,80,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, cy, r * 0.95, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 22; i++) {
      // cortinas de luz que suben desde el óvalo
      const th = (i / 22) * Math.PI * 2,
        ox = px + Math.cos(th) * r * 0.42,
        oy = cy + Math.sin(th) * r * 0.11,
        h = r * (0.06 + 0.14 * hsh(i, pole)) * (0.6 + 0.4 * Math.sin(t * 17 + i * 1.7));
      ctx.globalAlpha = 0.28 * k * w;
      ctx.strokeStyle = i % 3 ? '#9b8cff' : '#d6ccff';
      ctx.lineWidth = Math.max(1.5, r * 0.12);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox, oy + pole * h);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.35 * k * w * fl;
    ctx.strokeStyle = '#b7a8ff';
    ctx.lineWidth = Math.max(2, r * 0.16);
    ctx.beginPath();
    ctx.ellipse(px, cy, r * 0.42, r * 0.11, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.8 * k * w * fl;
    ctx.strokeStyle = '#efe9ff';
    ctx.lineWidth = Math.max(0.8, r * 0.04);
    ctx.beginPath();
    ctx.ellipse(px, cy, r * 0.42, r * 0.11, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.8 * k * w;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px + r * 0.55, cy + pole * r * 0.03, Math.max(1, r * 0.05), 0, Math.PI * 2);
    ctx.fill(); // la huella de Ío
  }
  ctx.restore();
}
/**
 * Sol: corona, protuberancias y viento solar mientras arde.
 *
 * @param {number} px Centro horizontal del planeta, en píxeles de pantalla.
 * @param {number} py Centro vertical del planeta, en píxeles de pantalla.
 * @param {number} r Radio del planeta, en píxeles de pantalla.
 */
function drawSolarFire(px, py, r) {
  let k = Math.min(1, (BURN_DUR - burnT) / 0.2, 0.3 + burnT / 0.6);
  // Parpadea cuando se va a apagar.
  if (burnT < 0.45) {
    k *= 0.72 + 0.28 * Math.sin(t * 28);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const g = ctx.createRadialGradient(px, py, r * 0.98, px, py, r * 3.6);
  g.addColorStop(0, 'rgba(255,214,140,' + 0.42 * k + ')');
  g.addColorStop(0.2, 'rgba(255,150,60,' + 0.16 * k + ')');
  g.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(px, py, r * 3.6, 0, Math.PI * 2);
  ctx.arc(px, py, r * 0.98, 0, Math.PI * 2, true);
  ctx.fill('evenodd');
  for (let i = 0; i < 7; i++) {
    // serpentinas de la corona: largas, suaves y desiguales
    const a = (i / 7) * Math.PI * 2 + t * 0.12 + hsh(i, 1) * 0.7,
      L = r * (1.6 + 2.2 * hsh(i, 2)) * (1 + 0.1 * Math.sin(t * 2.3 + i)),
      w = r * (0.35 + 0.25 * hsh(i, 3));
    const gg = ctx.createLinearGradient(
      px + Math.cos(a) * r,
      py + Math.sin(a) * r,
      px + Math.cos(a) * (r + L),
      py + Math.sin(a) * (r + L),
    );
    gg.addColorStop(0, 'rgba(255,226,170,' + 0.22 * k + ')');
    gg.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(a - w / r) * r, py + Math.sin(a - w / r) * r);
    ctx.lineTo(px + Math.cos(a) * (r + L), py + Math.sin(a) * (r + L));
    ctx.lineTo(px + Math.cos(a + w / r) * r, py + Math.sin(a + w / r) * r);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    // protuberancias: arcos de plasma que salen del borde y vuelven a caer
    const a0 = (i / 5) * Math.PI * 2 + t * 0.25 + hsh(i, 5),
      sp = 0.3 + 0.22 * hsh(i, 6),
      h = r * (0.3 + 0.4 * hsh(i, 7)) * (0.7 + 0.3 * Math.sin(t * 1.9 + i * 2));
    const x1 = px + Math.cos(a0 - sp) * r * 0.97,
      y1 = py + Math.sin(a0 - sp) * r * 0.97,
      x2 = px + Math.cos(a0 + sp) * r * 0.97,
      y2 = py + Math.sin(a0 + sp) * r * 0.97;
    const c1x = px + Math.cos(a0 - sp * 0.5) * (r + h * 1.35),
      c1y = py + Math.sin(a0 - sp * 0.5) * (r + h * 1.35),
      c2x = px + Math.cos(a0 + sp * 0.7) * (r + h * 1.2),
      c2y = py + Math.sin(a0 + sp * 0.7) * (r + h * 1.2);
    for (const [lw, col, al] of [
      [r * 0.34, '#ff5a2a', 0.3],
      [r * 0.15, '#ff7a3c', 0.85],
      [r * 0.05, '#ffd2a0', 0.9],
    ]) {
      ctx.globalAlpha = al * k;
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(0.8, lw);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x2, y2);
      ctx.stroke();
    }
  }
  ctx.restore();
  if (Math.random() < 0.8 * k) {
    const a = Math.random() * Math.PI * 2,
      v = 90 + Math.random() * 90,
      wx = (px - CX) / S,
      wy = (py - CY) / S,
      rs = r / S; // viento solar
    particles.push({
      x: wx + Math.cos(a) * rs * 1.05,
      y: wy + Math.sin(a) * rs * 1.05,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.4 + Math.random() * 0.4,
      col: Math.random() < 0.5 ? '#fff1c0' : '#ffb347',
      s: 0.8 + Math.random() * 1.2,
    });
  }
}
/**
 * Mercurio: su cola de sodio real (amarillo anaranjado, a 589 nm), más larga que la Tierra,
 * apuntando lejos del agujero negro, con un punto de luz por cada salto instantáneo que queda.
 *
 * @param {number} px Centro horizontal del planeta, en píxeles de pantalla.
 * @param {number} py Centro vertical del planeta, en píxeles de pantalla.
 * @param {number} r0 Radio del planeta, en píxeles de pantalla (se usa al menos 7 unidades).
 */
function drawSodiumTail(px, py, r0) {
  const r = Math.max(r0, 7 * S),
    a = Math.atan2(py - CY, px - CX),
    L = r * (13 + Math.sin(t * 5) * 0.6),
    bend = r * 2.6;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(a);
  ctx.globalCompositeOperation = 'lighter';
  const yc = x => bend * Math.pow(x / L, 2);
  for (const [w0, w1, len, c0, al] of [
    [r * 1.1, r * 3.6, 1, '255,175,70', 0.2],
    [r * 0.7, r * 1.4, 0.75, '255,200,105', 0.32],
    [r * 0.32, r * 0.1, 0.4, '255,244,205', 0.7],
  ]) {
    const LL = L * len,
      gg = ctx.createLinearGradient(0, 0, LL, 0);
    gg.addColorStop(0, 'rgba(' + c0 + ',' + al + ')');
    gg.addColorStop(1, 'rgba(' + c0 + ',0)');
    ctx.fillStyle = gg;
    ctx.beginPath();
    for (let j = 0; j <= 20; j++) {
      const x = (LL * j) / 20,
        w = w0 + ((w1 - w0) * j) / 20;
      j ? ctx.lineTo(x, yc(x) - w / 2) : ctx.moveTo(x, yc(x) - w / 2);
    }
    for (let j = 20; j >= 0; j--) {
      const x = (LL * j) / 20,
        w = w0 + ((w1 - w0) * j) / 20;
      ctx.lineTo(x, yc(x) + w / 2);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.lineWidth = 1;
  if (ctx.setLineDash) {
    ctx.setLineDash([r * 0.6, r * 0.9]);
  } // átomos de sodio que corren por la cola
  for (let i = 0; i < 4; i++) {
    const sp = (i - 1.5) * r * 0.3;
    ctx.lineDashOffset = -t * r * 14 - i * r * 0.5;
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#ffe2a0';
    ctx.beginPath();
    for (let j = 0; j <= 12; j++) {
      const x = (L * 0.9 * j) / 12;
      j ? ctx.lineTo(x, yc(x) + sp * (1 + (x / L) * 3)) : ctx.moveTo(x, yc(x) + sp);
    }
    ctx.stroke();
  }
  if (ctx.setLineDash) {
    ctx.setLineDash([]);
  }
  ctx.restore();
  heatHaze(px, py, r0, '#fff0d0', 0.9);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < periLeft; i++) {
    const b = t * 7 + i * Math.PI,
      x = px + Math.cos(b) * r * 1.55,
      y = py + Math.sin(b) * r * 1.55; // un punto de luz por cada salto instantáneo que te queda
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,.95)');
    g.addColorStop(0.3, 'rgba(255,214,120,.6)');
    g.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
// ---- Caronte: la luna gris de Plutón, con su polo rojizo (Mordor Macula); mide la mitad que
// Plutón ----

/**
 * Posición de Caronte en su órbita inclinada alrededor de Plutón.
 *
 * @param {number} px Centro horizontal de Plutón, en píxeles de pantalla.
 * @param {number} py Centro vertical de Plutón, en píxeles de pantalla.
 * @param {number} r Radio de la órbita, en píxeles de pantalla.
 * @returns {number[]} [x, y, z]: posición en píxeles y profundidad (z < 0: detrás de Plutón).
 */
function caronteXY(px, py, r) {
  const a = caronteAng(),
    x = Math.cos(a) * r * 2.4,
    y = Math.sin(a) * r * 0.7;
  return [
    px + x * Math.cos(0.25) - y * Math.sin(0.25),
    py + x * Math.sin(0.25) + y * Math.cos(0.25),
    Math.sin(a),
  ];
}
/**
 * Dibuja Caronte con el planeta en WebGL (textura de la Luna) o un círculo si no hay WebGL, y le
 * pinta encima su polo rojizo.
 *
 * @param {number} cx Centro horizontal, en píxeles de pantalla.
 * @param {number} cy Centro vertical, en píxeles de pantalla.
 * @param {number} cr Radio, en píxeles de pantalla.
 * @param {number} al Opacidad, de 0 a 1.
 */
function drawCaronte(cx, cy, cr, al) {
  ctx.save();
  ctx.globalAlpha = al;
  let res = null;
  try {
    if (PLGL.ok()) {
      res = PLGL.render(
        'luna',
        2 * cr * 2,
        t * 0.3,
        [-Math.cos(pAng) * 0.8, Math.sin(pAng) * 0.8, 0.6],
        [1.3, 1.18, 1.08],
        t,
      );
    }
  } catch (e) {
    res = null;
  }
  if (res) {
    const h = cr * res.pad;
    ctx.drawImage(res.cv, cx - h, cy - h, 2 * h, 2 * h);
  } else {
    ctx.fillStyle = '#a99a8c';
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, cr * 0.98, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createRadialGradient(cx, cy - cr * 0.85, 0, cx, cy - cr * 0.85, cr * 0.75);
  g.addColorStop(0, 'rgba(120,52,36,.65)');
  g.addColorStop(1, 'rgba(120,52,36,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
  ctx.fillStyle = 'rgba(150,150,160,.12)';
  ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
  ctx.restore();
}
/** @returns {boolean} Verdadero si Caronte está listo para salvar a Plutón y debe verse. */
function caronteOn() {
  return (
    curPlanet === 'pluton' &&
    shieldLeft > 0 &&
    charge >= chargeMax() &&
    !tutorial &&
    state === 'play'
  );
}
/**
 * Dibuja la órbita de Caronte y, si está en la mitad que pasa detrás de Plutón, la luna. Se
 * llama antes de dibujar el planeta; la mitad de delante la dibuja `drawPowerFx`.
 *
 * @param {number} px Centro horizontal de Plutón, en píxeles de pantalla.
 * @param {number} py Centro vertical de Plutón, en píxeles de pantalla.
 */
function drawCaronteBack(px, py) {
  if (!caronteOn()) {
    return;
  }
  const r = PR * S * 1.15 * sizeK(),
    [cx, cy, z] = caronteXY(px, py, r);
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#d9c7b4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(px, py, r * 2.4, r * 0.7, 0.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  if (z < 0) {
    drawCaronte(cx, cy, r * 0.62, 1);
  }
}
/**
 * Dibuja los efectos de los poderes sobre el planeta y a su alrededor (encendido, hielo, erupción,
 * auroras, fuego, cola de sodio, Caronte por delante…), después de dibujar el planeta.
 *
 * @param {number} px Centro horizontal del planeta, en píxeles de pantalla.
 * @param {number} py Centro vertical del planeta, en píxeles de pantalla.
 * @param {number} rad Radio base del planeta, en píxeles de pantalla (sin su factor de tamaño).
 */
function drawPowerFx(px, py, rad) {
  const r = rad * sizeK();
  for (const f of pfx) {
    if (f.k === 'ignite' && f.t < 0.6) {
      // encendido: destello, anillo y rayos del color del planeta
      const u = f.t / 0.6,
        e = 1 - Math.pow(1 - u, 3);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(px, py, 0, px, py, r * (2 + 4 * e));
      g.addColorStop(0, 'rgba(255,255,255,' + 0.7 * (1 - u) + ')');
      g.addColorStop(0.35, rgba(f.col, 0.45 * (1 - u)));
      g.addColorStop(1, rgba(f.col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r * (2 + 4 * e), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = (1 - u) * 0.7;
      ctx.strokeStyle = f.col;
      ctx.lineWidth = 1.5 * (1 - u) + 0.5;
      ctx.beginPath();
      ctx.arc(px, py, r * (1.3 + 5 * e), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (!f.sp) {
        f.sp = 1;
        const wx = (px - CX) / S,
          wy = (py - CY) / S;
        for (let i = 0; i < 22; i++) {
          const a = Math.random() * Math.PI * 2,
            v = 50 + Math.random() * 120;
          particles.push({
            x: wx,
            y: wy,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            life: 0.5 + Math.random() * 0.5,
            col: i % 3 ? f.col : '#ffffff',
            s: 1.2 + Math.random() * 1.8,
          });
        }
      }
    } else if (f.k === 'empujon' && f.t < 1.4) {
      drawAurora(px, py, r, f.t);
    } else if (f.k === 'hielo' && f.t < 0.8) {
      // Urano: una ola de frío sale del planeta, con copos de nieve
      const u = f.t / 0.8,
        e = 1 - Math.pow(1 - u, 3),
        R = r * (1.2 + 5 * e);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - u) * 0.8;
      ctx.strokeStyle = '#dff6ff';
      ctx.lineWidth = 2 * (1 - u) + 0.6;
      ctx.beginPath();
      ctx.arc(px, py, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + hsh(i, 9);
        flake(
          px + Math.cos(a) * R,
          py + Math.sin(a) * R,
          r * (0.22 + 0.1 * hsh(i, 4)) * (1 - u * 0.5),
          u * 2 + i,
        );
      }
      ctx.restore();
    } else if (f.k === 'olimpo' && f.t < 0.55) {
      // Marte: la erupción del Monte Olimpo lo lanza hacia arriba
      const u = f.t / 0.55,
        a = Math.atan2(CY - py, CX - px),
        L = r * (3 + 6 * u);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, 0, L, 0);
      g.addColorStop(0, 'rgba(255,215,160,' + 0.95 * (1 - u) + ')');
      g.addColorStop(0.35, 'rgba(235,105,60,' + 0.75 * (1 - u) + ')');
      g.addColorStop(1, 'rgba(140,40,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6);
      ctx.quadraticCurveTo(L * 0.5, -r * (1 + 1.6 * u), L, -r * (2 + 2 * u));
      ctx.lineTo(L, r * (2 + 2 * u));
      ctx.quadraticCurveTo(L * 0.5, r * (1 + 1.6 * u), 0, r * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (f.k === 'calor' && f.t < 1.2) {
      heatHaze(px, py, r, '#ffc98a', Math.min(1, f.t / 0.1) * (1 - f.t / 1.2));
    }
  }
  if (!tutorial && state === 'play') {
    const frag = clamp(-pst().res / 50, 0, 1),
      k = strainNow();
    if (k > 0.02) {
      const a = Math.atan2(CY - py, CX - px);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(
        px + Math.cos(a) * r * 0.5,
        py + Math.sin(a) * r * 0.5,
        r * 0.2,
        px,
        py,
        r * 1.7,
      );
      g.addColorStop(0, 'rgba(255,220,160,' + 0.6 * k + ')');
      g.addColorStop(0.5, 'rgba(255,110,40,' + 0.45 * k + ')');
      g.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r * 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = k;
      ctx.strokeStyle = '#ffd9a0';
      ctx.lineWidth = 1.5 + 2.5 * k;
      ctx.beginPath();
      ctx.arc(px, py, r * (1.05 + 0.05 * Math.sin(t * 30)), a - 1.3, a + 1.3);
      ctx.stroke();
      ctx.restore();
      if (frag > 0.4 && k > 0.35) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, r * 0.98, 0, Math.PI * 2);
        ctx.clip(); // grietas finas que se abren hacia el agujero negro
        ctx.globalAlpha = Math.min(1, (k - 0.35) * 1.6) * frag * 0.75;
        ctx.strokeStyle = 'rgba(60,15,5,.9)';
        ctx.lineWidth = 0.9;
        ctx.lineJoin = 'round';
        for (let i = 0; i < 3; i++) {
          let x = px + Math.cos(a) * r * 0.95,
            y = py + Math.sin(a) * r * 0.95,
            b = a + Math.PI + (i - 1) * 0.55;
          ctx.beginPath();
          ctx.moveTo(x, y);
          for (let j = 0; j < 5; j++) {
            b += (frac(Math.sin(i * 12.9 + j * 7.3) * 437.5) - 0.5) * 1.1;
            x += Math.cos(b) * r * 0.22;
            y += Math.sin(b) * r * 0.22;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,170,90,.6)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      }
      if (Math.random() < k * frag * 0.9) {
        const wx = (px - CX) / S,
          wy = (py - CY) / S,
          b = a + (Math.random() - 0.5) * 1.6;
        particles.push({
          x: wx + Math.cos(b) * PR * sizeK(),
          y: wy + Math.sin(b) * PR * sizeK(),
          vx: Math.cos(a) * 40 + (Math.random() - 0.5) * 30,
          vy: Math.sin(a) * 40 + (Math.random() - 0.5) * 30,
          life: 0.6 + Math.random() * 0.4,
          col: Math.random() < 0.5 ? '#ff8a4d' : curP().col || '#cfc6bb',
          s: 1.2 + Math.random() * 1.8,
        });
      }
    }
  }
  if (burnT > 0) {
    drawSolarFire(px, py, r);
  }
  if (shieldT > 0) {
    // Saturno: los anillos (dibujados con el planeta) dejan un brillo frío de hielo
    const al = Math.min(1, shieldT / 0.35, (1.5 - shieldT) / 0.2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(px, py, r, px, py, r * 3.6);
    g.addColorStop(0, 'rgba(255,240,205,' + 0.16 * al + ')');
    g.addColorStop(1, 'rgba(255,240,205,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r * 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (periLeft > 0) {
    drawSodiumTail(px, py, r);
  }
  if (ghostT > 0 && curPlanet !== 'pluton') {
    // Mercurio: brillo de "intocable"
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, ghostT * 3) * 0.7;
    ctx.strokeStyle = '#fff3d6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, r * 1.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (caronteOn()) {
    const [cx, cy, z] = caronteXY(px, py, r);
    if (z >= 0) {
      drawCaronte(cx, cy, r * 0.62, 1);
    }
  }
}
/**
 * Dibuja los efectos de los poderes en el escenario: magnetosfera de Júpiter, salto de Mercurio,
 * polvo de Marte, plasma del Sol, Caronte roto, nubes de Venus, vientos de Neptuno y el eclipse
 * de la Luna sobre el agujero negro.
 */
function drawPowerScene() {
  const sunW = Math.max(rr(sunLevel), SUN) * S;
  for (const f of pfx) {
    if (f.k === 'empujon' && f.t < 1.4) {
      // Júpiter: su magnetosfera (la estructura más grande del sistema solar) se infla y golpea al
      // agujero negro
      const [px, py] = plPos(),
        r = PR * S * 1.15 * sizeK(),
        e = 1 - Math.pow(1 - Math.min(1, f.t / 0.4), 3),
        k = Math.min(1, f.t / 0.06) * Math.min(1, (1.4 - f.t) / 0.55);
      const bx = CX - px,
        by = CY - py,
        bl = Math.hypot(bx, by) || 1,
        ux = bx / bl,
        uy = by / bl;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      const Ls = [2.2, 3.1, 4.2, 5.5, 7];
      for (let li = 0; li < Ls.length; li++) {
        // líneas del campo magnético (un dipolo), aplastadas del lado del agujero negro y estiradas
        // en la cola
        const L = Ls[li] * r * (0.25 + 0.75 * e);
        for (const sd of [-1, 1]) {
          const pts = [];
          for (let j = 0; j <= 36; j++) {
            const th = 0.2 + ((Math.PI - 0.4) * j) / 36,
              rho = L * Math.pow(Math.sin(th), 2),
              x = sd * rho * Math.sin(th),
              y = -rho * Math.cos(th),
              d = Math.hypot(x, y) || 1,
              dot = (x * ux + y * uy) / d,
              sc = dot > 0 ? 1 - 0.42 * dot : 1 + 0.9 * -dot * Math.min(1, li / 2.5);
            pts.push([px + x * sc, py + y * sc]);
          }
          for (const [lw, al] of [
            [4, 0.07],
            [1.2, 0.42],
          ]) {
            ctx.globalAlpha = al * k * (1 - li * 0.1);
            ctx.strokeStyle = li % 2 ? '#a99cff' : '#8fb4ff';
            ctx.lineWidth = lw;
            ctx.beginPath();
            pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.stroke();
          }
          for (let q = 0; q < 2; q++) {
            const [x, y] =
              pts[Math.floor(frac(f.t * 0.9 + q * 0.5 + li * 0.13 + (sd > 0 ? 0.25 : 0)) * 36)];
            ctx.globalAlpha = 0.9 * k;
            ctx.fillStyle = '#e6e0ff';
            ctx.beginPath();
            ctx.arc(x, y, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } // plasma que corre por el campo
      {
        const p = Ls[Ls.length - 1] * r * e * 0.62 * 1.2;
        ctx.globalAlpha = 0.55 * k;
        ctx.strokeStyle = '#d8d2ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const ba = Math.atan2(uy, ux); // el frente de choque, curvado como una proa
        for (let j = 0; j <= 30; j++) {
          const ph = -1.6 + (3.2 * j) / 30,
            rho = (2 * p) / (1 + Math.cos(ph)),
            x = px + Math.cos(ba + ph) * rho * 0.5,
            y = py + Math.sin(ba + ph) * rho * 0.5;
          j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      if (f.t > 0.12 && f.t < 0.46) {
        const u = (f.t - 0.12) / 0.34,
          d0 = bl,
          Rf = d0 - (d0 - sunW * 1.05) * u * u,
          ca = Math.atan2(py - CY, px - CX),
          hw = 0.35 + 0.45 * u; // la onda viaja hasta el agujero negro
        for (const [lw, al, col] of [
          [14 * (1 - u) + 4, 0.16, '#8f7bff'],
          [3, 0.7, '#e4ddff'],
        ]) {
          ctx.globalAlpha = al * k;
          ctx.strokeStyle = col;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.arc(CX, CY, Rf, ca - hw, ca + hw);
          ctx.stroke();
        }
      }
      if (f.t > 0.42) {
        const v = (f.t - 0.42) / 0.7;
        if (v < 1) {
          ctx.globalAlpha = (1 - v) * 0.75;
          ctx.strokeStyle = '#cfc6ff';
          ctx.lineWidth = 3 * (1 - v) + 1;
          ctx.beginPath();
          ctx.arc(CX, CY, sunW * (1.05 + 0.7 * v), 0, Math.PI * 2);
          ctx.stroke();
          const g = ctx.createRadialGradient(CX, CY, sunW, CX, CY, sunW * 2);
          g.addColorStop(0, 'rgba(150,130,255,' + 0.35 * (1 - v) + ')');
          g.addColorStop(1, 'rgba(150,130,255,0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(CX, CY, sunW * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (f.k === 'destello') {
      // Mercurio: una línea de luz con los colores separados y copias del planeta en el camino del
      // salto instantáneo
      const u = f.t / 0.55;
      if (u >= 1) {
        continue;
      }
      const r0 = rr(f.l0) * S,
        r1 = rr(level) * S,
        ca = Math.cos(f.a),
        sa = Math.sin(f.a),
        nx = -sa,
        ny = ca;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (const [off, col, lw, al] of [
        [0, '#ffd27a', 18, 0.25],
        [-2.2, '#ff9a5a', 3, 0.6],
        [2.2, '#8fc4ff', 3, 0.6],
        [0, '#ffffff', 3.5, 0.95],
      ]) {
        ctx.globalAlpha = (1 - u) * al;
        ctx.strokeStyle = col;
        ctx.lineWidth = lw * (1 - u * 0.6);
        ctx.beginPath();
        ctx.moveTo(CX + ca * r0 + nx * off, CY + sa * r0 + ny * off);
        ctx.lineTo(CX + ca * r1 + nx * off, CY + sa * r1 + ny * off);
        ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const o = (hsh(i, 2) - 0.5) * 30,
          q0 = hsh(i, 3),
          q1 = q0 + 0.25 + 0.2 * hsh(i, 4),
          sh = u * 0.4;
        ctx.globalAlpha = (1 - u) * 0.5;
        ctx.strokeStyle = '#fff0c8';
        ctx.lineWidth = 1; // líneas de velocidad
        const a0 = r0 + (r1 - r0) * (q0 + sh),
          a1 = r0 + (r1 - r0) * Math.min(1, q1 + sh);
        ctx.beginPath();
        ctx.moveTo(CX + ca * a0 + nx * o, CY + sa * a0 + ny * o);
        ctx.lineTo(CX + ca * a1 + nx * o, CY + sa * a1 + ny * o);
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(
        CX + ca * r1,
        CY + sa * r1,
        0,
        CX + ca * r1,
        CY + sa * r1,
        30 * S * (1 - u * 0.5),
      );
      g.addColorStop(0, 'rgba(255,250,230,' + 0.7 * (1 - u) + ')');
      g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(CX + ca * r1, CY + sa * r1, 30 * S, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      for (let i = 1; i <= 3; i++) {
        const q = i / 4,
          rq = r0 + (r1 - r0) * q;
        ctx.save();
        ctx.globalAlpha = (1 - u) * (0.12 + 0.1 * i);
        drawPlayer(CX + ca * rq, CY + sa * rq, PR * S * 1.15 * (0.85 + 0.05 * i));
        ctx.restore();
      }
    } else if (f.k === 'olimpo') {
      // Marte: columna de polvo y rocas de la erupción
      if (f.t < 0.05 && !f.done) {
        f.done = 1;
        const pr = rr(pLevel),
          x0 = Math.cos(pAng) * pr,
          y0 = Math.sin(pAng) * pr;
        for (let i = 0; i < 70; i++) {
          const a = pAng + Math.PI + (Math.random() - 0.5) * 1.1,
            v = 60 + Math.random() * 240;
          particles.push({
            x: x0,
            y: y0,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            life: 0.8 + Math.random() * 0.8,
            col: ['#d0603f', '#e8865e', '#7a2e1c', '#ffc2a0', '#fff0d0'][i % 5],
            s: 2 + Math.random() * 4,
          });
        }
      }
    } else if (f.k === 'crater' && f.t < 1) {
      // Marte: al caer, un anillo de polvo como el borde de un cráter
      const u = f.t,
        pr = rr(level) * S,
        x = CX + Math.cos(f.a) * pr,
        y = CY + Math.sin(f.a) * pr,
        e = 1 - Math.pow(1 - u, 3);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(f.a + Math.PI / 2);
      ctx.globalAlpha = (1 - u) * 0.8;
      const g = ctx.createRadialGradient(0, 0, 4 * S * e, 0, 0, 34 * S * e + 1);
      g.addColorStop(0, 'rgba(200,90,60,0)');
      g.addColorStop(0.75, 'rgba(225,130,95,.55)');
      g.addColorStop(1, 'rgba(160,60,40,0)');
      ctx.scale(1, 0.45);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 34 * S * e + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (f.k === 'plasma' && f.t < 0.5) {
      // Sol: el asteroide se vuelve plasma
      const u = f.t / 0.5,
        e = 1 - Math.pow(1 - u, 3),
        x = CX + f.x * S,
        y = CY + f.y * S;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, 30 * S * (0.4 + e));
      g.addColorStop(0, 'rgba(255,255,240,' + (1 - u) + ')');
      g.addColorStop(0.3, 'rgba(255,200,90,' + 0.7 * (1 - u) + ')');
      g.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 30 * S * (0.4 + e), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = (1 - u) * 0.8;
      ctx.strokeStyle = '#ffc070';
      ctx.lineWidth = 2.5 * (1 - u) + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 44 * S * e, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (f.k === 'caronte' && f.t < 0.9) {
      // Plutón: Caronte se pone delante del golpe y se rompe
      const x = CX + f.x * S,
        y = CY + f.y * S,
        r = PR * S * 1.15 * sizeK(),
        cx = x + Math.cos(f.a) * r * 1.9,
        cy = y + Math.sin(f.a) * r * 1.9,
        u = f.t / 0.9;
      if (f.t < 0.2) {
        const v = f.t / 0.2;
        drawCaronte(cx, cy, r * 0.51 * (1 + 0.25 * v), 1 - v);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = '#fff6ec';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 1 - v; // grietas que se abren antes de romperse
        for (let i = 0; i < 5; i++) {
          let qx = cx,
            qy = cy,
            b = f.a + Math.PI + (i - 2) * 0.7;
          ctx.beginPath();
          ctx.moveTo(qx, qy);
          for (let j = 0; j < 3; j++) {
            b += (hsh(i, j) - 0.5) * 0.9;
            qx += Math.cos(b) * r * 0.2 * (1 + v);
            qy += Math.sin(b) * r * 0.2 * (1 + v);
            ctx.lineTo(qx, qy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4 * (0.3 + u));
      g.addColorStop(0, 'rgba(255,250,240,' + 0.8 * (1 - u) + ')');
      g.addColorStop(0.4, 'rgba(217,199,180,' + 0.35 * (1 - u) + ')');
      g.addColorStop(1, 'rgba(217,199,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 4 * (0.3 + u), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = (1 - u) * 0.8;
      ctx.strokeStyle = '#efe6dc';
      ctx.lineWidth = 2 * (1 - u) + 0.6;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 6 * (1 - Math.pow(1 - u, 3)), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  for (const f of pfx) {
    if (f.k !== 'calor' || f.t > 1.4) {
      continue;
      // Venus: sus nubes de ácido, que giran muy rápido y tienen relámpagos dentro, suben hacia el
      // anillo de arriba
    }
    const u = f.t / 1.4,
      pr = rr(pLevel) * S,
      R1 = rr(level + 1) * S,
      x = CX + Math.cos(pAng) * pr,
      y = CY + Math.sin(pAng) * pr,
      k = Math.min(1, f.t / 0.12) * (1 - u);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, 60 * S * (0.5 + u));
    g.addColorStop(0, 'rgba(255,200,110,' + 0.5 * k + ')');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 60 * S * (0.5 + u), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const blobs = [];
    for (let i = 0; i < 18; i++) {
      const h1 = hsh(i, 1),
        h2 = hsh(i, 2),
        reach = Math.min(1, u * 1.8) * (0.45 + 0.65 * h1);
      const rad = pr + (R1 - pr) * reach * 1.15,
        ang =
          pAng +
          (h2 - 0.5) * 1.1 * (0.4 + reach) +
          f.t * 0.35 * (0.5 + h1) +
          Math.sin(t * 2 + i) * 0.04,
        bx = CX + Math.cos(ang) * rad,
        by = CY + Math.sin(ang) * rad,
        // giran en un solo sentido, como la superrotación de Venus
        br = (9 + 14 * h1) * S * (0.5 + reach) * (1 + 0.25 * Math.sin(t * 3 + i));
      blobs.push([bx, by, br]);
      const cg = ctx.createRadialGradient(bx - br * 0.25, by - br * 0.25, br * 0.1, bx, by, br);
      cg.addColorStop(0, 'rgba(255,236,170,' + 0.5 * k + ')');
      cg.addColorStop(0.6, 'rgba(226,180,90,' + 0.35 * k + ')');
      cg.addColorStop(1, 'rgba(180,120,50,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const n = Math.floor(f.t / 0.14),
      ph = frac(f.t / 0.14);
    if (f.t > 0.15 && f.t < 1.15 && ph < 0.4 && hsh(n, 7) < 0.75) {
      const [bx, by, br] = blobs[Math.floor(hsh(n, 8) * blobs.length)],
        fl = 1 - ph / 0.4; // un relámpago dentro de la nube
      const lg = ctx.createRadialGradient(bx, by, 0, bx, by, br * 1.6);
      lg.addColorStop(0, 'rgba(255,250,255,' + 0.55 * fl + ')');
      lg.addColorStop(1, 'rgba(230,210,255,0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(bx, by, br * 1.6, 0, Math.PI * 2);
      ctx.fill();
      let qx = bx - br * 0.6,
        qy = by,
        b = hsh(n, 9) * Math.PI * 2;
      const pts = [[qx, qy]];
      for (let j = 0; j < 6; j++) {
        b += (hsh(n, j + 10) - 0.5) * 1.6;
        qx += Math.cos(b) * br * 0.3;
        qy += Math.sin(b) * br * 0.3;
        pts.push([qx, qy]);
      }
      for (const [lw, al, col] of [
        [5, 0.25, '#c9b8ff'],
        [1.4, 0.95, '#ffffff'],
      ]) {
        ctx.globalAlpha = al * fl;
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        pts.forEach(([a, c], j) => (j ? ctx.lineTo(a, c) : ctx.moveTo(a, c)));
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  if (predT > 0 && state === 'play') {
    // Neptuno: sus vientos (los más rápidos del sistema solar) recorren el anillo y forman un
    // remolino donde estará cada asteroide
    const ring = rings.get(level + 1);
    if (ring) {
      const R = rr(level + 1) * S,
        dt2 = jumpDur(),
        k = Math.min(1, predT / 0.4, (3 - predT) / 0.12),
        ft = 3 - predT,
        span = Math.PI * Math.min(1, ft / 0.45),
        sg = Math.sign((ring.w || 1) * (ring.sgn || 1)) || 1;
      let hit = false;
      const vis = a => Math.abs(Math.atan2(Math.sin(a - pAng), Math.cos(a - pAng))) < span;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let i = 0; i < 30; i++) {
        // ráfagas
        const a = hsh(i, 1) * Math.PI * 2 + t * (2.4 + 1.6 * hsh(i, 2)) * sg,
          len = 0.16 + 0.3 * hsh(i, 3),
          rq = R + (hsh(i, 4) - 0.5) * 18 * S;
        if (!vis(a)) {
          continue;
        }
        for (let j = 0; j < 4; j++) {
          ctx.globalAlpha = k * (0.1 + 0.17 * j);
          ctx.strokeStyle = i % 3 ? '#8fb8ff' : '#e2ecff';
          ctx.lineWidth = 1 + 0.7 * j;
          ctx.beginPath();
          const a1 = a - (sg * len * (j + 1)) / 4,
            a2 = a - (sg * len * j) / 4;
          ctx.arc(CX, CY, rq, Math.min(a1, a2), Math.max(a1, a2));
          ctx.stroke();
        }
      }
      if (span < Math.PI) {
        for (const sd of [-1, 1]) {
          const a = pAng + sd * span,
            x = CX + Math.cos(a) * R,
            y = CY + Math.sin(a) * R,
            g = ctx.createRadialGradient(x, y, 0, x, y, 26 * S);
          g.addColorStop(0, 'rgba(200,225,255,' + 0.6 * k + ')');
          g.addColorStop(1, 'rgba(120,160,255,0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, 26 * S, 0, Math.PI * 2);
          ctx.fill();
        }
      } // el frente de la ráfaga
      for (const o of ring.obs) {
        if (o.star || o.gone || o.melt) {
          continue;
        }
        const ph =
            (ring.frozenT > 0
              ? ring.phase + ring.w * (ring.sgn || 1) * Math.max(0, dt2 - ring.frozenT)
              : ring.sync
                ? ring.w * (beatTime() + dt2)
                : ring.phase + ring.w * (ring.sgn || 1) * dt2) - (ring.poff || 0),
          oa = o.a + (o.dir || 1) * ph + (ring.off || 0),
          x = CX + Math.cos(oa) * R,
          y = CY + Math.sin(oa) * R,
          rad = obsRad(ring, o) * S * 1.1;
        if (
          Math.abs(Math.atan2(Math.sin(oa - pAng), Math.cos(oa - pAng))) * rr(level + 1) <
          PR * sizeK() + obsRad(ring, o) * 0.66
        ) {
          hit = true;
        }
        if (!vis(oa)) {
          continue;
        }
        const oa0 = obsAng(ring, o),
          dA = Math.atan2(Math.sin(oa - oa0), Math.cos(oa - oa0));
        if (ctx.setLineDash) {
          ctx.setLineDash([3, 6]);
        }
        ctx.lineDashOffset = -t * 40;
        ctx.globalAlpha = 0.4 * k;
        ctx.strokeStyle = '#9cc0ff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(CX, CY, R, Math.min(oa0, oa0 + dA), Math.max(oa0, oa0 + dA));
        ctx.stroke();
        if (ctx.setLineDash) {
          ctx.setLineDash([]);
        } // la corriente que lo lleva
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(oa + Math.PI / 2);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad * 2.2);
        g.addColorStop(0, 'rgba(70,120,240,' + 0.5 * k + ')');
        g.addColorStop(1, 'rgba(50,90,220,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, rad * 2.2, 0, Math.PI * 2);
        ctx.fill();
        for (let arm = 0; arm < 3; arm++) {
          ctx.beginPath();
          for (let j = 0; j <= 18; j++) {
            const s2 = j / 18,
              an = (arm * Math.PI * 2) / 3 + s2 * 2.8 - t * 5 * sg,
              rq = rad * (0.4 + 1.5 * s2);
            j
              ? ctx.lineTo(Math.cos(an) * rq, Math.sin(an) * rq * 0.62)
              : ctx.moveTo(Math.cos(an) * rq, Math.sin(an) * rq * 0.62);
          } // brazos del remolino
          ctx.globalAlpha = 0.75 * k;
          ctx.strokeStyle = arm ? '#b9d3ff' : '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.9 * k;
        ctx.fillStyle = '#081232';
        ctx.beginPath();
        ctx.ellipse(0, 0, rad * 0.62, rad * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.6 * k;
        ctx.strokeStyle = '#6f9cff';
        ctx.lineWidth = 1;
        ctx.stroke(); // el ojo oscuro, como la Gran Mancha Oscura
        ctx.globalCompositeOperation = 'lighter';
        const wc = ctx.createRadialGradient(
          rad * 0.75,
          -rad * 0.45,
          0,
          rad * 0.75,
          -rad * 0.45,
          rad * 0.45,
        );
        wc.addColorStop(0, 'rgba(255,255,255,' + 0.8 * k + ')');
        wc.addColorStop(1, 'rgba(220,235,255,0)');
        ctx.fillStyle = wc;
        ctx.beginPath();
        ctx.arc(rad * 0.75, -rad * 0.45, rad * 0.45, 0, Math.PI * 2);
        ctx.fill(); // su nube blanca de metano
        ctx.restore();
        ctx.globalCompositeOperation = 'lighter';
      }
      ctx.globalAlpha = k;
      ctx.strokeStyle = hit ? '#ff7a6b' : '#8ff0c0';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(CX, CY, R, pAng - 0.09, pAng + 0.09);
      ctx.stroke(); // verde: puedes saltar · rojo: espera
      ctx.restore();
    }
  }
  if (eclipseT > 0) {
    // Luna: pasa por delante del agujero negro y lo tapa; queda su corona de luz, y todo se vuelve
    // lento y azulado
    const D = 2.5,
      u = 1 - eclipseT / D,
      k = Math.min(1, eclipseT / 0.35, (D - eclipseT) / 0.3),
      mr = sunW * 1.08,
      xq = (u - 0.5) * 2,
      // más lento cerca del centro, como un eclipse de verdad
      sq = Math.sign(xq) * Math.pow(Math.abs(xq), 1.6);
    const mx = CX + sq * mr * 2.2,
      my = CY - sq * mr * 0.5,
      dist = Math.hypot(mx - CX, my - CY),
      dn = dist / mr,
      cover = clamp(1 - dist / (mr * 1.6), 0, 1);
    ctx.save();
    ctx.globalAlpha = (0.18 + 0.22 * cover) * k;
    ctx.fillStyle = '#081030';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 46; i++) {
      ctx.globalAlpha = cover * k * (0.35 + 0.5 * hsh(i, 3)) * (0.7 + 0.3 * Math.sin(t * 3 + i));
      ctx.fillStyle = i % 5 ? '#ffffff' : '#cfd9ff';
      const s2 = 1 + (hsh(i, 4) > 0.85 ? 1 : 0);
      ctx.fillRect(hsh(i, 1) * W, hsh(i, 2) * H, s2, s2);
    } // al oscurecer salen las estrellas
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    const cg = ctx.createRadialGradient(CX, CY, mr * 0.95, CX, CY, mr * 2.6);
    cg.addColorStop(0, 'rgba(235,240,255,' + 0.75 * cover * k + ')');
    cg.addColorStop(0.3, 'rgba(190,205,255,' + 0.25 * cover * k + ')');
    cg.addColorStop(1, 'rgba(160,180,255,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(CX, CY, mr * 2.6, 0, Math.PI * 2);
    ctx.fill(); // la corona
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + hsh(i, 8) * 0.6 + t * 0.05,
        l = mr * (1.5 + 1.3 * hsh(i, 5)),
        w = 0.16 + 0.14 * hsh(i, 6); // serpentinas de la corona: suaves y de largos distintos
      const gg = ctx.createLinearGradient(
        CX + Math.cos(a) * mr,
        CY + Math.sin(a) * mr,
        CX + Math.cos(a) * l,
        CY + Math.sin(a) * l,
      );
      gg.addColorStop(0, 'rgba(235,240,255,' + 0.4 * cover * k + ')');
      gg.addColorStop(1, 'rgba(200,215,255,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a - w) * mr, CY + Math.sin(a - w) * mr);
      ctx.quadraticCurveTo(
        CX + Math.cos(a) * mr * 1.2,
        CY + Math.sin(a) * mr * 1.2,
        CX + Math.cos(a) * l,
        CY + Math.sin(a) * l,
      );
      ctx.quadraticCurveTo(
        CX + Math.cos(a) * mr * 1.2,
        CY + Math.sin(a) * mr * 1.2,
        CX + Math.cos(a + w) * mr,
        CY + Math.sin(a + w) * mr,
      );
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = k;
    let res = null;
    try {
      res = PLGL.ok()
        ? PLGL.render('luna', mr * 2 * 1.4, t * 0.1, [0, 0, -1], [0.25, 0.27, 0.35], t)
        : null;
    } catch (e) {
      res = null;
    } // la Luna a contraluz: solo se ve su borde
    if (res) {
      const h = mr * res.pad;
      ctx.drawImage(res.cv, mx - h, my - h, 2 * h, 2 * h);
    }
    ctx.fillStyle = 'rgba(6,7,14,.93)';
    ctx.beginPath();
    ctx.arc(mx, my, mr * 0.995, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(220,230,255,' + 0.6 * k + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.stroke();
    const chrom = (1 - smst(0.05, 0.4, dn)) * k;
    if (chrom > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(mx, my, mr * 0.99, 0, Math.PI * 2, true);
      ctx.clip('evenodd'); // la cromosfera: un borde rosado que se ve un instante
      ctx.globalAlpha = 0.7 * chrom;
      ctx.strokeStyle = '#ff6f9a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(CX, CY, mr * 0.995, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = hsh(i, 6) * Math.PI * 2,
          h = mr * (0.06 + 0.06 * hsh(i, 7));
        ctx.globalAlpha = 0.8 * chrom;
        ctx.strokeStyle = '#ff5a86';
        ctx.lineWidth = 2; // pequeñas protuberancias rosadas
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(a - 0.05) * mr, CY + Math.sin(a - 0.05) * mr);
        ctx.quadraticCurveTo(
          CX + Math.cos(a) * (mr + h * 2),
          CY + Math.sin(a) * (mr + h * 2),
          CX + Math.cos(a + 0.05) * mr,
          CY + Math.sin(a + 0.05) * mr,
        );
        ctx.stroke();
      }
      ctx.restore();
    }
    if (dist > 1) {
      const a0 = Math.atan2(CY - my, CX - mx),
        bx = CX + Math.cos(a0) * mr * 0.99,
        by = CY + Math.sin(a0) * mr * 0.99;
      const bd = smst(0.03, 0.08, dn) * (1 - smst(0.16, 0.27, dn)) * k,
        dd = smst(0.11, 0.2, dn) * (1 - smst(0.36, 0.58, dn)) * k;
      for (let j = 0; j < 6; j++) {
        if (bd <= 0.01) {
          break;
        }
        const a = a0 + (j - 2.5) * 0.1,
          fl = 0.6 + 0.4 * Math.sin(t * 40 + j * 2.3);
        if (hsh(j, 11) < 0.25) {
          continue;
        } // las perlas de Baily: luz que pasa entre las montañas de la Luna
        const x = CX + Math.cos(a) * mr * 0.99,
          y = CY + Math.sin(a) * mr * 0.99,
          g = ctx.createRadialGradient(x, y, 0, x, y, 7 * S);
        g.addColorStop(0, 'rgba(255,255,255,' + bd * fl + ')');
        g.addColorStop(1, 'rgba(255,240,220,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 7 * S, 0, Math.PI * 2);
        ctx.fill();
      }
      if (dd > 0.01) {
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, mr * 1.3);
        g.addColorStop(0, 'rgba(255,255,255,' + dd + ')');
        g.addColorStop(0.12, 'rgba(255,250,235,' + 0.55 * dd + ')');
        g.addColorStop(1, 'rgba(230,235,255,0)'); // el anillo de diamante
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, mr * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineCap = 'round';
        for (let j = 0; j < 4; j++) {
          const a = (j * Math.PI) / 2 + 0.3,
            L = mr * (j % 2 ? 0.8 : 1.3) * dd;
          ctx.globalAlpha = 0.85 * dd;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx - Math.cos(a) * L, by - Math.sin(a) * L);
          ctx.lineTo(bx + Math.cos(a) * L, by + Math.sin(a) * L);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}
/**
 * Dibuja cómo se ve un anillo afectado por un poder: escarcha de Urano, flechas de Venus o
 * ráfagas de Neptuno.
 *
 * @param {object} ring Anillo (usa frozenT, revT y windT).
 * @param {number} R Radio del anillo, en unidades del mundo.
 * @param {number} alpha Opacidad del anillo, de 0 a 1.
 */
function drawRingPower(ring, R, alpha) {
  const Rs = R * S;
  if (ring.frozenT > 0) {
    // Urano: la escarcha nace donde estás y crece por el anillo en cristales; al final se agrieta y
    // se rompe
    const el = (ring.frz0 || 3) - ring.frozenT - ((ring.frz0 || 3) > 3.3 ? 0.18 : 0),
      gr = clamp(el / 0.55, 0, 1),
      span = Math.PI * (1 - Math.pow(1 - gr, 2)),
      c = ring.frzA !== undefined ? ring.frzA : pAng,
      kk = Math.min(1, ring.frozenT / 0.25) * alpha;
    if (span > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.28 * kk;
      ctx.strokeStyle = '#9fdcff';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.arc(CX, CY, Rs, c - span, c + span);
      ctx.stroke();
      ctx.globalAlpha = 0.9 * kk;
      ctx.strokeStyle = '#effbff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(CX, CY, Rs, c - span, c + span);
      ctx.stroke();
      ctx.globalAlpha = 0.35 * kk;
      ctx.lineWidth = 0.8;
      for (const d of [-4.5, 4.5]) {
        ctx.beginPath();
        ctx.arc(CX, CY, Rs + d * S * 0.6, c - span, c + span);
        ctx.stroke();
      }
      if (gr < 1) {
        for (const sd of [-1, 1]) {
          const a = c + sd * span,
            x = CX + Math.cos(a) * Rs,
            y = CY + Math.sin(a) * Rs,
            g = ctx.createRadialGradient(x, y, 0, x, y, 14);
          g.addColorStop(0, 'rgba(255,255,255,' + 0.9 * kk + ')');
          g.addColorStop(1, 'rgba(180,230,255,0)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      } // el borde de la escarcha que avanza
      ctx.lineWidth = 1.1;
      for (let i = 0; i < 70; i++) {
        const da = (hsh(i, 1) * 2 - 1) * Math.PI,
          la = clamp((span - Math.abs(da)) / 0.35, 0, 1);
        if (la <= 0) {
          continue;
        } // cristales: una aguja con ramas a 60°, como la escarcha real
        const a = c + da,
          x = CX + Math.cos(a) * Rs,
          y = CY + Math.sin(a) * Rs,
          nx = Math.cos(a),
          ny = Math.sin(a),
          side = hsh(i, 2) < 0.5 ? -1 : 1,
          len = (6 + 12 * hsh(i, 3)) * S * 0.6 * la;
        if (i % 6 === 0) {
          ctx.globalAlpha = 0.8 * kk;
          ctx.strokeStyle = '#ffffff';
          flake(x + nx * side * len * 0.5, y + ny * side * len * 0.5, len * 0.45, hsh(i, 4) * 3);
          continue;
        }
        const tw = (hsh(i, 5) - 0.5) * 0.9,
          ex = x + (nx * Math.cos(tw) - ny * Math.sin(tw)) * side * len,
          ey = y + (ny * Math.cos(tw) + nx * Math.sin(tw)) * side * len;
        ctx.globalAlpha = (0.4 + 0.4 * hsh(i, 6)) * kk;
        ctx.strokeStyle = i % 3 ? '#d6f6ff' : '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        for (const q of [0.3 + 0.2 * hsh(i, 7), 0.65 + 0.2 * hsh(i, 8)]) {
          const bx = x + (ex - x) * q,
            by = y + (ey - y) * q,
            bl = len * (0.2 + 0.25 * hsh(i, 9)) * (1.1 - q);
          for (const s2 of [-1, 1]) {
            if (hsh(i, s2 + q) < 0.2) {
              continue;
            }
            const ba = Math.atan2(ey - y, ex - x) + (s2 * Math.PI) / 3;
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(ba) * bl, by + Math.sin(ba) * bl);
          }
        }
        ctx.stroke();
      }
      for (const o of ring.obs) {
        if (o.star || o.gone) {
          continue;
        }
        const oa = obsAng(ring, o);
        if (Math.abs(Math.atan2(Math.sin(oa - c), Math.cos(oa - c))) > span) {
          continue;
        } // los asteroides quedan con una costra de hielo
        const x = CX + Math.cos(oa) * Rs,
          y = CY + Math.sin(oa) * Rs,
          rad = obsRad(ring, o) * S * 1.12;
        const g = ctx.createRadialGradient(x, y, rad * 0.3, x, y, rad * 1.5);
        g.addColorStop(0, 'rgba(190,240,255,' + 0.3 * kk + ')');
        g.addColorStop(0.7, 'rgba(160,225,255,' + 0.22 * kk + ')');
        g.addColorStop(1, 'rgba(160,225,255,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.85 * kk;
        ctx.strokeStyle = '#f2fcff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, rad * 1.02, Math.PI * 0.9, Math.PI * 1.75);
        ctx.stroke();
        ctx.lineWidth = 1;
        for (let j = 0; j < 6; j++) {
          const a = (j * Math.PI) / 3 + o.seed,
            l = rad * (0.25 + 0.2 * hsh(j, o.seed));
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
          ctx.lineTo(x + Math.cos(a) * (rad + l), y + Math.sin(a) * (rad + l));
          ctx.stroke();
        }
      }
      if (ring.frozenT < 0.5) {
        const cq = (0.5 - ring.frozenT) / 0.5;
        ctx.globalAlpha = 0.9 * cq * alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.1; // grietas
        for (let i = 0; i < 12; i++) {
          let a = c + (hsh(i, 21) * 2 - 1) * span,
            rq = Rs - 6 * S * 0.6;
          ctx.beginPath();
          ctx.moveTo(CX + Math.cos(a) * rq, CY + Math.sin(a) * rq);
          for (let j = 0; j < 4; j++) {
            a += (hsh(i, j + 22) - 0.5) * 0.04;
            rq += 3 * S * 0.6 * cq;
            ctx.lineTo(CX + Math.cos(a) * rq, CY + Math.sin(a) * rq);
          }
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (ring.frozenT < 0.3 && !ring.shat) {
      ring.shat = 1;
      const Rw = R; // el hielo se rompe en pedazos
      for (let i = 0; i < 46; i++) {
        const a = c + (Math.random() * 2 - 1) * span,
          v = 30 + Math.random() * 110,
          d = Math.random() < 0.5 ? 1 : -1;
        particles.push({
          x: Math.cos(a) * Rw,
          y: Math.sin(a) * Rw,
          vx: Math.cos(a) * v * d + (Math.random() - 0.5) * 40,
          vy: Math.sin(a) * v * d + (Math.random() - 0.5) * 40,
          life: 0.5 + Math.random() * 0.6,
          col: ['#ffffff', '#d6f6ff', '#a8e8ff'][i % 3],
          s: 0.9 + Math.random() * 1.6,
        });
      }
      if (alpha > 0.6) {
        noise(0.25, 9000, 4000, 0.14, 'highpass');
      }
    }
  }
  if (ring.revT > 0) {
    // Venus: flechas doradas que giran al revés
    ctx.save();
    ctx.globalAlpha = ring.revT * alpha;
    ctx.strokeStyle = '#ffd58a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const sg = ring.w >= 0 ? 1 : -1;
    for (let i = 0; i < 10; i++) {
      const a = ring.phase + (i * Math.PI) / 5;
      ctx.beginPath();
      ctx.arc(CX, CY, Rs + 9, a, a + sg * 0.22, sg < 0);
      ctx.stroke();
      const e = a + sg * 0.22,
        ex = CX + Math.cos(e) * (Rs + 9),
        ey = CY + Math.sin(e) * (Rs + 9),
        tx = -Math.sin(e) * sg,
        ty = Math.cos(e) * sg,
        nx = Math.cos(e),
        ny = Math.sin(e);
      ctx.beginPath();
      ctx.moveTo(ex - tx * 5 + nx * 4, ey - ty * 5 + ny * 4);
      ctx.lineTo(ex, ey);
      ctx.lineTo(ex - tx * 5 - nx * 4, ey - ty * 5 - ny * 4);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (ring.windT > 0) {
    // Neptuno: ráfagas de viento azul que empujan el anillo
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const a = (ring.off || 0) + (i * Math.PI) / 8 + t * 2,
        rr2 = Rs + ((i % 3) - 1) * 7;
      ctx.globalAlpha = ring.windT * 0.6 * alpha;
      ctx.strokeStyle = i % 2 ? '#9cc0ff' : '#dbe8ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(CX, CY, rr2, a, a + 0.35);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Cambia `burnT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setBurnT(value) {
  burnT = value;
  return value;
}

/**
 * Cambia `eclipseT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setEclipseT(value) {
  eclipseT = value;
  return value;
}

/**
 * Cambia `ghostT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setGhostT(value) {
  ghostT = value;
  return value;
}

/**
 * Cambia `lastJT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLastJT(value) {
  lastJT = value;
  return value;
}

/**
 * Cambia `periLeft` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPeriLeft(value) {
  periLeft = value;
  return value;
}

/**
 * Cambia `pfx` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPfx(value) {
  pfx = value;
  return value;
}

/**
 * Cambia `predT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPredT(value) {
  predT = value;
  return value;
}

/**
 * Cambia `ringBoostNow` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setRingBoostNow(value) {
  ringBoostNow = value;
  return value;
}

/**
 * Cambia `shieldT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setShieldT(value) {
  shieldT = value;
  return value;
}

/**
 * Cambia `strainK` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setStrainK(value) {
  strainK = value;
  return value;
}

export {
  bhWob,
  burnT,
  caronteSaves,
  drawCaronteBack,
  drawPowerFx,
  drawPowerScene,
  drawRingPower,
  eclipseT,
  ghostT,
  hsh,
  lastJT,
  periLeft,
  pfx,
  powerUpdate,
  predT,
  ringBoostNow,
  ringSpark,
  shieldT,
  strainK,
  strainNow,
  usePower,
  vaporize,
};

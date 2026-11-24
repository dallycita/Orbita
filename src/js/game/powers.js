/**
 * Poderes de cada planeta: se cargan con saltos Perfectos y se usan deslizando hacia arriba o con
 * la tecla D. Cada uno nace de un dato real del planeta y tiene su propio efecto visual y sonido.
 * Los efectos en curso viven en `pfx` ({k: tipo, t: segundos desde que empezó}); `powerUpdate` los
 * avanza y `drawPowerFx`, `drawPowerScene` y `drawRingPower` los dibujan.
 */
import { CX, CY, PR, R0, S, buzz, clamp, ctx, frac, reduceMotion } from '../core/display.js';
import { AC, ROOT, SCALE, cowbell, noise, sub } from '../audio/engine.js';
import {
  run,
  setCharge,
  setCrossed,
  setJumpT,
  setJumpTarget,
  setJumping,
  state,
} from '../core/state.js';
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
} from './planets.js';
import {
  curGoal,
  effects,
  hole,
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
  time,
  tutorialState,
} from '../core/run-state.js';
import { obsAng } from './beat.js';

import { settings } from '../core/settings.js';

import { uiTone } from '../audio/ui-sounds.js';
import { rr } from '../core/geometry.js';
import { noteDouble } from './missions.js';

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
  if (tutorialState.tutorial || state !== 'play') {
    return 0;
  }
  const frag = clamp(-pst().res / 50, 0, 1),
    near = clamp((1.5 - (run.pLevel - hole.sunLevel - catchMargin())) / 1.1, 0, 1);
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
    if (AC && !settings.muted) {
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
  setTexts(
    effects.texts.filter(x => !x.tip && x.key !== 'pow' && x.y !== -R0 - 96 && x.y !== -R0 - 76),
  );
  effects.texts.push({
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
    if (!effects.texts.some(x => x.key === 'pow')) {
      effects.texts.push({
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
  const nr = run.rings.get(run.level + 1);
  if (id === 'marte') {
    // Monte Olimpo: salto triple
    const up = Math.min(3, curGoal() - run.level);
    if (mid) {
      const p1 = Math.min(run.jumpT / jumpDur(), 1),
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
      pfx.push({ k: 'destello', t: 0, a: run.pAng, l0: run.pLevel });
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
          Math.abs(
            Math.atan2(Math.sin(obsAng(nr, o) - run.pAng), Math.cos(obsAng(nr, o) - run.pAng)),
          ),
          o,
        ])
        .sort((a, b) => a[0] - b[0])
        .slice(0, 2);
      for (const [, o] of near) {
        o.melt = time.t;
      }
      nr.heatT = 1;
    }
    pfx.push({ k: 'calor', t: 0 });
    noise(0.9, 400, 2500, 0.3, 'bandpass');
    powerShout('#ffb070');
  } else if (id === 'jupiter') {
    // Empujón gravitacional: aleja al agujero negro
    setSunLevel(Math.max(-1.6, hole.sunLevel - 0.4));
    setLastEaten(Math.min(hole.lastEaten, Math.floor(hole.sunLevel)));
    // El resto del empujón y el temblor del agujero negro llegan con la onda (ver powerUpdate).
    pfx.push({ k: 'empujon', t: 0, a: run.pAng, l: run.pLevel, left: 0.8 });
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
      nr.frzA = run.pAng;
      nr.shat = 0;
    }
    {
      const n2 = run.rings.get(run.level + 2);
      if (n2) {
        n2.frozenT = 3.6;
        n2.frz0 = 3.6;
        n2.frzA = run.pAng;
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
  o.melt = time.t;
  o.burn = 1;
  setShake(Math.max(effects.shake, reduceMotion ? 0 : 4));
  setFlash(Math.max(effects.flash, 0.12));
  buzz([12]);
  const wx = (x - CX) / S,
    wy = (y - CY) / S;
  pfx.push({ k: 'plasma', t: 0, x: wx, y: wy });
  for (let i = 0; i < 34; i++) {
    const a = Math.random() * Math.PI * 2,
      v = 60 + Math.random() * 190;
    effects.particles.push({
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
  if (
    tutorialState.tutorial ||
    curPlanet !== 'pluton' ||
    shieldLeft <= 0 ||
    run.charge < chargeMax()
  ) {
    return false;
  }
  const ta = tx !== undefined ? Math.atan2(ty - y, tx - x) : Math.atan2(-y, -x);
  pfx.push({ k: 'caronte', t: 0, x, y, a: ta, ca: caronteAng() });
  setShieldLeft(0);
  setCharge(0);
  ghostT = 0.9;
  setSunLevel(Math.min(run.pLevel - catchMargin() - 0.6, hole.sunLevel + 0.6));
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
      effects.particles.push({
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
  effects.texts.push({
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
const caronteAng = () => time.t * 2.2;
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
    effects.particles.push({
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
    if (AC && !settings.muted) {
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
  if (eclipseT > 0 && time.slowTimer > 0) {
    setTimeScale(0.42);
  }
  for (const r of run.rings.values()) {
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
      if (o.melt && !o.gone && time.t - o.melt > (o.burn ? 0.16 : 0.7)) {
        o.gone = true;
        if (o.burn) {
          continue;
        }
        const R = rr(r.k !== undefined ? r.k : run.level + 1),
          oa = obsAng(r, o);
        // Gotas de roca fundida que caen hacia el agujero negro.
        for (let i = 0; i < 30; i++) {
          const a = Math.random() * Math.PI * 2,
            v = 15 + Math.random() * 70;
          effects.particles.push({
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
      setSunLevel(Math.max(-1.6, hole.sunLevel - q));
      setLastEaten(Math.min(hole.lastEaten, Math.floor(hole.sunLevel)));
    }
    if (f.k === 'arder' && burnT > 0) {
      f.t = Math.min(f.t, 0.5);
    }
  }
  pfx = pfx.filter(f => f.t < (f.k === 'arder' ? 1.2 : f.k === 'viento' ? 3.2 : 1.6));
  bhWob = Math.max(0, bhWob - dt * 1.1);
  if (run.jumping && run.jumpTarget === 3 && state === 'play' && Math.random() < 0.9) {
    // Marte: la tormenta de polvo que deja el salto
    const pr = rr(run.pLevel),
      x = Math.cos(run.pAng) * pr,
      y = Math.sin(run.pAng) * pr,
      a = run.pAng + Math.PI + (Math.random() - 0.5) * 1.2,
      v = 20 + Math.random() * 60;
    effects.particles.push({
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
  const pr = rr(run.pLevel) * S;
  return [CX + Math.cos(run.pAng) * pr, CY + Math.sin(run.pAng) * pr];
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
          Math.sin(th * 7 + time.t * 13 + i * 2) * r * 0.045 +
          Math.sin(th * 3 - time.t * 9) * r * 0.03;
      j
        ? ctx.lineTo(px + Math.cos(th) * rq, py + Math.sin(th) * rq)
        : ctx.moveTo(px + Math.cos(th) * rq, py + Math.sin(th) * rq);
    }
    ctx.closePath();
    ctx.stroke();
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
/** @returns {boolean} Verdadero si Caronte está listo para salvar a Plutón y debe verse. */
function caronteOn() {
  return (
    curPlanet === 'pluton' &&
    shieldLeft > 0 &&
    run.charge >= chargeMax() &&
    !tutorialState.tutorial &&
    state === 'play'
  );
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
  BURN_DUR,
  bhWob,
  burnT,
  caronteOn,
  caronteSaves,
  caronteXY,
  eclipseT,
  flake,
  ghostT,
  heatHaze,
  hsh,
  lastJT,
  periLeft,
  pfx,
  plPos,
  powerUpdate,
  predT,
  ringBoostNow,
  ringSpark,
  shieldT,
  smst,
  strainK,
  strainNow,
  usePower,
  vaporize,
};

/**
 * Ritmo y objetos del recorrido: sincronía con los golpes de la música, estrellas (la moneda del
 * juego), nebulosas y púlsares, los recorridos de los niveles 4 a 8 y la nova de Andrómeda.
 * Varias constantes (COIN_RINGS, NEB_AT, PUL_AT) se completan más abajo en este mismo archivo.
 */
import { ctx, frac, reduceMotion } from '../core/display.js';
import { AC, ROOT } from '../audio/engine.js';
import { TB, musicOn, musicStart } from '../audio/music-tracks.js';
import {
  run,
  setAppear,
  setAstFade,
  setCrossed,
  setJumpT,
  setJumpTarget,
  setJumping,
  setLevel,
} from '../core/state.js';
import { curGoal, setPending, time } from '../core/run-state.js';

import { COIN_RINGS } from '../data/levels.js';
import { settings } from '../core/settings.js';
import { lvStarsGot } from './progress.js';
import { uiTone } from '../audio/ui-sounds.js';
import { rr } from '../core/geometry.js';

/**
 * Fase dentro del golpe actual de la música.
 *
 * @returns {number} De 0 (justo en el golpe) a 1; -1 si no suena música.
 */
function beatPhase() {
  return AC && musicOn && musicStart >= 0 ? frac(beatTime() / TB) : -1;
}
/**
 * Intensidad del golpe: 1 justo en el bombo y se apaga rápido (más suave con movimiento reducido).
 *
 * @returns {number} De 0 a 1.
 */
function beatKick() {
  const x = beatPhase();
  return x < 0 ? 0 : Math.exp(-x * 7) * (reduceMotion ? 0.35 : 1);
}
/**
 * Respiración lenta con el bajo, un ciclo cada dos golpes.
 *
 * @returns {number} De 0 a 1; 0 si no suena música.
 */
function bassBreath() {
  return AC && musicOn && musicStart >= 0
    ? 0.5 - 0.5 * Math.cos(2 * Math.PI * frac(beatTime() / (2 * TB)))
    : 0;
}
let lastBeatIdx = -1;
/**
 * Tiempo de la canción descontando la latencia de salida del audio, para que lo visual coincida
 * con lo que se oye. Sin música usa el reloj del juego `t`.
 *
 * @returns {number} Segundos desde que empezó la música.
 */
function beatTime() {
  return AC && musicStart >= 0
    ? AC.currentTime - musicStart - (AC.outputLatency || AC.baseLatency || 0)
    : time.t;
}
/**
 * Ángulo real de un asteroide en su anillo. `poff` es lo que el anillo no giró mientras estuvo
 * congelado.
 *
 * @param {object} ring Anillo.
 * @param {object} o Asteroide del anillo.
 * @returns {number} Ángulo, en radianes.
 */
const obsAng = (ring, o) => o.a + (o.dir || 1) * (ring.phase - (ring.poff || 0)) + (ring.off || 0);
/**
 * Tamaño real de un asteroide: en los anillos de respiración crece y se encoge con el ritmo.
 *
 * @param {object} ring Anillo.
 * @param {object} o Asteroide del anillo.
 * @returns {number} Radio, en las mismas unidades que `o.r`.
 */
function obsRad(ring, o) {
  if (ring.type !== 'respiracion') {
    return o.r;
  }
  const x = frac(beatTime() / (4 * TB)),
    sz = 0.5 - 0.5 * Math.cos(2 * Math.PI * x); // respira cada 4 golpes: pequeño justo en el golpe
  return o.r * (0.3 + 0.7 * sz);
}
let wallet = 0;
let runCoins = 0;
let elWallet;
/**
 * Actualiza el contador de estrellas de la pantalla.
 *
 * @param {boolean} pop Hacer la animación de salto si el total subió.
 */
function updateWallet(pop) {
  if (!elWallet) {
    return;
  }
  // total de estrellas únicas de todo el juego, contado igual que en las tarjetas (por ejemplo
  // 2 / 48), con un anillo de progreso
  let got = 0,
    all = 0;
  COIN_RINGS.forEach((set, i) => {
    if (!set) {
      return;
    }
    all += set.size;
    const g = lvStarsGot(i);
    set.forEach(k => {
      if (g.includes(k)) {
        got++;
      }
    });
  });
  elWallet.innerHTML =
    '<svg class="wst" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg><b>' +
    got +
    '</b><i>/ ' +
    all +
    '</i>';
  elWallet.setAttribute('aria-label', 'Estrellas: ' + got + ' de ' + all);
  elWallet.classList.toggle('full', all > 0 && got >= all);
  if (pop && got > (updateWallet.last || 0) && elWallet.classList) {
    elWallet.classList.remove('pop');
    void elWallet.offsetWidth;
    elWallet.classList.add('pop');
  }
  updateWallet.last = got;
}
/** Sonido al recoger una estrella: cuatro notas que suben. */
function coinChime() {
  if (!AC || settings.muted) {
    return;
  }
  try {
    const n = AC.currentTime;
    [12, 16, 19, 24].forEach((sm, i) =>
      uiTone(ROOT * Math.pow(2, sm / 12), n + i * 0.05, 1.1, 0.045),
    );
  } catch (e) {}
}
/**
 * Dibuja una estrella para recoger, con brillo que late.
 *
 * @param {number} x Posición horizontal, en píxeles de pantalla.
 * @param {number} y Posición vertical, en píxeles de pantalla.
 * @param {number} sz Tamaño, en píxeles de pantalla.
 * @param {number} al Opacidad, de 0 a 1.
 */
function drawCoin(x, y, sz, al) {
  ctx.save();
  ctx.globalAlpha = al;
  const gl = ctx.createRadialGradient(x, y, 0, x, y, sz * 3);
  if (gl && gl.addColorStop) {
    gl.addColorStop(0, 'rgba(255,211,107,.6)');
    gl.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(x, y, sz * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const k = sz * (1.15 + 0.2 * Math.sin(time.t * 6));
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? k * 0.5 : k * 1.3;
    i
      ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
      : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,248,220,.9)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
let pushing = false;
let pushT = 0;
let pushFrom = 0;
let starBoost = false;
/**
 * Coloca un objeto en el mayor hueco entre los asteroides del anillo, para que se pueda alcanzar.
 *
 * @param {object} ring Anillo con su lista de asteroides `obs`.
 * @param {object} extra Datos que se agregan al objeto.
 * @returns {object} El objeto con su ángulo `a`, en radianes, y `got: false`.
 */
function placeInGap(ring, extra) {
  if (!ring.obs.length) {
    return Object.assign({ a: 0, got: false }, extra);
  }
  const angs = ring.obs
    .map(o => ((o.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2))
    .sort((x, y) => x - y);
  let bestGap = -1,
    bestA = 0;
  for (let i = 0; i < angs.length; i++) {
    const a0 = angs[i],
      a1 = i + 1 < angs.length ? angs[i + 1] : angs[0] + Math.PI * 2,
      gap = a1 - a0;
    if (gap > bestGap) {
      bestGap = gap;
      bestA = a0 + gap / 2;
    }
  }
  return Object.assign({ a: bestA, got: false }, extra);
}
/**
 * Dibuja una nebulosa: nubes rosadas que se mueven despacio y unas estrellitas.
 *
 * @param {number} x Posición horizontal, en píxeles de pantalla.
 * @param {number} y Posición vertical, en píxeles de pantalla.
 * @param {number} sz Tamaño, en píxeles de pantalla.
 * @param {number} al Opacidad, de 0 a 1.
 */
function drawNebula(x, y, sz, al) {
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const ox = Math.cos(i * 1.7 + time.t * 0.6) * sz * 0.8,
      oy = Math.sin(i * 2.3 + time.t * 0.5) * sz * 0.6,
      r = sz * (1.8 + 0.5 * Math.sin(time.t * 1.3 + i));
    const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
    if (g && g.addColorStop) {
      g.addColorStop(0, 'rgba(255,120,175,' + 0.5 * al + ')');
      g.addColorStop(1, 'rgba(255,90,160,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = al;
  ctx.fillStyle = '#fff3f8';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + Math.cos(i * 2.1) * sz * 0.6, y + Math.sin(i * 2.1) * sz * 0.5, 1.4, 1.4);
  }
  ctx.restore();
}
/**
 * Dibuja un púlsar: un núcleo azul con dos rayos opuestos que giran.
 *
 * @param {number} x Posición horizontal, en píxeles de pantalla.
 * @param {number} y Posición vertical, en píxeles de pantalla.
 * @param {number} sz Tamaño, en píxeles de pantalla.
 * @param {number} al Opacidad, de 0 a 1.
 */
function drawPulsar(x, y, sz, al) {
  ctx.save();
  ctx.globalAlpha = al;
  const a = time.t * 5.5; // gira muy rápido, como un faro
  for (const sg of [0, Math.PI]) {
    const bx = Math.cos(a + sg),
      by = Math.sin(a + sg),
      px = -by,
      py = bx,
      L = sz * 4.2;
    const g = ctx.createLinearGradient(x, y, x + bx * L, y + by * L);
    if (g && g.addColorStop) {
      g.addColorStop(0, 'rgba(200,225,255,.85)');
      g.addColorStop(1, 'rgba(140,190,255,0)');
      ctx.fillStyle = g;
    }
    ctx.beginPath();
    ctx.moveTo(x + px * sz * 0.25, y + py * sz * 0.25);
    ctx.lineTo(x + bx * L + px * sz * 0.6, y + by * L + py * sz * 0.6);
    ctx.lineTo(x + bx * L - px * sz * 0.6, y + by * L - py * sz * 0.6);
    ctx.lineTo(x - px * sz * 0.25, y - py * sz * 0.25);
    ctx.closePath();
    ctx.fill();
  }
  const cg = ctx.createRadialGradient(x, y, 0, x, y, sz * 1.8);
  if (cg && cg.addColorStop) {
    cg.addColorStop(0, 'rgba(235,245,255,1)');
    cg.addColorStop(0.4, 'rgba(150,200,255,.6)');
    cg.addColorStop(1, 'rgba(120,170,255,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(x, y, sz * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
/**
 * Sonido al tocar una nebulosa o un púlsar.
 *
 * @param {boolean} up Notas que suben (nebulosa) o que bajan (púlsar).
 */
function objChime(up) {
  if (!AC || settings.muted) {
    return;
  }
  try {
    const n = AC.currentTime,
      seq = up ? [7, 12, 16, 19] : [19, 15, 12, 7];
    seq.forEach((sm, i) => uiTone(ROOT * Math.pow(2, sm / 12), n + i * 0.06, 1.1, 0.04));
  } catch (e) {}
}
/** La nebulosa lanza al jugador hasta dos anillos hacia arriba, sin pasar la meta. */
function starLaunch() {
  const up = Math.min(2, curGoal() - run.level);
  if (up <= 0) {
    return;
  }
  setJumping(true);
  setJumpT(0);
  setJumpTarget(up);
  setCrossed(false);
  starBoost = true;
  setPending(false);
}
/** El púlsar empuja al jugador un anillo hacia abajo. */
function starPush() {
  if (run.level <= 0) {
    return;
  }
  pushFrom = run.level;
  setLevel(run.level - 1);
  pushing = true;
  pushT = 0;
  setAppear(0);
  setAstFade(0);
}
// Niveles 4 a 8 (índices 3 a 7): recorridos de tipos de anillo, objetos y dificultad.
// Cada recorrido es [cantidad, tipo]; courseMaps lo expande a un tipo por nivel de anillo.
const COURSES_X = {
  3: [
    [4, 'clasico'],
    [3, 'freno'],
    [2, 'clasico'],
    [3, 'muralla'],
    [3, 'freno'],
    [2, 'clasico'],
    [3, 'contragiro'],
    [3, 'respiracion'],
    [3, 'freno'],
    [2, 'clasico'],
    [1, 'gusano'],
    [12, 'orbita'],
    [2, 'clasico'],
    [3, 'freno'],
    [3, 'escalera'],
  ], // 29: boca del gusano · 30–41: dentro, modo Órbita
  4: [
    [4, 'clasico'],
    [3, 'marea'],
    [2, 'clasico'],
    [3, 'marea'],
    [3, 'freno'],
    [3, 'respiracion'],
    [3, 'marea'],
    [2, 'clasico'],
    [3, 'contragiro'],
    [3, 'marea'],
    [3, 'muralla'],
    [3, 'escalera'],
    [3, 'marea'],
    [3, 'freno'],
    [3, 'marea'],
    [2, 'clasico'],
    [3, 'escalera'],
  ],
  5: [
    [4, 'clasico'],
    [3, 'muralla'],
    [2, 'clasico'],
    [3, 'freno'],
    [3, 'respiracion'],
    [3, 'muralla'],
    [2, 'clasico'],
    [3, 'contragiro'],
    [3, 'muralla'],
    [3, 'escalera'],
    [3, 'freno'],
    [3, 'muralla'],
    [2, 'clasico'],
    [3, 'respiracion'],
    [3, 'contragiro'],
    [3, 'freno'],
    [3, 'escalera'],
  ],
  6: [
    [3, 'clasico'],
    [3, 'arrastre'],
    [2, 'clasico'],
    [3, 'muralla'],
    [3, 'arrastre'],
    [3, 'freno'],
    [3, 'respiracion'],
    [3, 'arrastre'],
    [3, 'contragiro'],
    [3, 'muralla'],
    [3, 'arrastre'],
    [3, 'freno'],
    [3, 'escalera'],
    [3, 'arrastre'],
    [3, 'muralla'],
    [3, 'contragiro'],
    [2, 'escalera'],
  ],
  7: [
    [3, 'clasico'],
    [3, 'muralla'],
    [3, 'arrastre'],
    [3, 'freno'],
    [3, 'muralla'],
    [3, 'respiracion'],
    [3, 'contragiro'],
    [3, 'escalera'],
    [3, 'arrastre'],
    [3, 'muralla'],
    [3, 'freno'],
    [3, 'contragiro'],
    [3, 'respiracion'],
    [3, 'arrastre'],
    [3, 'freno'],
    [2, 'muralla'],
    [2, 'escalera'],
  ],
};
const courseMaps = {};
// multiplicadores por nivel: velocidad de los anillos y del agujero negro
const RING_MUL = [1, 1, 1.08, 1.1, 1.12, 1.25, 1.4, 1.55];
const HOLE_MUL = [1, 0.95, 1.05, 1.12, 1.14, 1.25, 1.35, 1.45];
/**
 * Cuánto se estira un anillo en un ángulo: por fuerzas de marea (óvalo que gira) o por la onda de
 * la nova.
 *
 * @param {object} ring Anillo.
 * @param {number} ang Ángulo, en radianes.
 * @returns {number} Factor del radio (1 = sin estirar).
 */
const stretchAt = (ring, ang) =>
  ring && ring.type === 'marea'
    ? 1 + 0.05 * Math.cos(2 * (ang - (ring.tid || 0)))
    : ring && ring.type === 'nova'
      ? 1 + novaPush(ring, ang, beatTime()) / Math.max(20, rr(ring.k))
      : 1;
// Andrómeda, nova: la estrella se carga 3 golpes y estalla al empezar cada compás; su onda empuja
// la muralla hacia afuera y abre la órbita un instante.
const NOVA_BAR = () => 4 * TB;
const novaTau = tt => {
  const b = NOVA_BAR();
  return ((tt % b) + b) % b;
}; // tiempo desde el último estallido
/**
 * Forma de la onda de la nova: sube rápido, se sostiene y se apaga suave.
 *
 * @param {number} tau Segundos desde el último estallido.
 * @returns {number} De 0 a 1.
 */
function novaEnv(tau) {
  if (tau < 0.07) {
    return tau / 0.07;
  }
  if (tau < 0.46) {
    return 1;
  }
  if (tau < 0.86) {
    const u = (tau - 0.46) / 0.4;
    return 1 - u * u * (3 - 2 * u);
  }
  return 0;
}
/**
 * Cuánto empuja la nova la muralla hacia afuera en un ángulo. Entre estallidos la muralla se
 * hincha un poco en cada golpe de carga; durante la onda, empuja más cerca de la estrella.
 *
 * @param {object} ring Anillo de nova (`na` es el ángulo de la estrella).
 * @param {number} ang Ángulo, en radianes.
 * @param {number} tt Tiempo de la canción, en segundos.
 * @returns {number} Empuje, en píxeles de pantalla.
 */
function novaPush(ring, ang, tt) {
  const tau = novaTau(tt),
    e = novaEnv(tau);
  if (e <= 0) {
    if (tau < TB) {
      return 0;
    }
    const c = Math.floor(tau / TB),
      q = tau - c * TB;
    return (1.5 + 1.2 * c) * Math.exp(-q * 9);
  }
  const na = ring.na + ring.phase,
    d = Math.abs(Math.atan2(Math.sin(ang - na), Math.cos(ang - na)));
  if (d < 0.01) {
    return 0;
  }
  return e * (32 + 24 * Math.exp(-d * 1.1));
} // en el ángulo exacto de la estrella no hay empuje: ella se queda en su lugar

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initBeatObjects() {
  try {
    wallet = parseInt(localStorage.getItem('orbita_estrellas') || '0', 10) || 0;
  } catch (e) {}
  elWallet = document.getElementById('wallet');
  updateWallet(false);
  for (const i in COURSES_X) {
    const m = ['clasico'];
    for (const [n, ty] of COURSES_X[i]) {
      for (let j = 0; j < n; j++) {
        m.push(ty);
      }
    }
    while (m.length < 60) {
      m.push('clasico');
    }
    courseMaps[i] = m;
  }
  COIN_RINGS[3] = new Set([3, 8, 12, 17, 23, 45]);
  COIN_RINGS[4] = new Set([1, 3, 4, 18, 23, 32]);
  COIN_RINGS[5] = new Set([3, 7, 13, 17, 24, 37]);
  COIN_RINGS[6] = new Set([1, 3, 7, 11, 20, 42]);
  COIN_RINGS[7] = new Set([1, 3, 4, 13, 16, 28]);
  updateWallet(false);
}

/**
 * Cambia `lastBeatIdx` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setLastBeatIdx(value) {
  lastBeatIdx = value;
  return value;
}

/**
 * Cambia `pushT` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPushT(value) {
  pushT = value;
  return value;
}

/**
 * Cambia `pushing` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setPushing(value) {
  pushing = value;
  return value;
}

/**
 * Cambia `runCoins` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setRunCoins(value) {
  runCoins = value;
  return value;
}

/**
 * Cambia `starBoost` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setStarBoost(value) {
  starBoost = value;
  return value;
}

/**
 * Cambia `wallet` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
export function setWallet(value) {
  wallet = value;
  return value;
}

export {
  HOLE_MUL,
  NOVA_BAR,
  RING_MUL,
  bassBreath,
  beatKick,
  beatPhase,
  beatTime,
  coinChime,
  courseMaps,
  drawCoin,
  drawNebula,
  drawPulsar,
  elWallet,
  lastBeatIdx,
  novaEnv,
  novaPush,
  novaTau,
  objChime,
  obsAng,
  obsRad,
  placeInGap,
  pushFrom,
  pushT,
  pushing,
  runCoins,
  starBoost,
  starLaunch,
  starPush,
  stretchAt,
  updateWallet,
  wallet,
};

// ---------- sincronía con la música ----------
// fase dentro de cada golpe (0 = justo en el golpe); -1 si no hay música
function beatPhase() {
  return AC && musicOn && musicStart >= 0 ? frac(beatTime() / TB) : -1;
}
// intensidad del golpe: 1 justo en el bombo y se apaga rápido
function beatKick() {
  const x = beatPhase();
  return x < 0 ? 0 : Math.exp(-x * 7) * (reduceMotion ? 0.35 : 1);
}
// respiración lenta con el bajo (cada dos golpes)
function bassBreath() {
  return AC && musicOn && musicStart >= 0
    ? 0.5 - 0.5 * Math.cos(2 * Math.PI * frac(beatTime() / (2 * TB)))
    : 0;
}
let jumpOnBeat = false,
  lastBeatIdx = -1;
const ON_BEAT = 0.055;
function beatTime() {
  return AC && musicStart >= 0
    ? AC.currentTime - musicStart - (AC.outputLatency || AC.baseLatency || 0)
    : t;
}
// ángulo y tamaño reales de cada asteroide según el tipo de anillo
// poff: lo que el anillo no giró mientras estuvo congelado
const obsAng = (ring, o) => o.a + (o.dir || 1) * (ring.phase - (ring.poff || 0)) + (ring.off || 0);
function obsRad(ring, o) {
  if (ring.type !== 'respiracion') {
    return o.r;
  }
  const x = frac(beatTime() / (4 * TB)),
    sz = 0.5 - 0.5 * Math.cos(2 * Math.PI * x); // respira cada 4 golpes: pequeño justo en el golpe
  return o.r * (0.3 + 0.7 * sz);
}
// ---------- estrellas: la moneda del juego (para personalizar planetas más adelante) ----------
// aparecen en todos los niveles; se ganan en cada partida y se guardan
const COIN_RINGS = [
  new Set([4, 12, 22, 28, 37, 45]),
  new Set([4, 9, 15, 18, 32, 40]),
  new Set([4, 9, 15, 17, 31, 43]),
];
let wallet = 0,
  runCoins = 0;
try {
  wallet = parseInt(localStorage.getItem('orbita_estrellas') || '0', 10) || 0;
} catch (e) {}
const elWallet = document.getElementById('wallet');
function updateWallet(pop) {
  if (!elWallet) {
    return;
  }
  // total de estrellas únicas de todo el juego (igual que las tarjetas): ★ 2 / 48, con un anillo de
  // progreso
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
updateWallet(false);
function coinChime() {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime;
    [12, 16, 19, 24].forEach((sm, i) =>
      uiTone(ROOT * Math.pow(2, sm / 12), n + i * 0.05, 1.1, 0.045),
    );
  } catch (e) {}
}
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
  const k = sz * (1.15 + 0.2 * Math.sin(t * 6));
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
// ---------- desde el nivel 3: nebulosas y púlsares (no son asteroides, y tocarlos cambia algo)
// ----------
// nebulosas rosadas: nubes de hidrógeno donde nacen estrellas; su energía te impulsa dos anillos
// hacia arriba
// púlsares azules: restos de estrellas que explotaron y giran lanzando dos rayos; su radiación te
// empuja un anillo hacia abajo
const OBJ_NEBULA = new Set([3, 6, 10, 14, 18, 25, 33]);
const OBJ_PULSAR = new Set([22, 23, 26, 30, 34, 41, 42, 45]);
let pushing = false,
  pushT = 0,
  pushFrom = 0,
  starBoost = false;
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
function drawNebula(x, y, sz, al) {
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const ox = Math.cos(i * 1.7 + t * 0.6) * sz * 0.8,
      oy = Math.sin(i * 2.3 + t * 0.5) * sz * 0.6,
      r = sz * (1.8 + 0.5 * Math.sin(t * 1.3 + i));
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
function drawPulsar(x, y, sz, al) {
  ctx.save();
  ctx.globalAlpha = al;
  const a = t * 5.5; // gira muy rápido, como un faro
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
function objChime(up) {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime,
      seq = up ? [7, 12, 16, 19] : [19, 15, 12, 7];
    seq.forEach((sm, i) => uiTone(ROOT * Math.pow(2, sm / 12), n + i * 0.06, 1.1, 0.04));
  } catch (e) {}
}
function starLaunch() {
  const up = Math.min(2, curGoal() - level);
  if (up <= 0) {
    return;
  }
  jumping = true;
  jumpT = 0;
  jumpTarget = up;
  crossed = false;
  starBoost = true;
  pending = false;
}
function starPush() {
  if (level <= 0) {
    return;
  }
  pushFrom = level;
  level -= 1;
  pushing = true;
  pushT = 0;
  appear = 0;
  astFade = 0;
}
// ---------- niveles 4 a 8: recorridos, objetos y dificultad ----------
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
const RING_MUL = [1, 1, 1.08, 1.1, 1.12, 1.25, 1.4, 1.55];
const HOLE_MUL = [1, 0.95, 1.05, 1.12, 1.14, 1.25, 1.35, 1.45];
const NEB_AT = {
  3: new Set([2, 9, 16, 23, 42]),
  4: new Set([2, 8, 16, 30, 45]),
  5: new Set([2, 8, 16, 25, 36]),
  6: new Set([2, 9, 18, 28]),
  7: new Set([2, 14, 17, 29]),
};
const PUL_AT = {
  3: new Set([11, 22, 43]),
  4: new Set([9, 17, 22, 31, 46]),
  5: new Set([6, 14, 19, 34, 39]),
  6: new Set([10, 19, 29, 43]),
  7: new Set([5, 15, 38, 47]),
};
COIN_RINGS[3] = new Set([3, 8, 12, 17, 23, 45]);
COIN_RINGS[4] = new Set([1, 3, 4, 18, 23, 32]);
COIN_RINGS[5] = new Set([3, 7, 13, 17, 24, 37]);
COIN_RINGS[6] = new Set([1, 3, 7, 11, 20, 42]);
COIN_RINGS[7] = new Set([1, 3, 4, 13, 16, 28]);
updateWallet(false);
// fuerzas de marea: el anillo se estira como un óvalo que gira
const stretchAt = (ring, ang) =>
  ring && ring.type === 'marea'
    ? 1 + 0.05 * Math.cos(2 * (ang - (ring.tid || 0)))
    : ring && ring.type === 'nova'
      ? 1 + novaPush(ring, ang, beatTime()) / Math.max(20, rr(ring.k))
      : 1;
// Andrómeda · nova: la estrella se carga 3 golpes y estalla al empezar cada compás; su onda empuja
// la muralla hacia afuera y abre la órbita un instante
const NOVA_BAR = () => 4 * TB;
const novaTau = tt => {
  const b = NOVA_BAR();
  return ((tt % b) + b) % b;
}; // tiempo desde el último estallido
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
  } // en cada golpe de carga la muralla se hincha un poco: está por abrirse
  const na = ring.na + ring.phase,
    d = Math.abs(Math.atan2(Math.sin(ang - na), Math.cos(ang - na)));
  if (d < 0.01) {
    return 0;
  }
  return e * (32 + 24 * Math.exp(-d * 1.1));
} // la estrella se queda en su lugar

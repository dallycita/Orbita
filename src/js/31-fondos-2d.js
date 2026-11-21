// ---------- dentro de Andrómeda: toda la pantalla es la galaxia (colores reales) ----------
// núcleo amarillo-blanco de estrellas viejas, brazos espirales azules de estrellas jóvenes,
// franjas de polvo café, nebulosas rosadas de hidrógeno donde nacen estrellas, y sus satélites M32 y M110
let andCanvas = null,
  andKey = '';
function buildAndromeda() {
  const key = Math.round(W) + 'x' + Math.round(H);
  if (andCanvas && andKey === key) {
    return andCanvas;
  }
  if (!document.createElement) {
    return null;
  }
  const c = document.createElement('canvas');
  if (!c || !c.getContext) {
    return null;
  }
  const d = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.round(W * d);
  c.height = Math.round(H * d);
  const g = c.getContext('2d');
  if (!g || !g.setTransform) {
    return null;
  }
  g.setTransform(d, 0, 0, d, 0, 0);
  let sd = 4242;
  const R2 = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const D = Math.hypot(W, H),
    coreX = W * 0.06,
    coreY = H * 0.08;
  g.fillStyle = '#070618';
  g.fillRect(0, 0, W, H);
  const tint = g.createLinearGradient(0, 0, W, H);
  tint.addColorStop(0, 'rgba(60,40,90,.35)');
  tint.addColorStop(1, 'rgba(10,20,60,.35)');
  g.fillStyle = tint;
  g.fillRect(0, 0, W, H);
  // el plano de la galaxia: una banda azulada que cruza toda la pantalla
  g.save();
  g.translate(coreX, coreY);
  g.rotate(0.66);
  const band = g.createLinearGradient(0, -D * 0.32, 0, D * 0.32);
  band.addColorStop(0, 'rgba(90,110,220,0)');
  band.addColorStop(0.5, 'rgba(120,145,240,.2)');
  band.addColorStop(1, 'rgba(90,110,220,0)');
  g.fillStyle = band;
  g.fillRect(-D * 0.3, -D * 0.32, D * 1.8, D * 0.64);
  g.restore();
  // brazos espirales (espiral logarítmica en un disco inclinado)
  g.save();
  g.translate(coreX, coreY);
  g.rotate(0.66);
  g.scale(1, 0.45);
  const armPts = [[], []];
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < 1100; i++) {
      const th = (i / 1100) * 6.2 + arm * Math.PI,
        r = D * 0.05 * Math.exp(0.26 * th);
      if (r > D * 1.7) {
        break;
      }
      const jx = (R2() - 0.5) * r * 0.22,
        jy = (R2() - 0.5) * r * 0.22,
        x = Math.cos(th) * r + jx,
        y = Math.sin(th) * r + jy;
      armPts[arm].push([Math.cos(th) * r * 0.93, Math.sin(th) * r * 0.93]);
      const blue = ['rgba(150,180,255,', 'rgba(185,205,255,', 'rgba(120,150,245,'][i % 3];
      g.fillStyle = blue + (0.18 + R2() * 0.4) + ')';
      g.beginPath();
      g.arc(x, y, 0.6 + R2() * 2.4, 0, Math.PI * 2);
      g.fill();
      if (i % 22 === 0) {
        // nebulosas rosadas: hidrógeno donde nacen estrellas
        const hr = 5 + R2() * 14,
          hg = g.createRadialGradient(x, y, 0, x, y, hr * 2.2);
        hg.addColorStop(0, 'rgba(255,120,175,.55)');
        hg.addColorStop(1, 'rgba(255,90,160,0)');
        g.fillStyle = hg;
        g.beginPath();
        g.arc(x, y, hr * 2.2, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  // franjas de polvo, por dentro de cada brazo
  g.lineCap = 'round';
  for (const pts of armPts) {
    for (const [lw, al] of [
      [D * 0.028, 0.32],
      [D * 0.012, 0.45],
    ]) {
      g.strokeStyle = 'rgba(30,17,10,' + al + ')';
      g.lineWidth = lw;
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    }
  }
  g.restore();
  // núcleo de estrellas viejas
  const cg = g.createRadialGradient(coreX, coreY, 0, coreX, coreY, D * 0.5);
  cg.addColorStop(0, 'rgba(255,248,230,.95)');
  cg.addColorStop(0.07, 'rgba(255,232,190,.7)');
  cg.addColorStop(0.22, 'rgba(255,205,150,.28)');
  cg.addColorStop(0.5, 'rgba(240,180,130,.08)');
  cg.addColorStop(1, 'rgba(240,180,130,0)');
  g.fillStyle = cg;
  g.fillRect(0, 0, W, H);
  // M32 (pequeña, compacta) y M110 (alargada, tenue)
  const m32x = coreX + D * 0.14,
    m32y = coreY + D * 0.16,
    m32 = g.createRadialGradient(m32x, m32y, 0, m32x, m32y, D * 0.03);
  m32.addColorStop(0, 'rgba(255,240,210,.9)');
  m32.addColorStop(1, 'rgba(255,220,170,0)');
  g.fillStyle = m32;
  g.beginPath();
  g.arc(m32x, m32y, D * 0.03, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.translate(W * 0.88, H * 0.86);
  g.rotate(0.5);
  g.scale(1, 0.42);
  const m110 = g.createRadialGradient(0, 0, 0, 0, 0, D * 0.07);
  m110.addColorStop(0, 'rgba(255,236,210,.55)');
  m110.addColorStop(1, 'rgba(255,220,180,0)');
  g.fillStyle = m110;
  g.beginPath();
  g.arc(0, 0, D * 0.07, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // un cielo lleno de estrellas de distintos colores
  for (let i = 0; i < 520; i++) {
    const x = R2() * W,
      y = R2() * H,
      s = R2() < 0.9 ? 0.5 + R2() * 0.9 : 1.4 + R2() * 1.2;
    g.fillStyle =
      ['rgba(255,255,255,', 'rgba(200,215,255,', 'rgba(255,236,205,'][i % 3] +
      (0.35 + R2() * 0.55) +
      ')';
    g.fillRect(x, y, s, s);
  }
  andCanvas = c;
  andKey = key;
  return c;
}
const AND_TW = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 0.6180339) % 1,
  y: (i * 0.7548776) % 1,
  p: i * 1.7,
}));
function drawAndromeda() {
  const c = buildAndromeda();
  ctx.save();
  if (c) {
    const a = Math.sin(t * 0.025) * 0.025; // la galaxia gira tan lento que apenas se nota
    ctx.translate(W / 2, H / 2);
    ctx.rotate(a);
    ctx.scale(1.07, 1.07);
    ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(c, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#070618';
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  for (const s of AND_TW) {
    ctx.globalAlpha = 0.25 + 0.6 * Math.max(0, Math.sin(t * 1.7 + s.p));
    ctx.fillStyle = '#e8f0ff';
    ctx.fillRect(s.x * W, s.y * H, 1.8, 1.8);
  }
  ctx.globalAlpha = 1;
}

// ---------- dentro de la Gran Nube de Magallanes (como la muestran los telescopios) ----------
// barra central de estrellas viejas anaranjadas, nubes irregulares de estrellas azuladas, la nebulosa de la Tarántula (rosada, con su cúmulo R136),
// polvo oscuro, la Pequeña Nube a lo lejos con un puente tenue de estrellas, y los tres anillos de la supernova 1987A
let magCanvas = null,
  magKey = '';
function buildMagallanes() {
  const key = Math.round(W) + 'x' + Math.round(H);
  if (magCanvas && magKey === key) {
    return magCanvas;
  }
  if (!document.createElement) {
    return null;
  }
  const c = document.createElement('canvas');
  if (!c || !c.getContext) {
    return null;
  }
  const d = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.round(W * d);
  c.height = Math.round(H * d);
  const g = c.getContext('2d');
  if (!g || !g.setTransform) {
    return null;
  }
  g.setTransform(d, 0, 0, d, 0, 0);
  let sd = 1987;
  const R2 = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const D = Math.hypot(W, H);
  g.fillStyle = '#04070e';
  g.fillRect(0, 0, W, H);
  const tint = g.createLinearGradient(0, H, W, 0);
  tint.addColorStop(0, 'rgba(10,40,60,.4)');
  tint.addColorStop(1, 'rgba(40,20,50,.3)');
  g.fillStyle = tint;
  g.fillRect(0, 0, W, H);
  // nubes irregulares de estrellas (la forma de la galaxia es desordenada, sin espirales)
  for (let i = 0; i < 34; i++) {
    const x = R2() * W,
      y = R2() * H,
      r = D * (0.05 + R2() * 0.14),
      cg = g.createRadialGradient(x, y, 0, x, y, r);
    cg.addColorStop(0, 'rgba(190,210,255,' + (0.06 + R2() * 0.12) + ')');
    cg.addColorStop(1, 'rgba(160,190,255,0)');
    g.fillStyle = cg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // la barra central: estrellas viejas, anaranjadas, cruzando en diagonal
  g.save();
  g.translate(W * 0.42, H * 0.56);
  g.rotate(-0.42);
  g.scale(1, 0.26);
  const bar = g.createRadialGradient(0, 0, 0, 0, 0, D * 0.5);
  bar.addColorStop(0, 'rgba(255,225,180,.6)');
  bar.addColorStop(0.35, 'rgba(255,200,150,.22)');
  bar.addColorStop(1, 'rgba(255,190,140,0)');
  g.fillStyle = bar;
  g.beginPath();
  g.arc(0, 0, D * 0.5, 0, Math.PI * 2);
  g.fill();
  g.restore();
  for (let i = 0; i < 500; i++) {
    const u = (R2() - 0.5) * 2,
      v = (R2() - 0.5) * 0.28,
      x = W * 0.42 + Math.cos(-0.42) * u * D * 0.42 - Math.sin(-0.42) * v * D * 0.42,
      y = H * 0.56 + Math.sin(-0.42) * u * D * 0.42 + Math.cos(-0.42) * v * D * 0.42;
    g.fillStyle =
      'rgba(255,' +
      ((205 + R2() * 40) | 0) +
      ',' +
      ((150 + R2() * 60) | 0) +
      ',' +
      (0.25 + R2() * 0.5) +
      ')';
    g.fillRect(x, y, 0.6 + R2() * 1.4, 0.6 + R2() * 1.4);
  }
  // polvo oscuro en manchas
  for (let i = 0; i < 10; i++) {
    const x = R2() * W,
      y = R2() * H,
      r = D * (0.04 + R2() * 0.08),
      dg = g.createRadialGradient(x, y, 0, x, y, r);
    dg.addColorStop(0, 'rgba(14,8,6,.55)');
    dg.addColorStop(1, 'rgba(14,8,6,0)');
    g.fillStyle = dg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // la nebulosa de la Tarántula: rosada, con filamentos y su cúmulo de estrellas jóvenes R136
  const tx = W * 0.76,
    ty = H * 0.2,
    TR = D * 0.17;
  for (let i = 0; i < 14; i++) {
    const a = R2() * Math.PI * 2,
      rr2 = TR * (0.2 + R2() * 0.8),
      x = tx + Math.cos(a) * rr2 * 0.6,
      y = ty + Math.sin(a) * rr2 * 0.6,
      r = TR * (0.25 + R2() * 0.4),
      ng = g.createRadialGradient(x, y, 0, x, y, r);
    ng.addColorStop(0, 'rgba(255,90,150,' + (0.18 + R2() * 0.18) + ')');
    ng.addColorStop(1, 'rgba(255,70,140,0)');
    g.fillStyle = ng;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const a0 = R2() * Math.PI * 2;
    g.strokeStyle = 'rgba(255,150,190,' + (0.18 + R2() * 0.2) + ')';
    g.lineWidth = 1 + R2() * 2.5;
    g.beginPath();
    for (let j = 0; j <= 14; j++) {
      const a = a0 + j * 0.12 + Math.sin(j * 0.9 + i) * 0.15,
        r = TR * (0.15 + j * 0.055);
      const x = tx + Math.cos(a) * r,
        y = ty + Math.sin(a) * r * 0.8;
      j ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  const r136 = g.createRadialGradient(tx, ty, 0, tx, ty, TR * 0.18);
  r136.addColorStop(0, 'rgba(235,245,255,.95)');
  r136.addColorStop(1, 'rgba(180,210,255,0)');
  g.fillStyle = r136;
  g.fillRect(tx - TR * 0.2, ty - TR * 0.2, TR * 0.4, TR * 0.4);
  // la Pequeña Nube de Magallanes a lo lejos, y el puente de estrellas que las une
  const sx = W * 0.12,
    sy = H * 0.12;
  g.save();
  g.translate(sx, sy);
  g.rotate(0.5);
  g.scale(1, 0.55);
  const smc = g.createRadialGradient(0, 0, 0, 0, 0, D * 0.08);
  smc.addColorStop(0, 'rgba(210,225,255,.5)');
  smc.addColorStop(1, 'rgba(190,210,255,0)');
  g.fillStyle = smc;
  g.beginPath();
  g.arc(0, 0, D * 0.08, 0, Math.PI * 2);
  g.fill();
  g.restore();
  for (let i = 0; i < 70; i++) {
    const u = R2(),
      x = sx + (W * 0.42 - sx) * u + (R2() - 0.5) * D * 0.05,
      y = sy + (H * 0.56 - sy) * u + (R2() - 0.5) * D * 0.05;
    g.fillStyle = 'rgba(200,220,255,' + (0.2 + R2() * 0.4) + ')';
    g.fillRect(x, y, 1.1, 1.1);
  }
  // supernova 1987A: un punto brillante con su anillo interior y dos anillos exteriores
  const nx = tx - TR * 0.55,
    ny = ty + TR * 0.55;
  g.strokeStyle = 'rgba(255,220,200,.7)';
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(nx, ny, 5, 3, 0.5, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = 'rgba(255,160,190,.45)';
  g.beginPath();
  g.ellipse(nx - 3, ny - 5, 12, 6, 0.5, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.ellipse(nx + 3, ny + 5, 12, 6, 0.5, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = 'rgba(255,240,220,.95)';
  g.beginPath();
  g.arc(nx, ny, 1.4, 0, Math.PI * 2);
  g.fill();
  // muchas estrellas azuladas, jóvenes
  for (let i = 0; i < 480; i++) {
    const x = R2() * W,
      y = R2() * H,
      s = R2() < 0.9 ? 0.5 + R2() * 0.9 : 1.3 + R2() * 1.3;
    g.fillStyle =
      ['rgba(255,255,255,', 'rgba(190,215,255,', 'rgba(170,200,255,'][i % 3] +
      (0.35 + R2() * 0.55) +
      ')';
    g.fillRect(x, y, s, s);
  }
  magCanvas = c;
  magKey = key;
  return c;
}
function drawMagallanes() {
  const c = buildMagallanes();
  ctx.save();
  if (c) {
    const a = Math.sin(t * 0.03) * 0.02;
    ctx.translate(W / 2, H / 2);
    ctx.rotate(a);
    ctx.scale(1.07, 1.07);
    ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(c, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#04070e';
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  for (const s of AND_TW) {
    ctx.globalAlpha = 0.25 + 0.6 * Math.max(0, Math.sin(t * 1.9 + s.p));
    ctx.fillStyle = '#e8f4ff';
    ctx.fillRect(((s.x + 0.37) % 1) * W, ((s.y + 0.21) % 1) * H, 1.8, 1.8);
  }
  ctx.globalAlpha = 1;
}

// ---------- fondos de los niveles 4 a 8, como los muestran los telescopios ----------
const bgCache = {};
function blob(g, x, y, r, c0, c1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, c0);
  gr.addColorStop(1, c1);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}
const BG_BUILD = {
  // Centaurus A: elíptica gigante y cálida, cruzada por una franja de polvo torcida con estrellas jóvenes; chorros y lóbulos perpendiculares
  3: (g, W, H, D, R) => {
    g.fillStyle = '#07060a';
    g.fillRect(0, 0, W, H);
    const cx = W * 0.5,
      cy = H * 0.38,
      la = -0.35,
      ja = la + Math.PI / 2;
    for (const sg of [-1, 1]) {
      const lx = cx + Math.cos(ja) * sg * D * 0.42,
        ly = cy + Math.sin(ja) * sg * D * 0.42;
      blob(g, lx, ly, D * 0.24, 'rgba(255,140,60,.2)', 'rgba(255,120,50,0)');
      g.fillStyle = 'rgba(160,200,255,.28)';
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(lx + Math.cos(la) * D * 0.03, ly + Math.sin(la) * D * 0.03);
      g.lineTo(lx - Math.cos(la) * D * 0.03, ly - Math.sin(la) * D * 0.03);
      g.closePath();
      g.fill();
    }
    blob(g, cx, cy, D * 0.45, 'rgba(255,236,205,.7)', 'rgba(230,200,160,0)');
    for (let i = 0; i < 700; i++) {
      const r = Math.abs(R() + R() + R() - 1.5) * D * 0.3,
        a = R() * Math.PI * 2;
      g.fillStyle = 'rgba(255,230,195,' + (0.2 + R() * 0.5) + ')';
      g.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85, 1, 1);
    }
    g.save();
    g.translate(cx, cy);
    g.rotate(la);
    const bz = u => {
      const p0 = [-D * 0.48, D * 0.02],
        p1 = [-D * 0.15, -D * 0.07],
        p2 = [D * 0.15, D * 0.07],
        p3 = [D * 0.48, -D * 0.02],
        v = 1 - u;
      return [
        v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
        v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
      ];
    };
    g.lineCap = 'round';
    for (const [lw, al] of [
      [D * 0.085, 0.55],
      [D * 0.05, 0.85],
    ]) {
      g.strokeStyle = 'rgba(22,12,6,' + al + ')';
      g.lineWidth = lw;
      g.beginPath();
      for (let i = 0; i <= 40; i++) {
        const [x, y] = bz(i / 40);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    for (let i = 0; i < 60; i++) {
      const [x, y] = bz(R()),
        off = (R() - 0.5) * D * 0.07;
      if (i % 3 === 0) {
        blob(g, x, y + off, 5 + R() * 8, 'rgba(255,120,175,.5)', 'rgba(255,90,160,0)');
      } else {
        g.fillStyle = 'rgba(170,200,255,.7)';
        g.fillRect(x, y + off, 1.5, 1.5);
      }
    }
    g.restore();
  },
  // Remolino (M51): espiral vista de frente con dos brazos perfectos, regiones rosadas, polvo, y su vecina NGC 5195 al final de un brazo
  4: (g, W, H, D, R) => {
    g.fillStyle = '#050712';
    g.fillRect(0, 0, W, H);
    const cx = W * 0.42,
      cy = H * 0.46;
    let tipX = 0,
      tipY = 0;
    blob(g, cx, cy, D * 0.5, 'rgba(120,145,230,.14)', 'rgba(90,110,220,0)');
    for (let arm = 0; arm < 2; arm++) {
      const dust = [];
      for (let i = 0; i < 900; i++) {
        const th = (i / 900) * 6.6 + arm * Math.PI,
          r = D * 0.035 * Math.exp(0.3 * th);
        if (r > D * 0.95) {
          break;
        }
        const x = cx + Math.cos(th) * r + (R() - 0.5) * r * 0.16,
          y = cy + Math.sin(th) * r + (R() - 0.5) * r * 0.16;
        g.fillStyle = ['rgba(150,180,255,', 'rgba(190,210,255,'][i % 2] + (0.2 + R() * 0.45) + ')';
        g.beginPath();
        g.arc(x, y, 0.6 + R() * 2, 0, Math.PI * 2);
        g.fill();
        if (i % 20 === 0) {
          blob(g, x, y, 6 + R() * 12, 'rgba(255,115,170,.5)', 'rgba(255,90,160,0)');
        }
        dust.push([cx + Math.cos(th - 0.12) * r * 0.95, cy + Math.sin(th - 0.12) * r * 0.95]);
        if (arm === 0) {
          tipX = x;
          tipY = y;
        }
      }
      g.strokeStyle = 'rgba(25,15,10,.45)';
      g.lineWidth = D * 0.014;
      g.lineCap = 'round';
      g.beginPath();
      dust.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    }
    blob(g, cx, cy, D * 0.13, 'rgba(255,240,205,.9)', 'rgba(255,210,150,0)');
    const nx = clamp(tipX, W * 0.2, W * 0.85),
      ny = clamp(tipY, H * 0.1, H * 0.85);
    blob(g, nx, ny, D * 0.08, 'rgba(255,225,180,.75)', 'rgba(240,200,150,0)');
    g.strokeStyle = 'rgba(30,18,10,.6)';
    g.lineWidth = D * 0.008;
    g.beginPath();
    g.moveTo(nx - D * 0.05, ny - D * 0.01);
    g.lineTo(nx + D * 0.04, ny + D * 0.02);
    g.stroke();
  },
  // Sombrero (M104): vista casi de lado, con un núcleo enorme y brillante, su franja oscura de polvo y cientos de cúmulos globulares
  5: (g, W, H, D, R) => {
    g.fillStyle = '#05050a';
    g.fillRect(0, 0, W, H);
    const cx = W * 0.5,
      cy = H * 0.36;
    for (let i = 0; i < 260; i++) {
      const r = Math.abs(R() + R() - 1) * D * 0.55,
        a = R() * Math.PI * 2;
      blob(
        g,
        cx + Math.cos(a) * r,
        cy + Math.sin(a) * r * 0.8,
        2 + R() * 2.5,
        'rgba(255,235,200,.55)',
        'rgba(255,220,180,0)',
      );
    }
    g.save();
    g.translate(cx, cy);
    g.scale(1, 0.62);
    blob(g, 0, 0, D * 0.34, 'rgba(255,246,225,.9)', 'rgba(240,215,170,0)');
    g.restore();
    g.save();
    g.translate(cx, cy);
    g.scale(1, 0.12);
    blob(g, 0, 0, D * 0.6, 'rgba(225,200,155,.6)', 'rgba(210,180,140,0)');
    g.restore();
    g.fillStyle = 'rgba(18,10,6,.92)';
    g.beginPath();
    g.ellipse(cx, cy + D * 0.012, D * 0.5, D * 0.02, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255,225,190,.35)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.ellipse(cx, cy + D * 0.012, D * 0.52, D * 0.026, 0, 0, Math.PI * 2);
    g.stroke();
  },
  // M87: elíptica gigante y suave, rodeada de miles de cúmulos globulares, con su chorro azul con nudos; en el centro, el anillo de la primera fotografía
  6: (g, W, H, D, R) => {
    g.fillStyle = '#07050a';
    g.fillRect(0, 0, W, H);
    const cx = W * 0.32,
      cy = H * 0.44;
    blob(g, cx, cy, D * 0.6, 'rgba(255,232,200,.55)', 'rgba(240,205,160,0)');
    for (let i = 0; i < 1100; i++) {
      const r = Math.abs(R() + R() + R() - 1.5) * D * 0.5,
        a = R() * Math.PI * 2;
      g.fillStyle = 'rgba(255,225,185,' + (0.25 + R() * 0.5) + ')';
      g.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.2, 1.2);
    }
    const ja = -0.55,
      L = D * 0.5,
      jg = g.createLinearGradient(cx, cy, cx + Math.cos(ja) * L, cy + Math.sin(ja) * L);
    jg.addColorStop(0, 'rgba(190,220,255,.85)');
    jg.addColorStop(1, 'rgba(150,190,255,0)');
    g.fillStyle = jg;
    g.beginPath();
    g.moveTo(cx - Math.sin(ja) * 2, cy + Math.cos(ja) * 2);
    g.lineTo(
      cx + Math.cos(ja) * L - Math.sin(ja) * D * 0.02,
      cy + Math.sin(ja) * L + Math.cos(ja) * D * 0.02,
    );
    g.lineTo(
      cx + Math.cos(ja) * L + Math.sin(ja) * D * 0.02,
      cy + Math.sin(ja) * L - Math.cos(ja) * D * 0.02,
    );
    g.lineTo(cx + Math.sin(ja) * 2, cy - Math.cos(ja) * 2);
    g.closePath();
    g.fill();
    for (let i = 1; i <= 6; i++) {
      const u = i / 7,
        kx = cx + Math.cos(ja) * L * u,
        ky = cy + Math.sin(ja) * L * u;
      blob(
        g,
        kx,
        ky,
        D * 0.012 * (1 + u),
        'rgba(225,240,255,' + (0.8 - u * 0.5) + ')',
        'rgba(180,215,255,0)',
      );
    }
    g.strokeStyle = 'rgba(255,140,60,.85)';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(cx, cy, 7, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#000';
    g.beginPath();
    g.arc(cx, cy, 4.5, 0, Math.PI * 2);
    g.fill();
  },
  // Sagitario A*: el centro de nuestra galaxia, lleno de estrellas enrojecidas por el polvo, nubes oscuras, el gas en espiral alrededor del agujero negro
  7: (g, W, H, D, R) => {
    g.fillStyle = '#0a0607';
    g.fillRect(0, 0, W, H);
    const cx = CX,
      cy = CY;
    g.save();
    g.translate(cx, cy);
    g.rotate(-0.5);
    g.scale(1, 0.35);
    blob(g, 0, 0, D * 0.8, 'rgba(255,170,110,.28)', 'rgba(200,110,70,0)');
    g.restore();
    for (let i = 0; i < 1500; i++) {
      const u = (R() - 0.5) * 2,
        v = (R() + R() + R() - 1.5) * 0.5,
        x = cx + Math.cos(-0.5) * u * D * 0.6 - Math.sin(-0.5) * v * D * 0.35,
        y = cy + Math.sin(-0.5) * u * D * 0.6 + Math.cos(-0.5) * v * D * 0.35;
      g.fillStyle =
        ['rgba(255,200,150,', 'rgba(255,170,120,', 'rgba(255,240,220,'][i % 3] +
        (0.2 + R() * 0.6) +
        ')';
      g.fillRect(x, y, R() < 0.9 ? 1 : 2, R() < 0.9 ? 1 : 2);
    }
    for (let i = 0; i < 9; i++) {
      const x = R() * W,
        y = R() * H,
        r = D * (0.05 + R() * 0.09);
      blob(g, x, y, r, 'rgba(10,5,4,.6)', 'rgba(10,5,4,0)');
    }
    g.strokeStyle = 'rgba(255,90,110,.32)';
    g.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) {
      g.lineWidth = 3 + arm;
      g.beginPath();
      for (let i = 0; i <= 30; i++) {
        const th = arm * 2.1 + i * 0.1,
          r = D * (0.05 + i * 0.005);
        const x = cx + Math.cos(th) * r,
          y = cy + Math.sin(th) * r * 0.8;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,120,100,.18)';
    g.lineWidth = D * 0.025;
    g.beginPath();
    g.ellipse(cx, cy, D * 0.22, D * 0.12, -0.3, 0, Math.PI * 2);
    g.stroke();
  },
};
function drawGalBG(i) {
  const key = i + ':' + Math.round(W) + 'x' + Math.round(H);
  if (!bgCache[key] && document.createElement) {
    const c = document.createElement('canvas');
    if (c && c.getContext) {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(W * d);
      c.height = Math.round(H * d);
      const g = c.getContext('2d');
      if (g && g.setTransform) {
        g.setTransform(d, 0, 0, d, 0, 0);
        let sd = 7000 + i * 131;
        const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        BG_BUILD[i](g, W, H, Math.hypot(W, H), R);
        for (let k = 0; k < 420; k++) {
          const x = R() * W,
            y = R() * H,
            s = R() < 0.9 ? 0.5 + R() * 0.9 : 1.3 + R() * 1.2;
          g.fillStyle =
            ['rgba(255,255,255,', 'rgba(200,215,255,', 'rgba(255,236,205,'][k % 3] +
            (0.3 + R() * 0.55) +
            ')';
          g.fillRect(x, y, s, s);
        }
        bgCache[key] = c;
      }
    }
  }
  const c = bgCache[key];
  ctx.save();
  if (c) {
    const a = Math.sin(t * 0.025) * 0.02;
    ctx.translate(W / 2, H / 2);
    ctx.rotate(a);
    ctx.scale(1.07, 1.07);
    ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(c, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  for (const s of AND_TW) {
    ctx.globalAlpha = 0.25 + 0.6 * Math.max(0, Math.sin(t * 1.6 + s.p + i));
    ctx.fillStyle = '#eef3ff';
    ctx.fillRect(((s.x + i * 0.13) % 1) * W, ((s.y + i * 0.29) % 1) * H, 1.8, 1.8);
  }
  ctx.globalAlpha = 1;
}

// ---- espacio doblado (nivel 1, anillos 27–33): un agujero de gusano flota delante de ti y dobla
// el espacio.
// Es una lente gravitacional de verdad: todo lo que pasa cerca (anillos, asteroides y tu planeta)
// se ve empujado
// hacia afuera de la esfera, se estira en arcos y corre más rápido alrededor de su borde. Dentro se
// ve el cielo del otro lado.
// Dato real: la gravedad dobla la luz (Einstein, 1915); así se calculó la imagen del agujero de
// gusano de Interstellar.
const BEND_AT = { 3: [26, 28] },
  BEND_R = 23,
  WORM_COL = '#d4c8ff',
  WH_K = 29,
  WH_EXIT = 41;
let bend = { str: 0, a: -Math.PI / 2, L: 0, on: false, grow: 1, fixed: false },
  whRip = null;
const bendRad = () => BEND_R * bend.str * (bend.grow || 1);
function bendUpdate(d) {
  if (bend.fixed) {
    return;
  } // durante la entrada y la salida la mueve el portal
  const z = BEND_AT[lvl],
    want = !tutorial && z && level >= z[0] && level <= z[1] && state === 'play' ? 1 : 0;
  if (want && !bend.on) {
    bend.on = true;
    bend.L = level + 1.5;
    bend.a = -Math.PI / 2 + 0.9;
    hazardTip('whVisto', 'Agujero de gusano', 'Salta dentro: es un portal', WORM_COL);
  }
  if (!want && bend.on && bend.str < 0.02) {
    bend.on = false;
  }
  bend.str += (want - bend.str) * Math.min(1, d * (want ? 1.2 : 2.2));
  const lock = want && level === WH_K - 1; // en el último anillo se pone justo en tu camino
  bend.L += ((want ? level + (lock ? 0.8 : 1.55) : level + 4) - bend.L) * Math.min(1, d * 2.5);
  const aT = lock
    ? -Math.PI / 2
    : -Math.PI / 2 + 0.8 * Math.sin(t * 0.42) + 0.2 * Math.sin(t * 1.1);
  bend.a +=
    Math.atan2(Math.sin(aT - bend.a), Math.cos(aT - bend.a)) * Math.min(1, d * (lock ? 4 : 2));
}
function bendW() {
  const R = rr(bend.L);
  return [Math.cos(bend.a) * R, Math.sin(bend.a) * R];
}
// lente: un punto a distancia r del centro de la esfera se ve a (r + √(r² + 4θ²))/2
function lensP(x, y) {
  if (whRip && !viewInside) {
    // onda gravitacional: estira y encoge el espacio al pasar
    const dx = x - whRip.x,
      dy = y - whRip.y,
      d = Math.hypot(dx, dy) || 0.001,
      u = d - 300 * whRip.t,
      A = 7 * (1 - whRip.t / 1.1) * Math.exp((-u * u) / (2 * 38 * 38));
    if (A > 0.05) {
      const k = 1 + (A * Math.sin(u / 11)) / d;
      x = whRip.x + dx * k;
      y = whRip.y + dy * k;
    }
  }
  if (bend.str < 0.01 || viewInside) {
    return [x, y];
  }
  const [wx, wy] = bendW(),
    dx = x - wx,
    dy = y - wy,
    r = Math.hypot(dx, dy) || 0.001,
    te = bendRad(),
    r2 = (r + Math.sqrt(r * r + 4 * te * te)) / 2;
  return [wx + (dx * r2) / r, wy + (dy * r2) / r];
}
function lensJ(x, y) {
  // cuánto se estira: a lo largo del borde (tangencial) y hacia el centro (radial)
  if (bend.str < 0.01 || viewInside) {
    return [1, 1, 0];
  }
  const [wx, wy] = bendW(),
    dx = x - wx,
    dy = y - wy,
    r = Math.hypot(dx, dy) || 0.001,
    te = bendRad(),
    q = Math.sqrt(r * r + 4 * te * te);
  return [(r + q) / (2 * r), 0.5 * (1 + r / q), Math.atan2(dy, dx)];
}
function drawBendSphere() {
  if (bend.str < 0.01 || viewInside) {
    return;
  }
  const [wx, wy] = bendW(),
    x = CX + wx * S,
    y = CY + wy * S,
    R = bendRad() * S * 0.92,
    cv = GLBG.canvas && GLBG.canvas();
  ctx.save();
  // la esfera tapa los anillos que pasan detrás: dentro se ve el otro lado (el mismo cielo
  // calculado en la GPU)
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.clip();
  if (cv && cv.width > 2) {
    ctx.drawImage(cv, 0, 0, W, H);
  } else {
    const g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, '#e9e4ff');
    g.addColorStop(0.6, '#5b46c9');
    g.addColorStop(1, '#0b0820');
    ctx.fillStyle = g;
    ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
  }
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = bend.str * 0.45;
  ctx.strokeStyle = '#eef0ff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.stroke();
  const g2 = ctx.createRadialGradient(x, y, R, x, y, R * 1.9);
  g2.addColorStop(0, 'rgba(200,205,255,' + 0.28 * bend.str + ')');
  g2.addColorStop(1, 'rgba(200,205,255,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(x, y, R * 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Dibujo de la partida: asteroides, la Tierra, el aura y el anillo de carga del planeta, la cámara
 * que sigue el salto y el cuadro completo (dentro y fuera del agujero de gusano).
 * Los asteroides se dibujan una vez en imágenes pequeñas (8 formas × 12 giros × tamaño) y en el
 * juego solo se copian, así va rápido incluso en celulares.
 */
import { CX, CY, H, S, W, clamp, ctx } from '../core/display.js';
import { camLevel, jumping, level, pLevel, setCamLevel, state } from '../core/state.js';
import { t } from '../core/run-state.js';
import { WH_IN, WH_OUT, drawInside, wh, whShock } from '../game/wormhole.js';
import { renderScene } from './scene.js';

import { setHideEarth, setViewInside } from '../core/screen.js';

// Cámara que se dibuja. La lógica (choques, puntos, agujero negro) usa camLevel, que se queda
// quieta durante el salto y arranca de golpe al aterrizar. Para dibujar se usa una cámara "de
// resorte" que sube junto con el salto, acelera y frena sin saltos y llega al mismo lugar en el
// mismo tiempo. Quieta, es idéntica a camLevel.
let camView = 0;
let camVel = 0;
let camT = 0;
/**
 * Avanza la cámara de resorte un cuadro (resorte con amortiguación crítica, frecuencia 9 por
 * segundo). Fuera de la partida, o tras una pausa larga, se iguala a camLevel.
 */
function camViewStep() {
  const dt = t - camT;
  camT = t;
  const live =
    (state === 'play' || state === 'dead') &&
    !wh &&
    dt >= 0 &&
    dt < 0.1 &&
    Math.abs(camView - camLevel) < 1.5;
  if (!live) {
    camView = camLevel;
    camVel = 0;
    return;
  }
  const W0 = 9,
    goal = jumping ? pLevel : level;
  camVel += (W0 * W0 * (goal - camView) - 2 * W0 * camVel) * dt;
  camView += camVel * dt;
  if (!jumping && Math.abs(level - camLevel) < 0.002 && Math.abs(camView - camLevel) < 0.002) {
    camView = camLevel;
    camVel = 0;
  }
}
/**
 * Dibuja el cuadro completo con la cámara de resorte; camLevel vuelve a su valor al terminar,
 * aunque el dibujo falle.
 */
function render() {
  camViewStep();
  const camL = camLevel;
  setCamLevel(camView);
  try {
    renderFrame();
  } finally {
    setCamLevel(camL);
  }
}
/** Elige qué dibujar: fuera, entrando, dentro o saliendo del agujero de gusano (y su onda). */
function renderFrame() {
  setHideEarth(false);
  setViewInside(false);
  if (!wh) {
    renderScene();
    if (whShock) {
      drawShock();
    }
    return;
  }
  if (wh.ph === 'orb') {
    setViewInside(true);
    renderScene();
    drawInside(1);
    setViewInside(false);
    return;
  }
  if (wh.ph === 'in') {
    const p = clamp(wh.t / WH_IN, 0, 1),
      z = 1 + 0.18 * p * p,
      cx = CX + wh.wx * S,
      cy = CY + wh.wy * S;
    setHideEarth(p > 0.62);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.12 * p * p);
    ctx.scale(z, z);
    ctx.translate(-cx, -cy);
    renderScene();
    ctx.restore();
    setHideEarth(false);
    // ya adentro: el mismo cielo a través de la garganta
    if (p > 0.8) {
      ctx.save();
      ctx.globalAlpha = (p - 0.8) / 0.2;
      setViewInside(true);
      setHideEarth(true);
      renderScene();
      drawInside(1);
      setViewInside(false);
      setHideEarth(false);
      ctx.restore();
    }
    return;
  }
  // salida
  const p = clamp(wh.t / WH_OUT, 0, 1);
  renderScene();
  if (p < 0.3) {
    ctx.save();
    ctx.globalAlpha = 1 - p / 0.3;
    drawInside(1);
    ctx.restore();
  }
}
/** Dibuja la onda de choque violeta que se expande al salir del agujero de gusano. */
function drawShock() {
  const s = whShock;
  if (!s) {
    return;
  }
  const u = clamp(s.t / 1.1, 0, 1),
    R = 300 * s.t * S;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(s.cx, s.cy, Math.max(0, R - 40 * S), s.cx, s.cy, R + 40 * S);
  if (g && g.addColorStop) {
    g.addColorStop(0, 'rgba(200,190,255,0)');
    g.addColorStop(0.5, 'rgba(200,190,255,' + 0.16 * (1 - u) + ')');
    g.addColorStop(1, 'rgba(200,190,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

export { render };

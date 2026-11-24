/**
 * Dibujo de la lente gravitacional: la esfera que curva la luz del fondo alrededor del agujero negro.
 */
import { CX, CY, H, S, W, ctx } from '../core/display.js';
import { GLBG } from './backgrounds/engine.js';
import { viewInside } from '../core/screen.js';
import { bend, bendRad, bendW } from '../game/gravitational-lens.js';

/** Dibuja la esfera del agujero de gusano con el cielo del otro lado dentro y un halo suave. */
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

export { drawBendSphere };

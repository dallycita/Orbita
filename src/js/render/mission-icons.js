/**
 * (encabezado pendiente)
 */
import { MIS, misDef, misLoad } from '../game/missions.js';

/**
 * Arma el ícono de Misiones del inicio: una constelación de tres estrellas (una por misión del
 * día) dentro de un arco de progreso. Cada misión cumplida enciende una estrella y llena un
 * tercio del arco; con las tres, la constelación se une y el círculo se cierra.
 *
 * @returns {string} Contenido SVG (sin la etiqueta `<svg>`), en un cuadro de 100 × 100.
 */
function misMoons() {
  misLoad();
  const done = Math.min(
    3,
    MIS.daily.filter(m => m.c || m.p >= (misDef(m.id) || { n: 1 }).n).length,
  );
  const P = [
      [25, 68],
      [50, 32],
      [75, 68],
    ],
    st = (x, y, r) =>
      'M' +
      x +
      ' ' +
      (y - r) +
      ' L' +
      (x + r * 0.26) +
      ' ' +
      (y - r * 0.26) +
      ' L' +
      (x + r) +
      ' ' +
      y +
      ' L' +
      (x + r * 0.26) +
      ' ' +
      (y + r * 0.26) +
      ' L' +
      x +
      ' ' +
      (y + r) +
      ' L' +
      (x - r * 0.26) +
      ' ' +
      (y + r * 0.26) +
      ' L' +
      (x - r) +
      ' ' +
      y +
      ' L' +
      (x - r * 0.26) +
      ' ' +
      (y - r * 0.26) +
      'Z';
  let h =
    '<circle cx="50" cy="50" r="45" fill="none" stroke="#ece6d8" stroke-opacity=".2" stroke-width="5"/>';
  if (done === 3) {
    h +=
      '<circle class="lit" cx="50" cy="50" r="45" fill="none" stroke="#ff8a3d" stroke-width="6"/>';
  } else if (done > 0) {
    const a = -Math.PI / 2 + (Math.PI * 2 * done) / 3;
    h +=
      '<path class="lit" d="M50 5 A45 45 0 ' +
      (done > 1 ? 1 : 0) +
      ' 1 ' +
      (50 + 45 * Math.cos(a)).toFixed(1) +
      ' ' +
      (50 + 45 * Math.sin(a)).toFixed(1) +
      '" fill="none" stroke="#ff8a3d" stroke-width="6" stroke-linecap="round"/>';
  }
  for (let i = 0; i < 2; i++) {
    const [ax, ay] = P[i],
      [bx, by] = P[i + 1],
      L = Math.hypot(bx - ax, by - ay),
      ux = (bx - ax) / L,
      uy = (by - ay) / L,
      g = 15; // la línea se detiene antes de cada estrella, como en un mapa del cielo
    h +=
      '<line x1="' +
      (ax + ux * g).toFixed(1) +
      '" y1="' +
      (ay + uy * g).toFixed(1) +
      '" x2="' +
      (bx - ux * g).toFixed(1) +
      '" y2="' +
      (by - uy * g).toFixed(1) +
      '" stroke="' +
      (done === 3 ? '#ff8a3d' : '#8fd0ff') +
      '" stroke-opacity="' +
      (done === 3 ? 0.85 : 0.6) +
      '" stroke-width="2.6" stroke-linecap="round"' +
      (done === 3 ? '' : ' stroke-dasharray="4 5"') +
      '/>';
  }
  P.forEach(([x, y], i) => {
    h +=
      i < done
        ? '<path class="lit" d="' + st(x, y, 11) + '" fill="#ff8a3d"/>'
        : '<path d="' +
          st(x, y, 10.5) +
          '" fill="none" stroke="#ece6d8" stroke-width="3.2" stroke-linejoin="round"/>';
  });
  return h;
}

export { misMoons };

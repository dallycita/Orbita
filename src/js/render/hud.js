/**
 * El marcador de la partida: la barra de viaje (del agujero negro a la salida) con la marca del récord.
 */
import { elArcFg, elBest, elPbar, elPnum, elScore, elWrap, hudMode } from '../core/display.js';
import { curGoal, tutorialState } from '../core/run-state.js';
import { run } from '../core/state.js';
import { on } from '../core/events.js';

/**
 * Actualiza el marcador de anillos: la barra de viaje de arriba (como en Geometry Dash, el
 * planeta avanza del agujero negro a la salida y la marca dorada es el récord), el número y el
 * arco de progreso.
 */
function updateRingHUD() {
  if (elPbar && elPbar.style) {
    const g = curGoal(),
      v = Math.min(run.level, g),
      rec = tutorialState.tutorial ? 0 : Math.min(run.runRecord, g);
    elPbar.style.setProperty('--p', ((v / g) * 100).toFixed(2) + '%');
    elPbar.style.setProperty('--r', ((rec / g) * 100).toFixed(2) + '%');
    if (elPbar.classList) {
      elPbar.classList.toggle('hasrec', rec > 0 && rec < g);
      elPbar.classList.toggle('beat', rec > 0 && v > rec);
    }
    if (elPnum) {
      elPnum.innerHTML = v + '<span>/ ' + g + '</span>';
      if (elPnum.classList) {
        elPnum.classList.toggle('beat', rec > 0 && v > rec);
      }
    }
  }
  elScore.innerHTML = Math.min(run.level, curGoal()) + '<small>/ ' + curGoal() + '</small>';
  elBest.textContent = '';
  const arc = hudMode === 'arco' && run.runRecord > 0;
  elWrap.classList.toggle('arc', arc);
  if (arc) {
    elArcFg.style.strokeDashoffset = String(276.5 * (1 - Math.min(run.level / run.runRecord, 1)));
    elArcFg.style.stroke = run.newRec ? 'var(--fg)' : 'var(--sun)';
  }
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initHud() {
  // el juego avisa cuando cambia el anillo, la meta o el récord
  on('ringChanged', updateRingHUD);
}

export { updateRingHUD };

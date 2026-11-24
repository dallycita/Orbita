/**
 * HTML del menú de inicio que comparten la historia y la pantalla de niveles.
 */
import { chipsHTML } from '../core/display.js';
import { run } from '../core/state.js';
import { LEVELS } from '../data/levels.js';

// Panel previo a jugar: nivel elegido, invitación a tocar y los avisos de ayuda.
const MENU_HTML = () => {
  const L = LEVELS[run.lvl] || LEVELS[0];
  return (
    '<div class="mlv">Nivel ' +
    (LEVELS.indexOf(L) + 1) +
    ' · ' +
    L.name +
    '</div><div class="cta mgo">Toca para escapar</div>' +
    chipsHTML()
  );
};

export { MENU_HTML };

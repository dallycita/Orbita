/**
 * (encabezado pendiente)
 */
import { chipsHTML } from '../core/display.js';
import { lvl } from '../core/state.js';
import { LEVELS } from '../data/levels.js';

// Panel previo a jugar: nivel elegido, invitación a tocar y los avisos de ayuda.
const MENU_HTML = () => {
  const L = LEVELS[lvl] || LEVELS[0];
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

/**
 * Sonidos de la interfaz (cristal y eco, en la tonalidad del juego) y de la absorción de la
 * presentación, incluidos dos inspirados en datos reales: la sonificación de la NASA del agujero
 * negro de Perseo y el chirrido de ondas gravitacionales de LIGO.
 * Los clics y el paso del puntero sobre botones se escuchan en toda la página desde aquí.
 */

import { uiClick, uiGlass, uiHover } from '../audio/ui-sounds.js';
import { paused } from '../core/screen.js';
import { pzSnd } from '../audio/pause-sounds.js';

let lastHover = null;

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initUiSounds() {
  window.addEventListener('pointerover', e => {
    if (e.pointerType && e.pointerType !== 'mouse') {
      return;
    }
    const b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (b && !b.disabled && b !== lastHover) {
      lastHover = b;
      if (paused) {
        pzSnd('hover');
      } else {
        uiHover();
      }
    }
    if (!b) {
      lastHover = null;
    }
  });
  window.addEventListener(
    'click',
    e => {
      const b = e.target && e.target.closest ? e.target.closest('button') : null;
      if (!b || b.disabled) {
        return;
      }
      if (b.id === 'quit' || paused || (b.closest && b.closest('.pzp'))) {
        return;
      } // La pausa tiene sus propios sonidos.
      if (b.classList.contains('glass') || b.classList.contains('arrow')) {
        uiGlass(b.classList.contains('l') ? -1 : 1);
        return;
      }
      if (b.classList.contains('scanbtn')) {
        return;
      }
      uiClick(b.classList.contains('bigplay') || b.classList.contains('play') ? 'play' : 'soft');
    },
    true,
  );
}

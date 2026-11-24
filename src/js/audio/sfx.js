/**
 * (encabezado pendiente)
 */
import { AC, ROOT } from '../02-audio.js';

import { muted } from '../core/settings.js';
import { uiOut, uiTone } from './ui-sounds.js';

/** Sonido del poder listo: un arpegio brillante que sube y un destello. */
function powerReadySound() {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime;
    [0, 7, 12, 16, 19, 24].forEach((sm, i) =>
      uiTone(ROOT * 2 * Math.pow(2, sm / 12), n + i * 0.045, 0.9, 0.05),
    );
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(ROOT, n);
    o.frequency.exponentialRampToValueAtTime(ROOT * 4, n + 0.3);
    g.gain.setValueAtTime(0.0001, n);
    g.gain.exponentialRampToValueAtTime(0.08, n + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, n + 0.4);
    o.connect(g);
    g.connect(uiOut());
    o.start(n);
    o.stop(n + 0.45);
  } catch (e) {}
}

export { powerReadySound };

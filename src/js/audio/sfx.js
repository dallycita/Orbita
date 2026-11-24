/**
 * (encabezado pendiente)
 */
import { AC, NOISE, ROOT, master } from './engine.js';

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

/** Fanfarria de victoria. */
function winSound() {
  if (!AC) {
    return;
  }
  try {
    const n = AC.currentTime + 0.05;
    const src = AC.createBufferSource();
    src.buffer = NOISE;
    const f = AC.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1;
    f.frequency.setValueAtTime(300, n);
    f.frequency.exponentialRampToValueAtTime(7000, n + 1.6);
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, n);
    g.gain.exponentialRampToValueAtTime(0.3, n + 1.5);
    g.gain.exponentialRampToValueAtTime(0.0001, n + 1.9);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(n);
    src.stop(n + 2);
    const chord = (t0, semis, dur, gain) => {
      for (const sm of semis) {
        for (const det of [-6, 6]) {
          const o = AC.createOscillator(),
            gg = AC.createGain(),
            lp = AC.createBiquadFilter();
          o.type = 'sawtooth';
          o.frequency.value = (ROOT / 2) * Math.pow(2, sm / 12);
          o.detune.value = det;
          lp.type = 'lowpass';
          lp.frequency.value = 1800;
          gg.gain.setValueAtTime(0.0001, t0);
          gg.gain.exponentialRampToValueAtTime(gain, t0 + 0.08);
          gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          o.connect(lp);
          lp.connect(gg);
          gg.connect(master);
          o.start(t0);
          o.stop(t0 + dur + 0.1);
        }
      }
    };
    chord(n + 1.6, [3, 7, 10, 15], 4.5, 0.03); // acorde luminoso (Si mayor)
    const bell = (t0, sm, gain) => {
      const o = AC.createOscillator(),
        gg = AC.createGain();
      o.type = 'sine';
      o.frequency.value = ROOT * 2 * Math.pow(2, sm / 12);
      gg.gain.setValueAtTime(0.0001, t0);
      gg.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
      gg.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2);
      o.connect(gg);
      gg.connect(master);
      o.start(t0);
      o.stop(t0 + 2.3);
    };
    [3, 7, 10, 15].forEach((sm, i) => bell(n + 1.6 + i * 0.16, sm, 0.08));
    const o = AC.createOscillator(),
      gg = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(80, n + 1.6);
    o.frequency.exponentialRampToValueAtTime(40, n + 3);
    gg.gain.setValueAtTime(0.7, n + 1.6);
    gg.gain.exponentialRampToValueAtTime(0.0001, n + 3.2);
    o.connect(gg);
    gg.connect(master);
    o.start(n + 1.6);
    o.stop(n + 3.3);
  } catch (e) {}
}

export { powerReadySound, winSound };

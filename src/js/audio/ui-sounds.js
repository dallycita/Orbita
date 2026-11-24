/**
 * (encabezado pendiente)
 */
import { AC, ROOT, master } from '../02-audio.js';
import { uiTone } from '../28-sonidos-interfaz.js';
import { muted } from '../core/settings.js';
import { echoBus } from '../03-musica-ritmos.js';

/**
 * Sonido de cristal para las flechas: dos notas que suben (siguiente) o bajan (anterior).
 *
 * @param {number} dir Dirección: negativo baja, positivo sube.
 */
function uiGlass(dir) {
  if (!AC || muted) {
    return;
  }
  try {
    const n = AC.currentTime,
      a = [12, 19],
      b = [19, 12],
      seq = dir < 0 ? b : a;
    uiTone(ROOT * Math.pow(2, seq[0] / 12), n, 1.1, 0.06);
    uiTone(ROOT * Math.pow(2, seq[1] / 12), n + 0.07, 1.3, 0.055);
    uiTone(ROOT * 2 * Math.pow(2, seq[1] / 12), n + 0.07, 0.7, 0.015);
  } catch (e) {}
}

/**
 * Enciende o apaga la música de misterio de los menús: un zumbido profundo que respira, notas de
 * cristal flotando y un viento cósmico. Encenderla dos veces no la duplica.
 *
 * @param {boolean} on Verdadero para encenderla (sube en 2,5 s); falso para apagarla (en 0,8 s).
 */
function homeAmbience(on) {
  if (!AC) {
    return;
  }
  try {
    const n = AC.currentTime;
    if (on && !amb) {
      const g = AC.createGain();
      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.9, n + 2.5);
      g.connect(master);
      const nodes = [];
      const lp = AC.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 260;
      lp.Q.value = 2;
      lp.connect(g);
      const lfo = AC.createOscillator(),
        lfoG = AC.createGain();
      lfo.frequency.value = 0.07;
      lfoG.gain.value = 160;
      lfo.connect(lfoG);
      lfoG.connect(lp.frequency);
      lfo.start(n);
      nodes.push(lfo);
      for (const [f, ty, gn] of [
        [ROOT / 8, 'sine', 0.32],
        [(ROOT / 8) * 1.498, 'sine', 0.18],
        [(ROOT / 8) * 1.006, 'sawtooth', 0.08],
      ]) {
        const o = AC.createOscillator(),
          og = AC.createGain();
        o.type = ty;
        o.frequency.value = f;
        og.gain.value = gn;
        o.connect(og);
        og.connect(lp);
        o.start(n);
        nodes.push(o);
      }
      const glass = AC.createGain();
      glass.gain.value = 0.018;
      glass.connect(g);
      glass.connect(echoBus());
      for (const [semi, rate] of [
        [12, 0.11],
        [19, 0.07],
        [27, 0.05],
        [24, 0.13],
      ]) {
        const o = AC.createOscillator(),
          og = AC.createGain(),
          tr = AC.createOscillator(),
          trg = AC.createGain();
        o.type = 'sine';
        o.frequency.value = (ROOT / 2) * Math.pow(2, semi / 12);
        og.gain.value = 0.5;
        tr.frequency.value = rate;
        trg.gain.value = 0.5;
        tr.connect(trg);
        trg.connect(og.gain);
        o.connect(og);
        og.connect(glass);
        o.start(n);
        tr.start(n);
        nodes.push(o, tr);
      }
      amb = { g, nodes };
    } else if (!on && amb) {
      const a = amb;
      amb = null;
      a.g.gain.cancelScheduledValues(n);
      a.g.gain.setValueAtTime(Math.max(a.g.gain.value, 0.0001), n);
      a.g.gain.exponentialRampToValueAtTime(0.0001, n + 0.8);
      a.nodes.forEach(o => {
        try {
          o.stop(n + 0.9);
        } catch (e) {}
      });
    }
  } catch (e) {}
}

let amb = null;

export { homeAmbience, uiGlass };

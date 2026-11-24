/**
 * Reproductor de música: elige el estilo según el nivel, programa cada paso un poco por
 * adelantado en el reloj de Web Audio, cambia de estilo a mitad de partida y arranca o para.
 * Los cambios de estilo esperan al inicio de una frase de 32 pasos, tras un crescendo de 16.
 */
import { musicStyle, setMusicStyle } from '../core/display.js';
import { AC, master, musVol, musicBus } from './engine.js';
import {
  GAL_CFG,
  ROOT_A,
  STEP,
  SW_AT,
  andFast,
  echoBus,
  impact,
  musicOn,
  nextT,
  riser,
  riserOn,
  schedTimer,
  setAndFast,
  setKickQueue,
  setMusicOn,
  setMusicStart,
  setNextT,
  setRiserOn,
  setSchedTimer,
  setStep,
  setSwitchAt,
  setSwitchMsg,
  step,
  stepAndromeda,
  stepEspacial,
  stepGalaxy,
  stepMagallanes,
  stepPhonk,
  stepSynthwave,
  tensionOn,
} from './music-tracks.js';
import { hzDroneStop, hzS, stepCosmos } from './horizon-track.js';
import { level, lvl, state } from '../core/state.js';
import { tutorial } from '../core/run-state.js';

/**
 * Programa un paso de la música del estilo actual. A cierta altura de la partida lanza un
 * crescendo y cambia a una versión más rápida (synthwave, o el modo rápido de las galaxias).
 *
 * @param {number} s Número de paso, de 0 a 127.
 * @param {number} t0 Momento en que suena, en segundos del reloj de Web Audio.
 */
function scheduleStep(s, t0) {
  if (musicStyle === 'espacial' && state === 'play' && level >= SW_AT) {
    if (!riserOn && s % 32 === 16) {
      setRiserOn(true);
      riser(t0, 16 * STEP);
    } else if (riserOn && s % 32 === 0) {
      setRiserOn(false);
      setMusicStyle('synthwave');
      impact(t0);
      setSwitchAt(t0);
      setSwitchMsg('¡A toda velocidad!');
    }
  }
  if (
    musicStyle !== 'espacial' &&
    musicStyle !== 'synthwave' &&
    musicStyle !== 'phonk' &&
    state === 'play' &&
    level >= 31 &&
    !andFast
  ) {
    if (!riserOn && s % 32 === 16) {
      setRiserOn(true);
      riser(t0, 16 * STEP);
    } else if (riserOn && s % 32 === 0) {
      setRiserOn(false);
      setAndFast(true);
      impact(t0);
      setSwitchAt(t0);
      setSwitchMsg('¡Ya casi!');
    }
  }
  if (musicStyle === 'cosmos') {
    stepCosmos(s, t0);
  } else if (musicStyle.startsWith('gal')) {
    stepGalaxy(s, t0, GAL_CFG[+musicStyle.slice(3)]);
  } else if (musicStyle === 'magallanes') {
    stepMagallanes(s, t0);
  } else if (musicStyle === 'andromeda') {
    stepAndromeda(s, t0);
  } else if (musicStyle === 'synthwave') {
    stepSynthwave(s, t0);
  } else if (musicStyle === 'phonk') {
    stepPhonk(s, t0);
  } else {
    stepEspacial(s, t0);
  }
}
/**
 * Programa los pasos que caen en los próximos 0,12 segundos; se llama cada 25 ms. Si el reloj
 * se atrasó (pestaña en segundo plano), salta al presente en lugar de tocar todo de golpe.
 */
function tick() {
  if (!AC || !musicOn) {
    return;
  }
  try {
    if (nextT < AC.currentTime - 0.2) {
      setNextT(AC.currentTime + 0.05);
    }
    while (nextT < AC.currentTime + 0.12) {
      scheduleStep(step, nextT);
      setNextT(nextT + STEP);
      setStep((step + 1) % 128);
    }
  } catch (e) {}
}
/** Arranca la música del nivel actual (o la del menú) desde el principio, con una entrada suave. */
function startMusic() {
  if (!AC) {
    return;
  }
  try {
    setMusicStyle(
      !tutorial && state !== 'home' && state !== 'levels'
        ? lvl >= 3
          ? 'gal' + lvl
          : lvl === 1
            ? 'magallanes'
            : lvl === 2
              ? 'andromeda'
              : 'cosmos'
        : 'espacial',
    );
    setRiserOn(false);
    setSwitchAt(0);
    setAndFast(false);
    setMusicOn(true);
    setStep(0);
    setNextT(AC.currentTime + 0.08);
    setKickQueue([]);
    setMusicStart(nextT);
    const n = AC.currentTime;
    musicBus.gain.cancelScheduledValues(n);
    musicBus.gain.setValueAtTime(0.0001, n);
    musicBus.gain.exponentialRampToValueAtTime(0.55, n + 0.25);
    if (!schedTimer) {
      setSchedTimer(setInterval(tick, 25));
    }
    galAmbience(musicStyle === 'andromeda');
    if (hzS) {
      hzS.crashed = false;
    }
    tensionOn();
    tick();
  } catch (e) {}
}
let galAmb = null; // ambiente de Andrómeda sonando: {g, nodes}
/**
 * Enciende o apaga el ambiente grave de Andrómeda: cinco tonos que respiran lentamente.
 *
 * @param {boolean} on true para encender, false para apagar con un fundido de 0,6 segundos.
 */
function galAmbience(on) {
  if (!AC) {
    return;
  }
  try {
    const n = AC.currentTime;
    if (galAmb) {
      const a = galAmb;
      galAmb = null;
      a.g.gain.cancelScheduledValues(n);
      a.g.gain.setValueAtTime(Math.max(a.g.gain.value, 0.0001), n);
      a.g.gain.exponentialRampToValueAtTime(0.0001, n + 0.6);
      a.nodes.forEach(o => {
        try {
          o.stop(n + 0.7);
        } catch (e) {}
      });
    }
    if (!on) {
      return;
    }
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, n);
    g.gain.exponentialRampToValueAtTime(0.22, n + 3);
    g.connect(musVol || master);
    const nodes = [],
      lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.connect(g);
    for (const [f, gn, rate] of [
      [ROOT_A / 8, 0.35, 0.05],
      [(ROOT_A / 8) * 1.5, 0.18, 0.07],
      [(ROOT_A / 2) * 2.0, 0.03, 0.11],
      [(ROOT_A / 2) * 2.52, 0.025, 0.09],
      [(ROOT_A / 2) * 3.0, 0.02, 0.13],
    ]) {
      const o = AC.createOscillator(),
        og = AC.createGain(),
        l = AC.createOscillator(),
        lg = AC.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      og.gain.value = gn;
      l.frequency.value = rate;
      lg.gain.value = gn * 0.8;
      l.connect(lg);
      lg.connect(og.gain);
      o.connect(og);
      og.connect(lp);
      og.connect(echoBus());
      o.start(n);
      l.start(n);
      nodes.push(o, l);
    }
    galAmb = { g, nodes };
  } catch (e) {}
}
/**
 * Detiene la música con un fundido.
 *
 * @param {boolean} [quick] true para un corte casi inmediato (0,06 s en vez de 0,35 s).
 */
function stopMusic(quick) {
  galAmbience(false);
  try {
    hzDroneStop(quick);
  } catch (e) {}
  if (!AC) {
    return;
  }
  try {
    setMusicOn(false);
    const n = AC.currentTime;
    musicBus.gain.cancelScheduledValues(n);
    musicBus.gain.setValueAtTime(Math.max(musicBus.gain.value, 0.0001), n);
    musicBus.gain.exponentialRampToValueAtTime(0.0001, n + (quick ? 0.06 : 0.35));
  } catch (e) {}
}

export { startMusic, stopMusic };

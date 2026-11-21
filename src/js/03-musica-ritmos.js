// ---------- beat (se van sumando capas al subir) ----------
const BPM = 140,
  STEP = 60 / BPM / 4,
  TB = 60 / BPM;
let musicOn = false,
  nextT = 0,
  step = 0,
  schedTimer = null,
  kickQueue = [],
  musicStart = -1;
const BASS = {
  0: [0, 0.42],
  6: [0, 0.28],
  10: [-2, 0.42],
  16: [0, 0.42],
  22: [3, 0.28],
  26: [-2, 0.42],
};
function dKick(t0) {
  const o = AC.createOscillator(),
    g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(165, t0);
  o.frequency.exponentialRampToValueAtTime(45, t0 + 0.12);
  g.gain.setValueAtTime(0.95, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
  o.connect(g);
  g.connect(musicBus);
  o.start(t0);
  o.stop(t0 + 0.32);
  kickQueue.push(t0);
}
function dClap(t0) {
  for (let i = 0; i < 3; i++) {
    noiseHit(t0 + i * 0.011, i < 2 ? 0.03 : 0.17, 'bandpass', 1600, 0.55, musicBus);
  }
}
function dHat(t0, open) {
  noiseHit(t0, open ? 0.17 : 0.035, 'highpass', 8000, open ? 0.16 : 0.2, musicBus);
}
function d808(t0, semi, dur) {
  const f = (ROOT / 8) * Math.pow(2, semi / 12);
  if (!shaper) {
    shaper = AC.createWaveShaper();
    const c = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = i / 128 - 1;
      c[i] = Math.tanh(x * 2.5);
    }
    shaper.curve = c;
    const sg = AC.createGain();
    sg.gain.value = 0.55;
    shaper.connect(sg);
    sg.connect(musicBus);
  }
  const o = AC.createOscillator(),
    g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f * 1.5, t0);
  o.frequency.exponentialRampToValueAtTime(f, t0 + 0.06);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.9, t0 + 0.01);
  g.gain.setValueAtTime(0.9, t0 + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(shaper);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}
// ---------- estilos de música (mismo tempo: 140, para que la Respiración siga sincronizada)
// ----------
const lv = () => (state === 'play' ? level : 30); // en el menú se escucha completa
// progresión en Sol# menor: i – VI – III – VII (Sol#m, Mi, Si, Fa#), dos compases cada acorde
const PROG = [
  [0, [0, 3, 7]],
  [-4, [0, 4, 7]],
  [3, [0, 4, 7]],
  [-2, [0, 4, 7]],
];
const hz = semi => (ROOT / 2) * Math.pow(2, semi / 12); // Sol#3 como referencia
let echoIn = null;
function echoBus() {
  if (echoIn) {
    return echoIn;
  }
  echoIn = AC.createGain();
  const dl = AC.createDelay(1),
    fb = AC.createGain(),
    wet = AC.createGain();
  dl.delayTime.value = TB * 0.75;
  fb.gain.value = 0.38;
  wet.gain.value = 0.35;
  echoIn.connect(dl);
  dl.connect(fb);
  fb.connect(dl);
  dl.connect(wet);
  wet.connect(musicBus);
  return echoIn;
}
function env(g, t0, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}
function pad(t0, freqs, dur, gain, cutoff) {
  const lp = AC.createBiquadFilter(),
    g = AC.createGain();
  lp.type = 'lowpass';
  lp.frequency.value = cutoff;
  lp.Q.value = 0.5;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.35);
  g.gain.setValueAtTime(gain, t0 + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.4);
  lp.connect(g);
  g.connect(musicBus);
  for (const f of freqs) {
    for (const det of [-6, 6]) {
      const o = AC.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      o.start(t0);
      o.stop(t0 + dur + 0.5);
    }
  }
}
function pluck(t0, f, gain, type, echo) {
  const o = AC.createOscillator(),
    g = AC.createGain(),
    lp = AC.createBiquadFilter();
  o.type = type || 'triangle';
  o.frequency.value = f;
  lp.type = 'lowpass';
  lp.frequency.value = 2600;
  env(g, t0, 0.005, gain, 0.28);
  o.connect(lp);
  lp.connect(g);
  g.connect(musicBus);
  if (echo) {
    g.connect(echoBus());
  }
  o.start(t0);
  o.stop(t0 + 0.32);
}
function bassNote(t0, f, dur, gain, type, cutoff) {
  const o = AC.createOscillator(),
    g = AC.createGain(),
    lp = AC.createBiquadFilter();
  o.type = type;
  o.frequency.value = f;
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(cutoff * 2, t0);
  lp.frequency.exponentialRampToValueAtTime(cutoff, t0 + dur * 0.6);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.setValueAtTime(gain, t0 + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(lp);
  lp.connect(g);
  g.connect(musicBus);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}
function softKick(t0, gain) {
  const o = AC.createOscillator(),
    g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(110, t0);
  o.frequency.exponentialRampToValueAtTime(38, t0 + 0.18);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
  o.connect(g);
  g.connect(musicBus);
  o.start(t0);
  o.stop(t0 + 0.5);
  kickQueue.push(t0);
}
function snareSW(t0) {
  noiseHit(t0, 0.32, 'bandpass', 1800, 0.45, musicBus);
  const o = AC.createOscillator(),
    g = AC.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(220, t0);
  o.frequency.exponentialRampToValueAtTime(140, t0 + 0.08);
  env(g, t0, 0.003, 0.25, 0.12);
  o.connect(g);
  g.connect(musicBus);
  o.start(t0);
  o.stop(t0 + 0.15);
}
// Espacial: oscuro y cinematográfico, en medio tiempo
// qué tan cerca está el agujero negro de la Tierra: 0 = lejos, 1 = a punto de tragarla
function dangerNow() {
  return state === 'play' ? clamp((1.7 - (pLevel - sunLevel)) / 1.3, 0, 1) : 0;
}
// un zumbido disonante que tiembla, sube de tono y se acelera con el peligro
let tens = null,
  tensT = 0;
function tensionOn() {
  if (!AC || tens) {
    return;
  }
  try {
    const g = AC.createGain(),
      trem = AC.createGain(),
      lfo = AC.createOscillator(),
      lfoG = AC.createGain(),
      bp = AC.createBiquadFilter();
    g.gain.value = 0.0001;
    trem.gain.value = 0.5;
    lfo.frequency.value = 4;
    lfoG.gain.value = 0.5;
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 0.8;
    const o1 = AC.createOscillator(),
      o2 = AC.createOscillator();
    o1.type = o2.type = 'sawtooth';
    o1.frequency.value = hz(12);
    o2.frequency.value = hz(13); // segunda menor: inquietante
    lfo.connect(lfoG);
    lfoG.connect(trem.gain);
    o1.connect(bp);
    o2.connect(bp);
    bp.connect(trem);
    trem.connect(g);
    g.connect(musicBus);
    o1.start();
    o2.start();
    lfo.start();
    tens = { g, lfo, o1, o2, bp };
  } catch (e) {}
}
function tensionSet(d) {
  if (!tens) {
    return;
  }
  try {
    const n = AC.currentTime,
      up = Math.pow(2, (3 * d) / 12);
    tens.g.gain.setTargetAtTime(0.0001 + 0.2 * Math.pow(d, 1.3), n, 0.15);
    tens.lfo.frequency.setTargetAtTime(4 + 11 * d, n, 0.2);
    tens.o1.frequency.setTargetAtTime(hz(12) * up, n, 0.3);
    tens.o2.frequency.setTargetAtTime(hz(13) * up, n, 0.3);
    tens.bp.frequency.setTargetAtTime(700 + 1600 * d, n, 0.2);
  } catch (e) {}
}
// alarma del agujero negro: cuanto más cerca, más rápido y más fuerte late (golpe grave + sirena +
// latido)
let alarmT = 0,
  alarmWas = 0,
  dangerFlash = 0;
function alarmTick(dt) {
  if (!AC || muted || state !== 'play' || tutorial) {
    alarmT = 0;
    alarmWas = 0;
    return;
  }
  const d = dangerNow();
  if (d > 0.18 && alarmWas <= 0.18) {
    alarmHit(AC.currentTime + 0.01, d, true);
  } // aviso al entrar en peligro
  alarmWas = d;
  if (d <= 0.18) {
    alarmT = 0;
    return;
  }
  alarmT -= dt;
  if (alarmT <= 0) {
    alarmT = 1.2 - 0.9 * Math.min(1, (d - 0.18) / 0.72);
    alarmHit(AC.currentTime + 0.01, d, false);
  }
}
function alarmHit(t0, d, first) {
  try {
    const k = Math.max(0, Math.min(1, (d - 0.18) / 0.72)),
      out = AC.createGain();
    out.gain.value = 0.9;
    out.connect(musicBus);
    // golpe grave que se siente en el pecho
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(70 + 30 * k, t0);
    o.frequency.exponentialRampToValueAtTime(28, t0 + 0.35);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.55 + 0.35 * k, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    o.connect(g);
    g.connect(out);
    o.start(t0);
    o.stop(t0 + 0.55);
    // segundo latido, como un corazón acelerado
    const o2 = AC.createOscillator(),
      g2 = AC.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(60 + 25 * k, t0 + 0.16);
    o2.frequency.exponentialRampToValueAtTime(30, t0 + 0.4);
    g2.gain.setValueAtTime(0.0001, t0 + 0.16);
    g2.gain.exponentialRampToValueAtTime(0.3 + 0.25 * k, t0 + 0.17);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    o2.connect(g2);
    g2.connect(out);
    o2.start(t0 + 0.16);
    o2.stop(t0 + 0.55);
    // sirena: dos tonos disonantes que caen, más agudos y fuertes con el peligro
    if (k > 0.15 || first) {
      const f0 = 520 + 380 * k;
      for (const [fr, dt0] of [
        [f0, 0],
        [f0 * 1.06, 0.015],
      ]) {
        const s1 = AC.createOscillator(),
          sg = AC.createGain(),
          bp = AC.createBiquadFilter();
        s1.type = 'sawtooth';
        s1.frequency.setValueAtTime(fr, t0 + dt0);
        s1.frequency.exponentialRampToValueAtTime(fr * 0.62, t0 + 0.42);
        bp.type = 'bandpass';
        bp.frequency.value = 1400;
        bp.Q.value = 1.2;
        sg.gain.setValueAtTime(0.0001, t0 + dt0);
        sg.gain.exponentialRampToValueAtTime(first ? 0.14 : 0.05 + 0.11 * k, t0 + dt0 + 0.02);
        sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
        s1.connect(bp);
        bp.connect(sg);
        sg.connect(out);
        s1.start(t0 + dt0);
        s1.stop(t0 + 0.5);
      }
    }
    // succión: ruido que sube, como aire que se escapa hacia el agujero
    if (k > 0.45) {
      const src = AC.createBufferSource();
      src.buffer = NOISE;
      const f = AC.createBiquadFilter(),
        ng = AC.createGain();
      f.type = 'bandpass';
      f.Q.value = 2;
      f.frequency.setValueAtTime(300, t0);
      f.frequency.exponentialRampToValueAtTime(2500 + 2500 * k, t0 + 0.4);
      ng.gain.setValueAtTime(0.0001, t0);
      ng.gain.exponentialRampToValueAtTime(0.1 * k, t0 + 0.3);
      ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      src.connect(f);
      f.connect(ng);
      ng.connect(out);
      src.start(t0);
      src.stop(t0 + 0.5);
    }
    // vibración y un destello rojo leve en pantalla al ritmo de la alarma
    if (!reduceMotion) {
      shake = Math.max(shake, 1.5 + 4 * k);
    }
    buzz(first ? [40, 40, 40] : 18);
    dangerFlash = 0.25 + 0.45 * k;
  } catch (e) {}
}
function stepEspacial(s, t0) {
  const bar = Math.floor(s / 16),
    [root, tones] = PROG[Math.floor(bar / 2) % 4],
    b = s % 16,
    L = lv();
  const dz = dangerNow();
  if (b === 0 || b === 8) {
    softKick(t0, 0.8);
  }
  if (b === 3 || b === 11) {
    softKick(t0, 0.35);
  } // latido doble
  if (dz > 0.4) {
    if (b === 4 || b === 12) {
      softKick(t0, 0.7);
    }
    if (b === 7 || b === 15) {
      softKick(t0, 0.3);
    }
  } // el corazón se acelera
  if (dz > 0.45 && (dz > 0.75 || b % 2 === 0)) {
    noiseHit(t0, 0.025, 'highpass', 7500, 0.04 + 0.1 * dz, musicBus);
  } // tic-tac
  if (b % 4 === 0 && b !== 0 && b !== 8) {
    noiseHit(t0, 0.05, 'highpass', 6000, 0.06, musicBus);
  }
  if (s % 32 === 0) {
    pad(t0, [hz(root - 12), ...tones.map(x => hz(root + x))], 32 * STEP, 0.045, 900);
  }
  if (L >= 12 && b % 16 === 0) {
    bassNote(t0, hz(root - 24), 16 * STEP, 0.32, 'sine', 300);
  }
  if (L >= 5 && b % 2 === 0) {
    const seq = [0, 1, 2, 1, 0, 2, 1, 2],
      tn = tones[seq[(b / 2) % 8] % tones.length];
    pluck(t0, hz(root + tn + 12), 0.07, 'triangle', true);
  }
  if (L >= 25 && b === 0 && bar % 2 === 0) {
    pluck(t0, hz(root + tones[2] + 24), 0.09, 'sine', true);
  }
  if (L >= 25 && b % 2 === 1) {
    noiseHit(t0, 0.03, 'highpass', 9000, 0.04, musicBus);
  }
}
// Synthwave: retro, con energía de persecución
function stepSynthwave(s, t0) {
  const bar = Math.floor(s / 16),
    [root, tones] = PROG[Math.floor(bar / 2) % 4],
    b = s % 16,
    L = lv();
  if (b % 4 === 0) {
    dKick(t0);
  }
  const dz = dangerNow();
  if (dz > 0.45 && (dz > 0.75 || b % 2 === 0)) {
    noiseHit(t0, 0.025, 'highpass', 7500, 0.04 + 0.1 * dz, musicBus);
  } // tic-tac
  if (b % 2 === 0) {
    bassNote(t0, hz(root - 12 + (b % 4 === 2 ? 12 : 0)), STEP * 1.8, 0.22, 'sawtooth', 500);
  }
  if (L >= 5) {
    if (b === 4 || b === 12) {
      snareSW(t0);
    }
    if (b % 4 === 2) {
      dHat(t0, false);
    }
  }
  if (L >= 5 && s % 128 >= 124) {
    snareSW(t0);
  } // redoble cada 8 compases
  if (L >= 12 && s % 32 === 0) {
    pad(
      t0,
      tones.map(x => hz(root + x + 12)),
      32 * STEP,
      0.035,
      1800,
    );
  }
  if (L >= 25) {
    const up = [0, 1, 2, 3],
      tn = up[b % 4] === 3 ? 12 : tones[up[b % 4]];
    pluck(t0, hz(root + tn + 12), 0.055, 'square', true);
  }
}
function stepPhonk(s, t0) {
  s = s % 32;
  const b = s % 16,
    L = lv();
  if (b === 0 || b === 6 || b === 10) {
    dKick(t0);
  }
  if (b % 2 === 0) {
    dHat(t0, false);
  }
  if (L >= 5 && (b === 4 || b === 12)) {
    dClap(t0);
  }
  if (L >= 12 && BASS[s]) {
    d808(t0, BASS[s][0], BASS[s][1]);
  }
  if (L >= 25) {
    if (b === 2 || b === 14) {
      dHat(t0, true);
    }
    if (s === 30 || s === 31) {
      dHat(t0 + STEP / 2, false);
    }
  }
}
const SW_AT = 30; // anillo donde la música se vuelve Synthwave
let riserOn = false,
  switchAt = 0;
function riser(t0, dur) {
  const src = AC.createBufferSource();
  src.buffer = NOISE;
  const f = AC.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(250, t0);
  f.frequency.exponentialRampToValueAtTime(6000, t0 + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.35, t0 + dur);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.05);
  src.connect(f);
  f.connect(g);
  g.connect(musicBus);
  src.start(t0);
  src.stop(t0 + dur + 0.1);
}
function impact(t0) {
  noiseHit(t0, 1.4, 'highpass', 2500, 0.5, musicBus);
  dKick(t0);
}
// ---------- música de Andrómeda: otra galaxia, otra escala ----------
// Re# frigio (la 2ª menor le da un aire extraño y lejano), campanas metálicas, bajo ondulante y un
// ritmo sincopado 3-3-4
const ROOT_A = 311.13;
const PROG_A = [
  [0, [0, 3, 7]],
  [1, [0, 4, 7]],
  [0, [0, 3, 7]],
  [-2, [0, 4, 7]],
]; // i – bII – i – bVII
const PHRY = [0, 1, 3, 7, 8, 10, 12, 13];
const hzA = sm => (ROOT_A / 2) * Math.pow(2, sm / 12);
let andFast = false,
  switchMsg = '¡A toda velocidad!';
function fmBell(t0, f, gain, dur) {
  const c = AC.createOscillator(),
    m = AC.createOscillator(),
    mg = AC.createGain(),
    g = AC.createGain();
  c.type = 'sine';
  m.type = 'sine';
  c.frequency.value = f;
  m.frequency.value = f * 3.5;
  mg.gain.setValueAtTime(f * 2.2, t0);
  mg.gain.exponentialRampToValueAtTime(f * 0.05, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  m.connect(mg);
  mg.connect(c.frequency);
  c.connect(g);
  g.connect(musicBus);
  g.connect(echoBus());
  c.start(t0);
  m.start(t0);
  c.stop(t0 + dur + 0.05);
  m.stop(t0 + dur + 0.05);
}
function reese(t0, f, dur, gain) {
  const lp = AC.createBiquadFilter(),
    g = AC.createGain();
  lp.type = 'lowpass';
  lp.Q.value = 3;
  lp.frequency.setValueAtTime(180, t0);
  lp.frequency.linearRampToValueAtTime(520, t0 + dur * 0.5);
  lp.frequency.linearRampToValueAtTime(200, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.03);
  g.gain.setValueAtTime(gain, t0 + dur * 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  lp.connect(g);
  g.connect(musicBus);
  for (const det of [-14, 14]) {
    const o = AC.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.detune.value = det;
    o.connect(lp);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
}
function stepAndromeda(s, t0) {
  const bar = Math.floor(s / 16),
    [root, tones] = PROG_A[Math.floor(bar / 2) % 4],
    b = s % 16,
    L = lv(),
    fast = andFast || (state !== 'play' && L >= 31);
  // el mismo carácter del final desde el principio, más suave, y creciendo
  if (s % 32 === 0) {
    pad(t0, [hzA(root - 12), ...tones.map(x => hzA(root + x))], 32 * STEP, 0.03, 700);
  }
  if (fast || b % 2 === 0) {
    // campanas corriendo en corcheas (al doble en el final)
    const idx = (b + bar * 3) % PHRY.length;
    fmBell(t0, hzA(root + PHRY[idx] + (fast ? 24 : 12)), fast ? 0.05 : 0.045, fast ? 0.45 : 0.55);
  }
  if (b === 0 || b === 8) {
    reese(t0, hzA(root - 24), 8 * STEP, 0.18);
  } // bajo ondulante desde el inicio
  if (b === 0 || b === 8) {
    softKick(t0, 0.7);
  } // pulso suave
  if (b === 4 || b === 12) {
    noiseHit(t0, 0.05, 'bandpass', 3500, 0.14, musicBus);
  } // golpe seco
  if (L >= 15 && b % 2 === 0) {
    dHat(t0, false);
  } // platillos
  if (L >= 28) {
    if (b % 4 === 0) {
      dKick(t0);
    }
    if (b === 4 || b === 12) {
      dClap(t0);
    }
  } // bombo constante
  if (fast) {
    dHat(t0, false);
    if (b === 6 || b === 14) {
      dKick(t0);
    }
  } // recta final: todo al doble
  const dz = dangerNow();
  if (dz > 0.45 && (dz > 0.75 || b % 2 === 0)) {
    noiseHit(t0, 0.025, 'highpass', 7500, 0.04 + 0.1 * dz, musicBus);
  }
}

// ---------- música de las Nubes de Magallanes: luminosa y aireada ----------
// Fa# lidio (la 4ª aumentada suena a asombro), notas de kalimba, un coro lejano y un bajo saltarín
// a contratiempo
const ROOT_M = 369.99;
const PROG_M = [
  [0, [0, 4, 7]],
  [2, [0, 4, 7]],
  [-3, [0, 3, 7]],
  [-5, [0, 4, 7]],
]; // I – II – vi – V
const LYD = [0, 2, 4, 6, 7, 9, 11, 12];
const hzM = sm => (ROOT_M / 2) * Math.pow(2, sm / 12);
function kalimba(t0, f, gain, dur) {
  const o = AC.createOscillator(),
    o2 = AC.createOscillator(),
    g = AC.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(f * 1.02, t0);
  o.frequency.exponentialRampToValueAtTime(f, t0 + 0.03);
  o2.type = 'sine';
  o2.frequency.value = f * 4.02;
  const g2 = AC.createGain();
  g2.gain.setValueAtTime(gain * 0.25, t0);
  g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  o2.connect(g2);
  g2.connect(g);
  g.connect(musicBus);
  g.connect(echoBus());
  o.start(t0);
  o2.start(t0);
  o.stop(t0 + dur + 0.05);
  o2.stop(t0 + 0.15);
}
function choir(t0, freqs, dur, gain) {
  const f1 = AC.createBiquadFilter(),
    f2 = AC.createBiquadFilter(),
    g = AC.createGain();
  f1.type = 'bandpass';
  f1.frequency.value = 730;
  f1.Q.value = 6;
  f2.type = 'bandpass';
  f2.frequency.value = 1090;
  f2.Q.value = 8;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.3);
  f1.connect(g);
  f2.connect(g);
  g.connect(musicBus);
  for (const f of freqs) {
    const o = AC.createOscillator(),
      v = AC.createOscillator(),
      vg = AC.createGain();
    o.type = 'sawtooth';
    o.frequency.value = f;
    v.frequency.value = 5.2;
    vg.gain.value = f * 0.006;
    v.connect(vg);
    vg.connect(o.frequency);
    o.connect(f1);
    o.connect(f2);
    o.start(t0);
    v.start(t0);
    o.stop(t0 + dur + 0.35);
    v.stop(t0 + dur + 0.35);
  }
}
function bounceBass(t0, f, gain) {
  const o = AC.createOscillator(),
    g = AC.createGain(),
    lp = AC.createBiquadFilter();
  o.type = 'sawtooth';
  o.frequency.value = f;
  lp.type = 'lowpass';
  lp.Q.value = 4;
  lp.frequency.setValueAtTime(900, t0);
  lp.frequency.exponentialRampToValueAtTime(160, t0 + 0.18);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
  o.connect(lp);
  lp.connect(g);
  g.connect(musicBus);
  o.start(t0);
  o.stop(t0 + 0.25);
  const s = AC.createOscillator(),
    sg = AC.createGain();
  s.type = 'sine';
  s.frequency.value = f / 2;
  sg.gain.setValueAtTime(0.0001, t0);
  sg.gain.exponentialRampToValueAtTime(gain * 1.2, t0 + 0.01);
  sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
  s.connect(sg);
  sg.connect(musicBus);
  s.start(t0);
  s.stop(t0 + 0.28);
}
function stepMagallanes(s, t0) {
  const bar = Math.floor(s / 16),
    [root, tones] = PROG_M[Math.floor(bar / 2) % 4],
    b = s % 16,
    L = lv(),
    fast = andFast || (state !== 'play' && L >= 31);
  if (s % 32 === 0) {
    choir(t0, [hzM(root - 12), ...tones.map(x => hzM(root + x))], 32 * STEP, 0.05);
  } // coro lejano
  if (fast || b % 2 === 0) {
    // kalimba en corcheas (al doble en el final)
    const pat = [0, 2, 4, 7, 5, 4, 2, 1],
      idx = (pat[((b / (fast ? 1 : 2)) | 0) % 8] + bar) % LYD.length;
    kalimba(t0, hzM(root + LYD[idx] + (fast ? 24 : 12)), fast ? 0.07 : 0.08, fast ? 0.3 : 0.5);
  }
  if (b % 4 === 2) {
    bounceBass(t0, hzM(root - 12), 0.16);
  } // bajo saltarín a contratiempo
  if (b === 0 || b === 8) {
    softKick(t0, 0.7);
  }
  if (b % 2 === 1) {
    noiseHit(t0, 0.035, 'bandpass', 6500, 0.05, musicBus);
  } // shaker
  if (b === 4 || b === 12) {
    noiseHit(t0, 0.05, 'bandpass', 2800, 0.14, musicBus);
  }
  if (L >= 15 && b % 2 === 0) {
    dHat(t0, false);
  }
  if (L >= 28) {
    if (b % 4 === 0) {
      dKick(t0);
    }
    if (b === 4 || b === 12) {
      dClap(t0);
    }
  }
  if (fast) {
    dHat(t0, false);
    if (b === 6 || b === 14) {
      dKick(t0);
    }
    if (b === 2 || b === 10) {
      bounceBass(t0, hzM(root), 0.12);
    }
  }
  const dz = dangerNow();
  if (dz > 0.45 && (dz > 0.75 || b % 2 === 0)) {
    noiseHit(t0, 0.025, 'highpass', 7500, 0.04 + 0.1 * dz, musicBus);
  }
}

// ---------- música de los niveles 4 a 8: misma energía, identidad propia ----------
const GAL_CFG = {
  3: {
    root: 220.0,
    scale: [0, 2, 3, 5, 7, 9, 10, 12],
    prog: [
      [0, [0, 3, 7]],
      [5, [0, 4, 7]],
      [3, [0, 4, 7]],
      [-2, [0, 4, 7]],
    ],
    lead: 'saw',
    pat: [0, 3, 6, 8, 11, 14],
    bass: 'reese',
    pad: 'pad',
    perc: 'tribal',
  }, // Centaurus A: La dórico, tambores
  4: {
    root: 277.18,
    scale: [0, 2, 3, 5, 7, 8, 11, 12],
    prog: [
      [0, [0, 3, 7]],
      [-4, [0, 4, 7]],
      [5, [0, 3, 7]],
      [7, [0, 4, 7]],
    ],
    lead: 'kal',
    pat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: 'bounce',
    pad: 'choir',
    perc: 'shaker',
  }, // Remolino: Do# menor armónica, en remolino
  5: {
    root: 329.63,
    scale: [0, 2, 4, 6, 7, 9, 11, 12],
    prog: [
      [0, [0, 4, 7]],
      [2, [0, 4, 7]],
      [-3, [0, 3, 7]],
      [-1, [0, 3, 7]],
    ],
    lead: 'bell',
    pat: [0, 2, 5, 8, 10, 13],
    bass: 'sub',
    pad: 'choir',
    perc: 'club',
  }, // Sombrero: Mi lidio, campanas
  6: {
    root: 174.61,
    scale: [0, 1, 4, 5, 7, 8, 10, 12],
    prog: [
      [0, [0, 4, 7]],
      [1, [0, 4, 7]],
      [0, [0, 4, 7]],
      [-2, [0, 3, 7]],
    ],
    lead: 'saw',
    pat: [0, 3, 6, 10, 12, 14],
    bass: 'reese',
    pad: 'pad',
    perc: 'club',
  }, // M87: Fa frigio dominante, oscuro
  7: {
    root: 207.65,
    scale: [0, 2, 3, 5, 7, 8, 10, 12],
    prog: [
      [0, [0, 3, 7]],
      [8, [0, 4, 7]],
      [3, [0, 4, 7]],
      [-2, [0, 4, 7]],
    ],
    lead: 'bell',
    pat: [0, 3, 6, 8, 11, 14],
    bass: 'reese',
    pad: 'choir',
    perc: 'tribal',
  }, // Sagitario A*: Sol# menor, épico
};
function pluckSaw(t0, f, gain, dur) {
  const o = AC.createOscillator(),
    lp = AC.createBiquadFilter(),
    g = AC.createGain();
  o.type = 'sawtooth';
  o.frequency.value = f;
  lp.type = 'lowpass';
  lp.Q.value = 5;
  lp.frequency.setValueAtTime(2600, t0);
  lp.frequency.exponentialRampToValueAtTime(320, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(lp);
  lp.connect(g);
  g.connect(musicBus);
  g.connect(echoBus());
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
function tom(t0, f, gain) {
  const o = AC.createOscillator(),
    g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f * 1.7, t0);
  o.frequency.exponentialRampToValueAtTime(f, t0 + 0.12);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
  o.connect(g);
  g.connect(musicBus);
  o.start(t0);
  o.stop(t0 + 0.35);
}
function subPulse(t0, f, gain) {
  const o = AC.createOscillator(),
    g = AC.createGain();
  o.type = 'sine';
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
  o.connect(g);
  g.connect(musicBus);
  o.start(t0);
  o.stop(t0 + 0.32);
}
function stepGalaxy(s, t0, c) {
  const bar = Math.floor(s / 16),
    [root, tones] = c.prog[Math.floor(bar / 2) % 4],
    b = s % 16,
    L = lv(),
    fast = andFast || (state !== 'play' && L >= 31);
  const hz = sm => (c.root / 2) * Math.pow(2, sm / 12);
  if (s % 32 === 0) {
    const ch = [hz(root - 12), ...tones.map(x => hz(root + x))];
    if (c.pad === 'choir') {
      choir(t0, ch, 32 * STEP, 0.045);
    } else {
      pad(t0, ch, 32 * STEP, 0.03, 700);
    }
  }
  if (fast || c.pat.includes(b)) {
    const idx = ((fast ? b : c.pat.indexOf(b)) + bar * 2) % c.scale.length,
      f = hz(root + c.scale[idx] + (fast ? 24 : 12));
    if (c.lead === 'bell') {
      fmBell(t0, f, fast ? 0.045 : 0.06, fast ? 0.4 : 0.8);
    } else if (c.lead === 'kal') {
      kalimba(t0, f, fast ? 0.07 : 0.08, fast ? 0.3 : 0.5);
    } else {
      pluckSaw(t0, f, fast ? 0.045 : 0.06, fast ? 0.18 : 0.3);
    }
  }
  if (c.bass === 'reese' && (b === 0 || b === 8)) {
    reese(t0, hz(root - 24), 8 * STEP, 0.18);
  }
  if (c.bass === 'bounce' && b % 4 === 2) {
    bounceBass(t0, hz(root - 12), 0.16);
  }
  if (c.bass === 'sub' && (b === 0 || b === 6 || b === 10)) {
    subPulse(t0, hz(root - 24), 0.3);
  }
  if (b === 0 || b === 8) {
    softKick(t0, 0.7);
  }
  if (c.perc === 'tribal') {
    if (b === 4 || b === 12) {
      tom(t0, 110, 0.3);
    }
    if (b === 14) {
      tom(t0, 150, 0.22);
    }
  } else if (c.perc === 'shaker') {
    if (b % 2 === 1) {
      noiseHit(t0, 0.035, 'bandpass', 6500, 0.05, musicBus);
    }
    if (b === 4 || b === 12) {
      noiseHit(t0, 0.05, 'bandpass', 2800, 0.14, musicBus);
    }
  } else if (b === 4 || b === 12) {
    dClap(t0);
  }
  if (L >= 15 && b % 2 === 0) {
    dHat(t0, false);
  }
  if (L >= 28) {
    if (b % 4 === 0) {
      dKick(t0);
    }
    if ((b === 4 || b === 12) && c.perc !== 'club') {
      dClap(t0);
    }
  }
  if (fast) {
    dHat(t0, false);
    if (b === 6 || b === 14) {
      dKick(t0);
    }
  }
  const dz = dangerNow();
  if (dz > 0.45 && (dz > 0.75 || b % 2 === 0)) {
    noiseHit(t0, 0.025, 'highpass', 7500, 0.04 + 0.1 * dz, musicBus);
  }
}

function organ(t0, freqs, dur, gain, bright) {
  const lp = AC.createBiquadFilter(),
    g = AC.createGain(),
    trem = AC.createOscillator(),
    tg = AC.createGain();
  lp.type = 'lowpass';
  lp.frequency.value = 900 + 2600 * (bright || 0);
  lp.Q.value = 0.4;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(1.2, dur * 0.3));
  g.gain.setValueAtTime(gain, t0 + dur * 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.6);
  trem.frequency.value = 5.6;
  tg.gain.value = gain * 0.06;
  trem.connect(tg);
  tg.connect(g.gain);
  lp.connect(g);
  g.connect(musicBus);
  g.connect(echoBus());
  // tubos del órgano: fundamental y armónicos (8', 4', 2 2/3', 2')
  for (const f of freqs) {
    for (const [m, a] of [
      [1, 1],
      [2, 0.5],
      [3, 0.22],
      [4, 0.18],
      [0.5, 0.55],
    ]) {
      const o = AC.createOscillator(),
        og = AC.createGain();
      o.type = 'sine';
      o.frequency.value = f * m;
      og.gain.value = a;
      o.connect(og);
      og.connect(lp);
      o.start(t0);
      o.stop(t0 + dur + 0.7);
    }
  }
  trem.start(t0);
  trem.stop(t0 + dur + 0.7);
}

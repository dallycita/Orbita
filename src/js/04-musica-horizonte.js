// ---------- "Horizonte de sucesos": la banda sonora del Sistema solar ----------
// La idea: no es una historia de amor, es una persecución. La música tiene dos personajes:
//  · el agujero negro: un zumbido enorme que "late" cada vez más rápido, y un motivo de dos notas que CAE medio tono,
//    como la gravedad, y que se repite cada vez más seguido cuanto más cerca está (como el tiburón de Tiburón);
//  · la Tierra: una frase de cristal, frágil, que corre cada vez más rápido para escapar.
// Debajo, un tono que sube sin fin (escala de Shepard): la sensación de que algo se acerca y nunca termina.
// Todo con una reverberación de varios segundos, como un espacio inmenso y vacío.
const HZ_PROG = [
  [0, [0, 3, 7]],
  [-4, [0, 4, 7]],
  [1, [0, 4, 7]],
  [7, [0, 3, 7]],
]; // i – bVI – bII – v  (Sol# menor, oscura)
const HZ_EARTH = [24, 15, 19, 15, 22, 15, 19, 15]; // la frase de la Tierra, sobre una nota fija
let hzS = null;
function hzEnsure() {
  if (hzS && hzS.ac === AC) {
    return hzS;
  }
  const len = Math.floor(AC.sampleRate * 6.5),
    buf = AC.createBuffer(2, len, AC.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      const x = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - x, 3.2) * (i < 400 ? i / 400 : 1);
    }
  }
  const rev = AC.createConvolver();
  rev.buffer = buf;
  const lp = AC.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3800;
  const out = AC.createGain();
  out.gain.value = 0.85;
  rev.connect(lp);
  lp.connect(out);
  hzS = { ac: AC, rev, shep: 0, drone: null };
  out.connect(hzBus());
  return hzS;
}
function hzOut(node, dry, wet) {
  const a = AC.createGain(),
    b = AC.createGain();
  a.gain.value = dry;
  b.gain.value = wet;
  node.connect(a);
  node.connect(b);
  a.connect(hzBus());
  b.connect(hzEnsure().rev);
}
// el agujero negro: un zumbido continuo con dos voces casi iguales que "laten" entre sí
function hzDroneStart() {
  const S = hzEnsure();
  if (S.drone) {
    return;
  }
  const n = AC.currentTime,
    g = AC.createGain(),
    lp = AC.createBiquadFilter();
  g.gain.setValueAtTime(0.0001, n);
  g.gain.exponentialRampToValueAtTime(0.08, n + 4);
  lp.type = 'lowpass';
  lp.frequency.value = 260;
  lp.Q.value = 3;
  lp.connect(g);
  hzOut(g, 0.8, 0.5);
  const f = ROOT / 4,
    oA = AC.createOscillator(),
    oB = AC.createOscillator(),
    oS = AC.createOscillator(),
    sg = AC.createGain();
  oA.type = 'sawtooth';
  oB.type = 'sawtooth';
  oA.frequency.value = f;
  oB.frequency.value = f * 1.004;
  oS.type = 'sine';
  oS.frequency.value = f / 2;
  sg.gain.value = 0.9;
  oA.connect(lp);
  oB.connect(lp);
  oS.connect(sg);
  sg.connect(g);
  [oA, oB, oS].forEach(o => o.start(n));
  S.drone = { g, lp, oA, oB, oS, f };
}
function hzDroneStop(quick) {
  if (!hzS || !hzS.drone) {
    return;
  }
  const D = hzS.drone;
  hzS.drone = null;
  hzS.sec = null;
  try {
    const n = AC.currentTime,
      f = quick ? 0.08 : 1.2;
    D.g.gain.cancelScheduledValues(n);
    D.g.gain.setValueAtTime(Math.max(D.g.gain.value, 0.0001), n);
    D.g.gain.exponentialRampToValueAtTime(0.0001, n + f);
    [D.oA, D.oB, D.oS].forEach(o => o.stop(n + f + 0.1));
  } catch (e) {}
}
// el motivo de la gravedad: dos notas graves y pesadas; la segunda cae medio tono
function hzPull(t0, f, gain) {
  for (const [ff, dl, dur] of [
    [f, 0, 0.55],
    [f * Math.pow(2, -1 / 12), 0.32, 1.6],
  ]) {
    const t1 = t0 + dl,
      g = AC.createGain(),
      lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2;
    lp.frequency.setValueAtTime(1500, t1);
    lp.frequency.exponentialRampToValueAtTime(220, t1 + dur);
    g.gain.setValueAtTime(0.0001, t1);
    g.gain.exponentialRampToValueAtTime(gain, t1 + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t1 + dur);
    lp.connect(g);
    hzOut(g, 0.9, 0.45);
    for (const det of [-9, 9]) {
      const o = AC.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = ff;
      o.detune.value = det;
      o.connect(lp);
      o.start(t1);
      o.stop(t1 + dur + 0.05);
    }
    const s = AC.createOscillator(),
      sg = AC.createGain();
    s.type = 'sine';
    s.frequency.value = ff / 2;
    sg.gain.setValueAtTime(0.0001, t1);
    sg.gain.exponentialRampToValueAtTime(gain * 1.4, t1 + 0.02);
    sg.gain.exponentialRampToValueAtTime(0.0001, t1 + dur);
    s.connect(sg);
    sg.connect(hzBus());
    s.start(t1);
    s.stop(t1 + dur + 0.05);
  }
}
// la Tierra: cristal frágil, mucho eco
function hzGlass(t0, f, gain, dur) {
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  hzOut(g, 0.5, 0.9);
  for (const [m, a] of [
    [1, 1],
    [3, 0.12],
    [4.01, 0.06],
  ]) {
    const o = AC.createOscillator(),
      og = AC.createGain();
    o.type = 'sine';
    o.frequency.value = f * m;
    og.gain.value = a;
    o.connect(og);
    og.connect(g);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
}
// el tono que sube sin fin (escala de Shepard–Risset): siete voces separadas por octavas que suben juntas
function hzShepard(t0, dur, gain, rate) {
  const S = hzEnsure(),
    p0 = S.shep,
    bell = x => Math.exp(-Math.pow((x - 3.5) / 1.25, 2));
  for (let i = 0; i < 7; i++) {
    const x0 = (i + p0) % 7,
      x1 = x0 + rate;
    if (x1 >= 7) {
      continue;
    }
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(55 * Math.pow(2, x0), t0);
    o.frequency.exponentialRampToValueAtTime(55 * Math.pow(2, x1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain * bell(x0), t0 + 0.03);
    g.gain.linearRampToValueAtTime(gain * bell(x1), t0 + dur);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur + 0.04);
    o.connect(g);
    hzOut(g, 0.35, 0.8);
    o.start(t0);
    o.stop(t0 + dur + 0.06);
  }
  S.shep = (p0 + rate) % 7;
}
// ---- producción: bus propio con compresión (para que suene lleno y fuerte) y más instrumentos ----
function hzBus() {
  const S = hzEnsure();
  if (S.bus) {
    return S.bus;
  }
  const g = AC.createGain(),
    comp = AC.createDynamicsCompressor(),
    out = AC.createGain();
  comp.threshold.value = -20;
  comp.knee.value = 8;
  comp.ratio.value = 3.5;
  comp.attack.value = 0.01;
  comp.release.value = 0.25;
  g.connect(comp);
  comp.connect(out);
  out.gain.value = 1.6;
  out.connect(musicBus);
  S.bus = g;
  return g;
}
function hzPan(node, pan) {
  if (!AC.createStereoPanner) {
    return node;
  }
  const p = AC.createStereoPanner();
  p.pan.value = pan;
  node.connect(p);
  return p;
}
// cuerdas graves en staccato (spiccato): el motor de la persecución
function hzString(t0, f, gain, pan, len) {
  const g = AC.createGain(),
    lp = AC.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 1.2;
  lp.frequency.setValueAtTime(2600, t0);
  lp.frequency.exponentialRampToValueAtTime(500, t0 + len);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
  lp.connect(g);
  const o = hzPan(g, pan);
  hzOut(o, 0.9, 0.25);
  for (const det of [-11, 0, 9]) {
    const s = AC.createOscillator();
    s.type = 'sawtooth';
    s.frequency.value = f;
    s.detune.value = det;
    s.connect(lp);
    s.start(t0);
    s.stop(t0 + len + 0.03);
  }
}
// "braam": un golpe de metales graves, enorme, como una sirena de barco en el espacio
function hzBraam(t0, f, gain, dur) {
  const g = AC.createGain(),
    lp = AC.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 4;
  lp.frequency.setValueAtTime(180, t0);
  lp.frequency.exponentialRampToValueAtTime(1700, t0 + 0.35);
  lp.frequency.exponentialRampToValueAtTime(260, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.06);
  g.gain.setValueAtTime(gain * 0.8, t0 + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  lp.connect(g);
  hzOut(g, 0.8, 0.6);
  for (const [m, det] of [
    [0.5, -6],
    [0.5, 7],
    [1, -4],
    [1, 5],
    [1.5, 0],
    [2, 3],
  ]) {
    const o = AC.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f * m;
    o.detune.value = det;
    o.connect(lp);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
  const s = AC.createOscillator(),
    sg = AC.createGain();
  s.type = 'sine';
  s.frequency.value = f / 2;
  sg.gain.setValueAtTime(0.0001, t0);
  sg.gain.exponentialRampToValueAtTime(gain * 1.6, t0 + 0.05);
  sg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(sg);
  sg.connect(hzBus());
  s.start(t0);
  s.stop(t0 + dur + 0.05);
}
// cuerdas agudas en trémolo: el nervio, la ansiedad (un racimo disonante que tiembla)
function hzTremolo(t0, freqs, dur, gain) {
  const g = AC.createGain(),
    trem = AC.createOscillator(),
    tg = AC.createGain(),
    lp = AC.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 5200;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.2);
  const amp = AC.createGain();
  amp.gain.value = 0.5;
  trem.frequency.value = 13;
  tg.gain.value = 0.5;
  trem.connect(tg);
  tg.connect(amp.gain);
  lp.connect(amp);
  amp.connect(g);
  hzOut(g, 0.6, 0.7);
  freqs.forEach((f, i) => {
    const o = AC.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.detune.value = i % 2 ? 6 : -6;
    o.connect(lp);
    o.start(t0);
    o.stop(t0 + dur + 0.25);
  });
  trem.start(t0);
  trem.stop(t0 + dur + 0.25);
}
// coro lejano: la inmensidad del espacio
function hzChoir(t0, freqs, dur, gain) {
  const f1 = AC.createBiquadFilter(),
    f2 = AC.createBiquadFilter(),
    g = AC.createGain();
  f1.type = 'bandpass';
  f1.frequency.value = 600;
  f1.Q.value = 5;
  f2.type = 'bandpass';
  f2.frequency.value = 1040;
  f2.Q.value = 7;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.4);
  f1.connect(g);
  f2.connect(g);
  hzOut(g, 0.5, 0.9);
  for (const f of freqs) {
    const o = AC.createOscillator(),
      v = AC.createOscillator(),
      vg = AC.createGain();
    o.type = 'sawtooth';
    o.frequency.value = f;
    v.frequency.value = 4.8 + Math.random();
    vg.gain.value = f * 0.007;
    v.connect(vg);
    vg.connect(o.frequency);
    o.connect(f1);
    o.connect(f2);
    o.start(t0);
    v.start(t0);
    o.stop(t0 + dur + 0.45);
    v.stop(t0 + dur + 0.45);
  }
}
// tambores épicos (taiko) con mucha sala, platillo al revés y golpe de platillo
function hzTaiko(t0, gain) {
  const o = AC.createOscillator(),
    g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, t0);
  o.frequency.exponentialRampToValueAtTime(48, t0 + 0.3);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
  o.connect(g);
  hzOut(g, 1, 0.35);
  o.start(t0);
  o.stop(t0 + 0.6);
  const src = AC.createBufferSource();
  src.buffer = NOISE;
  const bp = AC.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 220;
  bp.Q.value = 0.8;
  const ng = AC.createGain();
  ng.gain.setValueAtTime(gain * 0.5, t0);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
  src.connect(bp);
  bp.connect(ng);
  hzOut(ng, 1, 0.4);
  src.start(t0);
  src.stop(t0 + 0.15);
}
function hzSwell(t0, dur, gain) {
  const src = AC.createBufferSource();
  src.buffer = NOISE;
  src.loop = true;
  const hp = AC.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(1500, t0);
  hp.frequency.exponentialRampToValueAtTime(7000, t0 + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.03);
  src.connect(hp);
  hp.connect(g);
  hzOut(g, 0.7, 0.5);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}
function hzCrash(t0, gain) {
  const src = AC.createBufferSource();
  src.buffer = NOISE;
  const hp = AC.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 4500;
  const g = AC.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2);
  src.connect(hp);
  hp.connect(g);
  hzOut(g, 0.7, 0.6);
  src.start(t0);
  src.stop(t0 + 2.3);
}
function hzSnare(t0, gain) {
  noiseHit(t0, 0.09, 'bandpass', 1900, gain, hzBus());
}
const HZ_OST = [0, 0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 12, 0, 7, 3, 0]; // cuerdas: 3-3-2, el pulso de la persecución
const HZ_ACC = new Set([0, 3, 6, 8, 11, 14]);
// ---- la melodía que cambia: un mismo motivo (pegadizo) que se transforma por secciones ----
// Escala de Sol# menor en grados (0 = Sol#). El motivo se "secuencia" sobre los acordes: misma forma, otra altura.
const HZ_SC = [0, 2, 3, 5, 7, 8, 10];
const hzDeg = d => {
  const o = Math.floor(d / 7),
    k = ((d % 7) + 7) % 7;
  return HZ_SC[k] + 12 * o;
};
// el gancho (32 pasos, ritmo 3-3-2): sube, respira y cae al final, como la gravedad que te jala
const HZ_HOOK_A = {
  0: 7,
  3: 9,
  6: 11,
  8: 10,
  11: 9,
  14: 7,
  16: 6,
  19: 7,
  22: 9,
  24: 7,
  27: 6,
  30: 4,
};
// la respuesta: misma forma, pero termina hacia arriba (la Tierra todavía puede escapar)
const HZ_HOOK_B = {
  0: 7,
  3: 9,
  6: 11,
  8: 10,
  11: 9,
  14: 7,
  16: 9,
  19: 10,
  22: 11,
  24: 12,
  27: 11,
  30: 14,
};
// la versión lenta (para el respiro): las mismas notas clave, largas
const HZ_HOOK_C = { 0: 7, 8: 9, 16: 11, 24: 13 };
// acordes: oscuros al principio; épicos (i – bVI – bIII – bVII) cuando suena el gancho; con bII en el respiro
const HZ_CH = {
  dark: [
    [0, 0],
    [5, 5],
    [1, 1],
    [4, 4],
  ],
  epic: [
    [0, 0],
    [5, 5],
    [2, 2],
    [6, 6],
  ],
  fall: [
    [5, 5],
    [6, 6],
    [0, 0],
    [0, 0],
  ],
};
const HZ_TRI = {
  0: [0, 3, 7],
  5: [0, 4, 7],
  2: [0, 4, 7],
  6: [0, 4, 7],
  1: [0, 4, 7],
  4: [0, 3, 7],
};
// patrones de cuerdas distintos para cada sección
const HZ_OSTS = {
  a: [0, 0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 12, 0, 7, 3, 0],
  b: [0, 0, 7, 0, 0, 7, 0, 12, 0, 0, 7, 0, 10, 7, 3, 7],
  c: [0, 12, 0, 12, 7, 12, 0, 12, 0, 12, 0, 12, 10, 12, 7, 12],
};
// la sección según qué tan lejos vas
function hzSection(L, fast) {
  if (fast) {
    return 'climax';
  }
  if (L < 7) {
    return 'vacio';
  }
  if (L < 15) {
    return 'caza';
  }
  if (L < 23) {
    return 'eco';
  }
  if (L < 28) {
    return 'respiro';
  }
  return 'carrera';
}
// voz principal: un sintetizador cálido parecido a cuerdas/metal suave, con vibrato que llega tarde
function hzLead(t0, f, gain, dur, bright, pan) {
  const g = AC.createGain(),
    lp = AC.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 2;
  lp.frequency.setValueAtTime(700 + 2200 * bright, t0);
  lp.frequency.linearRampToValueAtTime(1100 + 3600 * bright, t0 + 0.08);
  lp.frequency.exponentialRampToValueAtTime(600 + 1200 * bright, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.setValueAtTime(gain * 0.85, t0 + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  lp.connect(g);
  hzOut(hzPan(g, pan || 0), 0.8, 0.6);
  const vib = AC.createOscillator(),
    vg = AC.createGain();
  vib.frequency.value = 5.4;
  vg.gain.setValueAtTime(0, t0);
  vg.gain.linearRampToValueAtTime(f * 0.008, t0 + Math.min(0.35, dur * 0.6));
  vib.connect(vg);
  for (const [ty, det] of [
    ['sawtooth', -7],
    ['sawtooth', 7],
    ['square', 0],
  ]) {
    const o = AC.createOscillator();
    o.type = ty;
    o.frequency.value = f;
    o.detune.value = det;
    vg.connect(o.frequency);
    o.connect(lp);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
  vib.start(t0);
  vib.stop(t0 + dur + 0.05);
}
function stepCosmos(s, t0) {
  hzEnsure();
  hzBus();
  if (!hzS.drone) {
    hzDroneStart();
  }
  const b = s % 16,
    s32 = s % 32,
    phrase = Math.floor(s / 32),
    L = lv(),
    prog = Math.min(1, L / GOAL);
  const fast = andFast || (state !== 'play' && L >= 31),
    dz = dangerNow(),
    red = 1 - 0.03 * dz;
  const sec = hzSection(L, fast),
    key = fast ? 2 : 0; // el clímax sube un tono: la sensación de "despegar"
  const prg =
    HZ_CH[sec === 'vacio' || sec === 'respiro' ? (sec === 'respiro' ? 'fall' : 'dark') : 'epic'];
  const [cd] = prg[phrase % 4],
    tri = HZ_TRI[cd] || [0, 3, 7],
    root = hzDeg(cd);
  const hzf = sm => (ROOT / 2) * Math.pow(2, (sm + key) / 12) * red;
  const roll = riserOn && s32 >= 16 && s32 < 28,
    silence = riserOn && s32 >= 28;
  // cambio de sección: golpe de platillo al entrar en una sección intensa
  if (b === 0 && hzS.sec !== sec) {
    const prev = hzS.sec;
    hzS.sec = sec;
    if (prev && (sec === 'caza' || sec === 'eco' || sec === 'carrera')) {
      hzCrash(t0, 0.22);
      hzBraam(t0, hzf(root - 24), 0.14, 2.4);
    }
  }
  // el zumbido del agujero negro
  if (s % 4 === 0 && hzS.drone) {
    const D = hzS.drone;
    D.oB.frequency.setTargetAtTime(D.f * red * (1.003 + 0.02 * dz + 0.006 * prog), t0, 0.3);
    D.oA.frequency.setTargetAtTime(D.f * red, t0, 0.3);
    D.oS.frequency.setTargetAtTime((D.f * red) / 2, t0, 0.3);
    D.lp.frequency.setTargetAtTime(
      silence ? 120 : 220 + 900 * Math.max(dz, prog * 0.6) + (fast ? 700 : 0),
      t0,
      0.25,
    );
    D.g.gain.setTargetAtTime(
      silence
        ? 0.0001
        : (0.05 + 0.07 * prog + 0.09 * dz + (fast ? 0.05 : 0)) * (sec === 'respiro' ? 0.45 : 1),
      t0,
      silence ? 0.05 : 0.4,
    );
  }
  // el tono que sube sin fin (más presente en el respiro: la tensión no se va)
  if (b === 0 && L >= 6) {
    hzShepard(
      t0,
      16 * STEP,
      (0.006 + 0.02 * prog + 0.03 * dz + (fast ? 0.02 : 0) + (sec === 'respiro' ? 0.02 : 0)) *
        (silence ? 1.6 : 1),
      0.05 + 0.14 * dz + 0.04 * prog + (fast ? 0.1 : 0),
    );
  }
  if (roll) {
    const k = s32 - 16,
      every = k < 6 ? 2 : 1;
    if (k % every === 0) {
      hzSnare(t0, 0.05 + 0.035 * k);
    }
    if (k === 0) {
      hzSwell(t0, 12 * STEP, 0.12);
    }
  }
  if (silence) {
    return;
  }
  if (andFast && s32 === 0 && !hzS.crashed) {
    hzS.crashed = true;
    hzCrash(t0, 0.5);
    hzBraam(t0, hzf(root - 12), 0.2, 3.2);
  }
  // armonía: coro y órgano, cada dos compases (siguen los acordes)
  if (s32 === 0) {
    const ch = [hzf(root - 12), ...tri.map(x => hzf(root + x))];
    hzChoir(
      t0,
      ch.map(f => f * 2),
      32 * STEP,
      (0.03 + 0.02 * prog) * (sec === 'respiro' ? 1.6 : 1) + (fast ? 0.03 : 0),
    );
    organ(
      t0,
      ch,
      32 * STEP,
      (0.016 + 0.022 * prog + (fast ? 0.03 : 0)) * (sec === 'respiro' ? 0.5 : 1),
      prog * 0.7 + (fast ? 0.4 : 0),
    );
  }
  if (L >= 12 && s % 64 === 48 && sec !== 'respiro') {
    hzSwell(t0, 16 * STEP, 0.05 + 0.05 * prog);
  }
  // el perseguidor: dos notas que caen, cada vez más seguido; con metales desde la mitad
  const every = fast ? 16 : dz > 0.6 || L >= 34 ? 16 : L >= 18 ? 32 : 64;
  if (s % every === 0) {
    hzPull(t0, hzf(root - 12 + 3), (0.05 + 0.04 * prog + 0.05 * dz) * (fast ? 1.2 : 1));
    if (L >= 16 && sec !== 'respiro') {
      hzBraam(
        t0,
        hzf(root - 24 + 3),
        0.08 + 0.07 * prog + 0.06 * dz + (fast ? 0.06 : 0),
        fast ? 1.5 : 2.6,
      );
    }
  }
  // cuerdas en staccato: cada sección con su propio patrón
  const ost =
    sec === 'climax' || sec === 'carrera' ? HZ_OSTS.c : sec === 'eco' ? HZ_OSTS.b : HZ_OSTS.a;
  if (sec !== 'vacio' && sec !== 'respiro') {
    const all = L >= 14 || fast,
      acc = HZ_ACC.has(b);
    if (all || acc) {
      const f = hzf(root - 12 + ost[b]);
      hzString(
        t0,
        f,
        (acc ? 0.07 : 0.035) * (0.7 + 0.4 * prog) * (fast ? 1.35 : 1) * (1 + 0.4 * dz),
        -0.25,
        acc ? 0.22 : 0.13,
      );
      if (L >= 24 || fast) {
        hzString(t0, f * 2, (acc ? 0.04 : 0.02) * (fast ? 1.3 : 1), 0.3, 0.12);
      }
    }
  } else if (sec === 'respiro' && b % 8 === 0) {
    hzString(t0, hzf(root - 12), 0.05, -0.2, 0.5);
  } // en el respiro, solo un pulso lento
  // LA MELODÍA: el mismo gancho, contado de otra forma en cada sección
  const hook = phrase % 2 === 0 ? HZ_HOOK_A : HZ_HOOK_B,
    shift = cd; // se mueve con los acordes (secuencia)
  const note = (H, st) => (H[st] !== undefined ? hzDeg(H[st] + shift) : null);
  if (sec === 'vacio') {
    // fragmentos: solo el inicio del gancho, lejano, en cristal
    if (phrase % 2 === 0 && (s32 === 0 || s32 === 3 || s32 === 6)) {
      const n = note(HZ_HOOK_A, s32);
      hzGlass(t0, hzf(n), 0.03, 1.8);
    }
  } else if (sec === 'caza') {
    // el gancho completo, en cristal
    const n = note(hook, s32);
    if (n !== null) {
      hzGlass(t0, hzf(n), 0.034 + 0.01 * prog, 1.1);
    }
  } else if (sec === 'eco') {
    // ahora lo canta una voz cálida, y el cristal le responde una octava arriba
    const n = note(hook, s32);
    if (n !== null) {
      hzLead(t0, hzf(n), 0.04, s32 % 8 === 6 || s32 % 8 === 0 ? 0.32 : 0.24, 0.35, -0.15);
    }
    const e = note(hook, (s32 + 29) % 32);
    if (e !== null && b % 2 === 1) {
      hzGlass(t0, hzf(e + 12), 0.018, 0.7);
    }
  } else if (sec === 'respiro') {
    // la misma melodía, lenta y enorme, en el coro y la voz: el respiro antes de la carrera
    const n = note(HZ_HOOK_C, s32);
    if (n !== null) {
      hzLead(t0, hzf(n), 0.045, 8 * STEP * 1.1, 0.15, 0);
      hzChoir(t0, [hzf(n + 12)], 8 * STEP, 0.03);
    }
    if (b % 4 === 0) {
      hzGlass(t0, hzf(root + 19 + (b === 8 ? 3 : 0)), 0.016, 1.4);
    }
  } else if (sec === 'carrera') {
    // la melodía en voz brillante + el bajo la responde invertida
    const n = note(hook, s32);
    if (n !== null) {
      hzLead(t0, hzf(n), 0.05, 0.22, 0.7, -0.1);
      hzLead(t0, hzf(n - 12), 0.025, 0.22, 0.3, 0.15);
    }
    const inv = note(hook, s32);
    if (inv !== null && s32 % 8 === 0) {
      hzString(t0, hzf(root - 24 + (14 - (hook[s32] - 7))), 0.05, 0, 0.4);
    }
  } else {
    // clímax: todo junto, una octava arriba, con coro y cristal doblando
    const n = note(hook, s32);
    if (n !== null) {
      hzLead(t0, hzf(n + 12), 0.045, 0.2, 0.9, -0.1);
      hzLead(t0, hzf(n), 0.04, 0.2, 0.6, 0.1);
      hzGlass(t0, hzf(n + 24), 0.015, 0.35);
    }
    if (s32 % 8 === 0) {
      hzChoir(t0, [hzf(root + 12), hzf(root + 19)], 8 * STEP, 0.025);
    }
  }
  // cuerdas agudas temblando: ansiedad
  if (s32 === 0 && (L >= 20 || dz > 0.35)) {
    hzTremolo(
      t0,
      [hzf(root + 24), hzf(root + 25), hzf(root + 31)],
      32 * STEP,
      (0.006 + 0.012 * prog + 0.03 * dz + (fast ? 0.012 : 0)) * (sec === 'respiro' ? 1.8 : 1),
    );
  }
  // tambores: cambian por sección
  if (sec === 'respiro') {
    if (s32 === 0) {
      hzTaiko(t0, 0.4);
    }
    if (s32 === 0 || s32 === 2) {
      softKick(t0, s32 === 0 ? 0.3 + 0.3 * dz : 0.2 + 0.2 * dz);
    }
    return;
  }
  if (L >= 12 && (b === 0 || b === 2)) {
    softKick(t0, b === 0 ? 0.55 + 0.25 * dz : 0.35 + 0.2 * dz);
  }
  if (sec === 'caza' && (b === 0 || b === 10)) {
    hzTaiko(t0, 0.35);
  }
  if (sec === 'eco' && (b === 0 || b === 6 || b === 10)) {
    hzTaiko(t0, 0.4);
  }
  if (sec === 'carrera') {
    if (b === 0 || b === 6 || b === 10 || b === 13) {
      hzTaiko(t0, 0.5);
    }
    if (b === 4 || b === 12) {
      hzSnare(t0, 0.14);
    }
  }
  if (fast) {
    if ([0, 3, 6, 8, 11, 14].includes(b)) {
      hzTaiko(t0, b === 0 || b === 8 ? 0.7 : 0.45);
    }
    if (b === 4 || b === 12) {
      hzSnare(t0, 0.22);
    }
    if (b % 2 === 1) {
      noiseHit(t0, 0.025, 'highpass', 9000, 0.045, musicBus);
    }
  }
}

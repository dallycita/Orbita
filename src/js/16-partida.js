function makeRing(k) {
  if (k === 0) {
    return { obs: [], w: 0, phase: 0, type: 'clasico' };
  }
  const type = ringType(k),
    dir = rng() < 0.5 ? -1 : 1,
    base = rng() * Math.PI * 2,
    obs = [];
  const ring = { obs, w: 0, phase: 0, type };
  if (type === 'vacio') {
    ring.w = dir * 0.3;
    return ring;
  }
  if (type === 'uno') {
    obs.push({ a: base, r: 9, seed: rng() * 100 });
    ring.w = dir * 0.45;
    return ring;
  }
  if (type === 'gusano') {
    ring.w = 0;
    return ring;
  } // donde apareces dentro del gusano
  if (type === 'orbita') {
    // dentro del gusano: anillos quietos con uno o dos huecos; cada hueco queda a un lado del
    // anterior (izquierda o derecha)
    const prev = gapC[k - 1] !== undefined ? gapC[k - 1] : -Math.PI / 2,
      two = k < 40,
      sg = rng() < 0.5 ? -1 : 1;
    const gc = prev + sg * (0.4 + rng() * 0.4);
    gapC[k] = gc;
    ring.gc = gc;
    const hg = two ? 0.68 : 0.6,
      stepA = 0.21,
      ad = (x, y) => Math.abs(Math.atan2(Math.sin(x - y), Math.cos(x - y)));
    const pre = k === 39,
      g1 = pre ? gc - 0.78 : gc,
      // el último de dos huecos los junta: desde cualquiera llegas al hueco único que sigue
      g2 = pre ? gc + 0.78 : gc + Math.PI;
    for (let a = 0; a < Math.PI * 2 - 1e-6; a += stepA) {
      const ang = gc + a;
      if (ad(ang, g1) < hg || (two && ad(ang, g2) < hg)) {
        continue;
      }
      obs.push({ a: ang, r: 8, seed: rng() * 100 });
    }
    if (pre) {
      ring.g2 = [g1, g2];
    }
    ring.w = k >= 40 ? (rng() < 0.5 ? -1 : 1) * 0.14 : 0;
    return ring;
  }
  if (type === 'barrera') {
    for (let a = 0; a < Math.PI * 2 - 1e-6; a += 0.2) {
      obs.push({ a: base + a, r: 9, seed: rng() * 100 });
    }
    ring.w = dir * 0.25;
    return ring;
  }
  if (type === 'muralla') {
    // anillo casi lleno con uno o dos huecos
    const gaps = lvl >= 6 && !tutorial ? 1 : 2,
      hg = lvl === 5 && !tutorial ? 0.38 : !tutorial && TUNE[lvl] ? TUNE[lvl].hg : 0.46,
      stepA = 0.22; // nivel 1: murallas siempre con dos huecos amplios
    for (let a = 0; a < Math.PI * 2 - 1e-6; a += stepA) {
      let inGap = false;
      for (let g = 0; g < gaps; g++) {
        const c = (g * Math.PI * 2) / gaps,
          d = Math.atan2(Math.sin(a - c), Math.cos(a - c));
        if (Math.abs(d) < hg) {
          inGap = true;
        }
      }
      if (!inGap) {
        obs.push({ a: base + a, r: 9, seed: rng() * 100 });
      }
    }
    ring.w = dir * Math.min(0.5 + k * 0.006, 0.8) * (!tutorial ? RING_MUL[lvl] : 1);
  } else if (type === 'respiracion') {
    // asteroides grandes que se encogen en cada golpe: ahí se abre el paso
    // 16 asteroides: grandes cierran el anillo, chicos dejan pasar a la Tierra con margen.
    // El giro va con la música: en cada golpe en que se encogen, hay un hueco justo encima de ti.
    const n = 16,
      sig = (Math.PI * 2) / n;
    ring.w = (dir * sig) / (4 * TB);
    ring.sync = true;
    const off = -Math.PI / 2 - sig / 2 - ring.w * JUMP_DUR;
    for (let i = 0; i < n; i++) {
      obs.push({ a: off + i * sig, r: 24, seed: rng() * 100 });
    }
  } else if (type === 'nova') {
    const stepA = 0.22;
    ring.k = k;
    ring.na = base + 0.11;
    // la estrella también quema: no se atraviesa
    obs.push({ a: ring.na, r: 9, seed: 0, star: true });
    for (let a = 0.22; a < Math.PI * 2 - 0.2; a += stepA) {
      obs.push({ a: base + a + 0.11, r: 9, seed: rng() * 100 });
    }
    ring.w = dir * 0.22;
  } else if (type === 'contragiro') {
    // dos arcos que giran en sentidos opuestos
    const m = !tutorial && TUNE[lvl] ? TUNE[lvl].arc : 10,
      stepA = 0.22;
    for (let i = 0; i < m; i++) {
      obs.push({ a: base + i * stepA, r: 9, seed: rng() * 100, dir: 1 });
      obs.push({ a: base + Math.PI + i * stepA, r: 9, seed: rng() * 100, dir: -1 });
    }
    ring.w = Math.min(0.42 + k * 0.005, 0.7) * (!tutorial && TUNE[lvl] ? TUNE[lvl].cg(k) : 1);
  } else if (type === 'escalera') {
    // todos los anillos del bloque giran igual y con el hueco alineado: se pueden encadenar
    let bs = k;
    while (bs > 1 && ringType(bs - 1) === 'escalera') {
      bs--;
    }
    const bdir = bs % 2 ? 1 : -1,
      hg = 0.45,
      stepA = 0.22;
    for (let a = 0; a < Math.PI * 2 - 1e-6; a += stepA) {
      let inGap = false;
      for (let g = 0; g < 3; g++) {
        const c = (g * Math.PI * 2) / 3,
          d = Math.atan2(Math.sin(a - c), Math.cos(a - c));
        if (Math.abs(d) < hg) {
          inGap = true;
        }
      }
      if (!inGap) {
        obs.push({ a: a + bs * 1.3, r: 9, seed: rng() * 100 });
      }
    }
    ring.w = bdir * 0.8;
    ring.phase = ring.w * t;
  } else if (type === 'marea' || type === 'arrastre') {
    // marea: acelera y frena y se deforma en óvalo · arrastre: el espacio te lleva consigo
    const n = k < 20 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      obs.push({
        a: base + i * ((Math.PI * 2) / n) + (rng() - 0.5) * 0.4,
        r: 9.5,
        seed: rng() * 100,
      });
    }
    ring.w =
      dir *
      Math.min(
        type === 'marea' ? 0.6 + k * 0.006 : 0.5 + k * 0.005,
        type === 'marea' ? 0.95 : 0.8,
      ) *
      (!tutorial ? RING_MUL[lvl] : 1);
    ring.tid = rng() * Math.PI;
    ring.tv = 0.45 + rng() * 0.3;
    ring.ws = rng() * 6;
  } else if (type === 'freno') {
    // gira y de pronto cambia de sentido
    const n = k < 30 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      obs.push({
        a: base + i * ((Math.PI * 2) / n) + (rng() - 0.5) * 0.4,
        r: 9.5,
        seed: rng() * 100,
      });
    }
    ring.w = dir * Math.min(0.9 + k * 0.01, 1.6);
    ring.sgn = 1;
    ring.ft = 0;
    ring.fp = 1.2 + rng() * 0.8;
    ring.flash = 0;
  } else {
    const size = () => (k < 20 ? 9 : 9 + rng() * 1.5);
    const n = (k < 12 ? 1 : k < 32 ? 2 : 3) + (lvl >= 5 && !tutorial ? 1 : 0);
    const sp = Math.min(0.55 + k * 0.01, 1.05) * (0.85 + rng() * 0.3);
    for (let i = 0; i < n; i++) {
      obs.push({
        a: base + i * ((Math.PI * 2) / n) + (rng() - 0.5) * 0.5,
        r: size(),
        seed: rng() * 100,
      });
    }
    ring.w = dir * sp * (!tutorial ? RING_MUL[lvl] : 1);
  }
  if (!tutorial && (type === 'clasico' || type === 'muralla' || type === 'respiracion')) {
    const nebS = lvl === 2 ? OBJ_NEBULA : NEB_AT[lvl],
      pulS = lvl === 2 ? OBJ_PULSAR : PUL_AT[lvl];
    if (nebS && nebS.has(k)) {
      ring.obj = placeInGap(ring, { kind: 'nebula' });
    } else if (pulS && pulS.has(k)) {
      ring.obj = placeInGap(ring, { kind: 'pulsar' });
    } else if (COIN_RINGS[lvl] && COIN_RINGS[lvl].has(k)) {
      ring.coin = placeInGap(ring, {});
    }
  }
  return ring;
}
function ensureRings() {
  for (let k = Math.max(0, level - 3); k <= Math.min(level + 6, curGoal()); k++) {
    if (!rings.has(k)) {
      rings.set(k, makeRing(k));
    }
  }
  for (const k of [...rings.keys()]) {
    if (k < level - 3) {
      rings.delete(k);
    }
  }
}
function setup() {
  rngState = SEED;
  swallow = null;
  holeFlare = 0;
  gapC = {};
  wh = null;
  whShock = null;
  whRip = null;
  bend = { str: 0, a: -Math.PI / 2, L: 0, on: false, grow: 1, fixed: false };
  rings = new Map();
  level = 0;
  pLevel = 0;
  camLevel = 0;
  pAng = -Math.PI / 2;
  jumping = false;
  jumpT = 0;
  combo = 0;
  lastLand = -9;
  score = 0;
  streak = 0;
  jumpClear = 999;
  culprit = null;
  culpritT = 0;
  landPop = 0;
  astFade = 0;
  appear = 1;
  particles = [];
  trail = [];
  texts = [];
  burns = [];
  timeScale = 1;
  slowTimer = 0;
  sunLevel = -1.6;
  lastEaten = -2;
  ghostT = 0;
  shieldT = 0;
  eclipseT = 0;
  pfx = [];
  lastJT = 1;
  periLeft = 0;
  predT = 0;
  burnT = 0;
  hazardsReset();
  try {
    GLBG.reset();
  } catch (e) {}
  ensureRings();
}
function start() {
  hot = 0;
  hotT = 0;
  skyFlash = 0;
  waveProx = 0;
  waveBeepT = 0;
  if (elPanel && elPanel.classList) {
    elPanel.classList.remove('wscr');
  }
  tutorial = false;
  pendingTut = false;
  setup();
  state = 'play';
  winT = 0;
  perfCount = 0;
  if (lvl >= 3) {
    attX[lvl] = (attX[lvl] || 0) + 1;
    try {
      localStorage.setItem('orbita_p' + (lvl + 1) + '_intentos', String(attX[lvl]));
    } catch (e) {}
  } else if (lvl === 2) {
    attempts3++;
    try {
      localStorage.setItem('orbita_p3_intentos', String(attempts3));
    } catch (e) {}
  } else if (lvl === 1) {
    attempts2++;
    try {
      localStorage.setItem('orbita_p2_intentos', String(attempts2));
    } catch (e) {}
  } else {
    attempts++;
    try {
      localStorage.setItem('orbita_p1_intentos', String(attempts));
    } catch (e) {}
  }
  runRecord = bestOf(lvl);
  newRec = false;
  updateRingHUD();
  elHud.style.opacity = 1;
  elPanel.classList.add('hide');
  charge = 0;
  jumpTarget = 1;
  pending = false;
  gest = null;
  showHint = false;
  shieldLeft = 1;
  usedDouble = false;
  pushing = false;
  starBoost = false;
  runCoins = 0;
  startMusic();
}
setup();

const rr = k => R0 + (k - camLevel) * GAP;

// distancia libre entre la luna y el asteroide más cercano del anillo k
function clearance(k, onlyApproaching) {
  const ring = rings.get(k);
  if (!ring) {
    return 999;
  }
  const R = rr(k),
    px = Math.cos(pAng) * R,
    py = Math.sin(pAng) * R;
  let m = 999;
  for (const o of ring.obs) {
    if (o.gone) {
      continue;
    }
    const oa = obsAng(ring, o);
    if (onlyApproaching) {
      const diff = Math.atan2(Math.sin(oa - pAng), Math.cos(oa - pAng));
      if (diff * (o.dir || 1) * ring.w * (ring.sgn || 1) >= 0) {
        continue;
      }
    }
    const Rs = R * stretchAt(ring, oa);
    m = Math.min(
      m,
      Math.hypot(px - Math.cos(oa) * Rs, py - Math.sin(oa) * Rs) - (PR + obsRad(ring, o)),
    );
  }
  return m;
}
function upgradeToDouble() {
  if (
    !jumping ||
    jumpTarget !== 1 ||
    charge < chargeMax() ||
    level + 2 > curGoal() ||
    (tutorial && level < 8) ||
    wh ||
    ['gusano', 'orbita'].includes(ringType(level + 1)) ||
    ['gusano', 'orbita'].includes(ringType(level + 2))
  ) {
    return;
  }
  if (!tutorial && curPlanet && curPlanet !== 'tierra') {
    usePower(true);
    return;
  }
  const p1 = Math.min(jumpT / jumpDur(), 1),
    e1 = 1 - Math.pow(1 - p1, 3);
  const p2 = 1 - Math.cbrt(1 - e1 / 2);
  jumpTarget = 2;
  jumpT = p2 * 0.24;
  crossed = false;
  charge = 0;
  showHint = false;
  pending = false;
  usedDouble = true;
  noteDouble();
  noise(0.25, 300, 6000, 0.25, 'bandpass');
  cowbell(SCALE[4] + 12);
  buzz([15, 30, 25]);
}
// ---- la Tierra escapa: fuera del alcance del agujero negro ----
function win() {
  if (tutorial) {
    tutorialWin();
    return;
  }
  const before = unlockedIds();
  misWin(lvl, curPlanet, sesTries);
  state = 'win';
  winT = 0;
  canRestart = false;
  flash = 0.6;
  shake = reduceMotion ? 0 : 8;
  pulse = 1;
  if (level > bestOf(lvl)) {
    setBestOf(lvl, level);
  }
  saveRunStats();
  if (!usedDouble) {
    plutoOk = true;
    try {
      localStorage.setItem('orbita_p1_pluton', '1');
    } catch (e) {}
  }
  const rescued = rescuedCards(before);
  if (score > best) {
    best = score;
    saveBest();
  }
  stopMusic();
  winSound();
  buzz([40, 60, 40, 60, 120]);
  elHud.style.opacity = 0;
  setTimeout(() => {
    const cr = COIN_RINGS[lvl] ? [...COIN_RINGS[lvl]] : [],
      gotR = lvStarsGot(lvl),
      nSt = cr.filter(k => gotR.includes(k)).length,
      nx = LEVELS[lvl + 1];
    elPanel.classList.remove('top');
    elPanel.classList.add('wscr');
    const ICO_RE =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 4.5v4h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const ICO_LV =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.6" fill="currentColor"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="9.6" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".55"/></svg>';
    const ICO_PLAY =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
    const tries = attemptsOf(lvl);
    elPanel.innerHTML =
      '<div class="title wtit">Escapaste</div>' +
      '<div class="wtries">' +
      tries +
      (tries === 1 ? ' intento' : ' intentos') +
      '</div>' +
      (cr.length
        ? '<div class="wstars" aria-label="Estrellas: ' +
          nSt +
          ' de ' +
          cr.length +
          '">' +
          cr
            .map(
              (_, k) =>
                '<span class="' +
                (k < nSt ? 'on' : '') +
                '" style="animation-delay:' +
                (0.35 + k * 0.09).toFixed(2) +
                's">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>' +
                '</span>',
            )
            .join('') +
          '</div>'
        : '') +
      '<div class="wact"><button type="button" class="wico" data-act="again" aria-label="Repetir">' +
      ICO_RE +
      '</button>' +
      (nx
        ? '<button type="button" class="wgo" data-act="next" aria-label="Siguiente: ' +
          nx.name +
          '">' +
          ICO_PLAY +
          '</button>'
        : '<button type="button" class="wgo" data-act="levels" aria-label="Galaxias">' +
          ICO_LV +
          '</button>') +
      '<button type="button" class="wico" data-act="levels" aria-label="Niveles">' +
      ICO_LV +
      '</button></div>';
    if (rescued) {
      markNewPlanets();
    }
    elPanel.classList.remove('hide');
    setTimeout(() => {
      canRestart = true;
    }, 600);
  }, 2400);
}
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
function doubleJump() {
  if (
    state !== 'play' ||
    jumping ||
    charge < chargeMax() ||
    level + 2 > curGoal() ||
    (tutorial && level < 8) ||
    wh ||
    ['gusano', 'orbita'].includes(ringType(level + 1)) ||
    ['gusano', 'orbita'].includes(ringType(level + 2))
  ) {
    return;
  }
  if (!tutorial && curPlanet && curPlanet !== 'tierra') {
    usePower(false);
    return;
  }
  jumping = true;
  jumpT = 0;
  jumpTarget = 2;
  crossed = false;
  charge = 0;
  showHint = false;
  usedDouble = true;
  noteDouble();
  noise(0.25, 300, 6000, 0.25, 'bandpass');
  cowbell(SCALE[4] + 12);
  buzz([15, 30, 25]);
}
function jump() {
  jumping = true;
  jumpT = 0;
  jumpTarget = 1;
  if (periLeft > 0 && !tutorial) {
    periLeft--;
    jumpT = 99;
    ghostT = 0.12;
    pfx.push({ k: 'destello', t: 0, a: pAng, l0: pLevel });
    noise(0.12, 6000, 9000, 0.2, 'highpass');
  }
  jumpClear = 999;
  noise(0.07, 2500, 7000, 0.07, 'highpass');
}
function onLand(isDouble) {
  const z = zoneOf(level);
  const perfect = !isDouble && Math.min(jumpClear, clearance(level, false)) < PERFECT;
  let gain = isDouble ? Math.max(2, lastJT) : 1;
  if (perfect) {
    streak = Math.min(streak + 1, 5);
    gain = 1 + streak;
    perfCount++;
    misEvent('perf');
    if (streak >= 3) {
      misEvent('streak3');
    }
  } else if (!isDouble) {
    streak = 0;
  }
  if (isDouble && !starBoost) {
    texts.push({
      txt: lastJT === 3 ? 'Monte Olimpo +3' : 'Salto doble +2',
      x: 0,
      y: -R0 - 26,
      life: 1,
      size: 16,
      col: z.s2,
    });
  }
  if (lastJT === 3) {
    pfx.push({ k: 'crater', t: 0, a: pAng });
    const pr = rr(level),
      x0 = Math.cos(pAng) * pr,
      y0 = Math.sin(pAng) * pr;
    for (let i = 0; i < 40; i++) {
      const a = pAng + (Math.PI / 2) * (i % 2 ? 1 : -1) + (Math.random() - 0.5) * 0.7,
        v = 50 + Math.random() * 140;
      particles.push({
        x: x0,
        y: y0,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.7 + Math.random() * 0.6,
        col: ['#c8573a', '#e0866a', '#8f3a24', '#f0b090'][i % 4],
        s: 2 + Math.random() * 3,
      });
    }
    shake = reduceMotion ? 0 : 6;
  }
  lastJT = 1;
  starBoost = false;
  if (perfect && charge < chargeMax()) {
    charge++;
    pipFlash[charge - 1] = 1;
    if (charge === chargeMax()) {
      powerReadySound();
      buzz([20, 40, 20, 40, 60]);
      chargeFlash = 1;
      if (!readyHintDone) {
        readyHintDone = true;
        try {
          localStorage.setItem('orbita_p1_poderlisto', '1');
        } catch (e) {}
        texts.push({
          txt: '¡Poder listo!',
          x: 0,
          y: -R0 - 96,
          life: 2.2,
          size: 20,
          col: '#ffd36b',
          center: true,
        });
        texts.push({
          txt: 'Desliza hacia arriba (o tecla D)',
          x: 0,
          y: -R0 - 76,
          life: 2.2,
          size: 12,
          col: BONE,
          center: true,
        });
      }
      showHint = hintsShown < 3;
      if (showHint) {
        hintT = 2.2;
        hintsShown++;
        try {
          localStorage.setItem('orbita_p1_pista', String(hintsShown));
        } catch (e) {}
      }
    }
  }
  score += gain;
  if (!tutorial) {
    misEvent('ring');
    misEvent('reach', level);
  }
  thump();
  pulse = Math.max(pulse, 0.6);
  landPop = 1;
  astFade = 1;
  appear = 0;
  if (!tutorial && runRecord > 0 && level > runRecord && !newRec) {
    newRec = true;
    flash = 0.4;
    buzz([30, 40, 30]);
    texts.push({
      txt: '¡Nuevo récord!',
      x: 0,
      y: -R0 - 70,
      life: 1.8,
      size: 22,
      col: '#8fd0ff',
      center: true,
    });
    setTimeout(() => cowbell(SCALE[7] + 12), 90);
  }
  updateRingHUD();
  if (perfect) {
    cowbell(SCALE[Math.min(3 + streak, SCALE.length - 1)] + (streak >= 5 ? 12 : 0));
    texts.push({ txt: 'Perfecto +' + gain, x: 0, y: -R0 - 26, life: 1, size: 16, col: z.s2 });
    timeScale = 0.4;
    slowTimer = 0.1;
    buzz(15);
  } else {
    cowbell(SCALE[level % 3]);
  }
  if (level % 25 === 0) {
    texts.push({
      txt: 'Zona ' + (level / 25 + 1),
      x: 0,
      y: -R0 - 64,
      life: 1.6,
      size: 28,
      col: BONE,
      center: true,
    });
    flash = 0.35;
    buzz(20);
  }
  ensureRings();
  const nt = ringType(level + 1);
  if (nt !== ringType(level) && TYPE_INFO[nt] && (seenTypes[nt] || 0) < 3) {
    seenTypes[nt] = (seenTypes[nt] || 0) + 1;
    try {
      localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes));
    } catch (e) {}
    // sin texto: el anillo nuevo destella para avisar que algo cambia (se aprende jugando, como en
    // Geometry Dash)
    {
      const nr = rings.get(level + 1);
      if (nr) {
        nr.flash = 1;
      }
    }
    buzz(12);
  }
  if (tutorial && level === 8) {
    charge = 3;
    pipFlash[0] = pipFlash[1] = pipFlash[2] = 1;
    chargeFlash = 1;
    powerReadySound();
    texts.push({ txt: 'Salto doble cargado', x: 0, y: -R0 - 48, life: 1.6, size: 14, col: BONE });
  }
  hazardsOnLand();
  {
    const nr2 = rings.get(level + 1);
    if (nr2 && nr2.type === 'orbita') {
      nr2.phase = 0;
    }
  } // el hueco del siguiente empieza a girar desde que llegas
  const sr0 = rings.get(level);
  const near = it => {
    const sa = it.a + sr0.phase - (sr0.poff || 0),
      dd = Math.atan2(Math.sin(sa - pAng), Math.cos(sa - pAng));
    return Math.abs(dd) * rr(level) < 22;
  };
  const px0 = Math.cos(pAng) * rr(level),
    py0 = Math.sin(pAng) * rr(level);
  // estrella (moneda)
  if (sr0 && sr0.coin && !sr0.coin.got && near(sr0.coin)) {
    sr0.coin.got = true;
    wallet++;
    runCoins++;
    if (!tutorial) {
      misEvent('star');
    }
    try {
      localStorage.setItem('orbita_estrellas', String(wallet));
    } catch (e) {}
    if (!tutorial) {
      const set = lvStarsGot(lvl);
      if (!set.includes(level)) {
        set.push(level);
        try {
          const all = JSON.parse(localStorage.getItem('orbita_lvstars') || '{}');
          all[lvl] = set;
          localStorage.setItem('orbita_lvstars', JSON.stringify(all));
        } catch (e) {}
      }
    }
    updateWallet(true);
    coinChime();
    buzz(15);
    texts.push({ txt: '+1 ★', x: 0, y: -R0 - 48, life: 1.2, size: 16, col: '#ffd36b' });
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2,
        v = 40 + Math.random() * 100;
      particles.push({
        x: px0,
        y: py0,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.6 + Math.random() * 0.4,
        col: i % 2 ? '#fff6e0' : '#ffd36b',
        s: 1.5 + Math.random() * 2,
      });
    }
    if (!seenTypes.moneda) {
      seenTypes.moneda = 1;
      try {
        localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes));
      } catch (e) {}
      texts.push({
        txt: 'Estrellas: se guardan para personalizar tus planetas',
        x: 0,
        y: -R0 - 76,
        life: 2.4,
        size: 12,
        col: BONE,
        center: true,
      });
    }
  }
  // nebulosa o púlsar
  if (sr0 && sr0.obj && !sr0.obj.got && near(sr0.obj)) {
    sr0.obj.got = true;
    pulse = 1;
    const pul = sr0.obj.kind === 'pulsar';
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2,
        v = 40 + Math.random() * 120;
      particles.push({
        x: px0,
        y: py0,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.6 + Math.random() * 0.5,
        col: i % 2 ? '#fff6e0' : pul ? '#9cc8ff' : '#ff9cc6',
        s: 1.5 + Math.random() * 2,
      });
    }
    if (pul) {
      texts.push({
        txt: 'Radiación de púlsar: −1 anillo',
        x: 0,
        y: -R0 - 48,
        life: 1.4,
        size: 14,
        col: '#9cc8ff',
      });
      objChime(false);
      buzz([40, 20, 40]);
      shake = reduceMotion ? 0 : 7;
      noise(0.45, 3000, 400, 0.3, 'lowpass');
      starPush();
      updateRingHUD();
      return;
    } else {
      texts.push({
        txt: 'Energía de nebulosa: +2 anillos',
        x: 0,
        y: -R0 - 48,
        life: 1.4,
        size: 14,
        col: '#ffb3d1',
      });
      objChime(true);
      buzz([10, 30, 10]);
      score += 2;
      updateRingHUD();
      if (level < curGoal()) {
        starLaunch();
        return;
      }
    }
  }
  // presentar cada cosa nueva la primera vez que aparece
  const nx = rings.get(level + 1);
  if (nx && nx.coin && !seenTypes.monedaVista) {
    seenTypes.monedaVista = 1;
    try {
      localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes));
    } catch (e) {}
    {
      const nr = rings.get(level + 1);
      if (nr) {
        nr.flash = 1;
      }
    }
    buzz(12);
  }
  if (nx && nx.obj && !nx.obj.got) {
    const kk = nx.obj.kind === 'pulsar' ? 'pulsar' : 'nebulosa';
    if (!seenTypes[kk]) {
      seenTypes[kk] = 1;
      try {
        localStorage.setItem('orbita_p1_vistos', JSON.stringify(seenTypes));
      } catch (e) {}
      {
        const nr = rings.get(level + 1);
        if (nr) {
          nr.flash = 1;
        }
      }
      buzz(12);
    }
  }
  if (wh && wh.ph === 'orb' && level >= WH_EXIT) {
    whStartOut();
    return;
  }
  if (level >= curGoal()) {
    win();
  }
}
function eatRings() {
  while (lastEaten + 1 <= sunLevel) {
    lastEaten++;
    if (lastEaten >= 1) {
      burns.push({ k: lastEaten, life: 1 });
    }
    if (lvl === 2 && state === 'play' && !reduceMotion) {
      shake = Math.max(shake, 3.5);
    }
  }
}
function die(x, y, cause, who) {
  if (tutorial) {
    tutRespawn(x, y);
    return;
  }
  state = 'dead';
  deadT = 0;
  canRestart = false;
  culprit = who || null;
  culpritT = who ? 1.4 : 0;
  if (cause === 'sun') {
    const r0 = Math.hypot(x, y);
    swallow = { p: 0, a: Math.atan2(y, x), r: r0, r0, done: false };
    shake = 0;
    flash = 0.15;
    timeScale = 1;
    slowTimer = 0;
    stopMusic(true);
    suck();
    buzz([20, 60, 20, 60, 20, 60, 40]);
  } else {
    swallow = null;
    shake = reduceMotion ? 0 : 16;
    flash = 1;
    timeScale = 0.03;
    slowTimer = 0.28;
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2,
        v = 50 + Math.random() * 260;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 1 + Math.random() * 1.2,
        col: ['#2b63c9', '#4fa35a', '#ffffff', '#8fd0ff'][i % 4],
        s: 2 + Math.random() * 3.5,
      });
    }
    stopMusic();
    noise(1, 3500, 60, 0.9, 'lowpass');
    sub();
    buzz([40, 30, 90]);
  }
  const prevRing = bestOf(lvl),
    reached = level,
    before = unlockedIds();
  if (score > best) {
    best = score;
    saveBest();
  }
  if (reached > bestOf(lvl)) {
    setBestOf(lvl, reached);
  }
  saveRunStats();
  const rescued = rescuedCards(before);
  const rec = reached > prevRing;
  if (rescued) {
    markNewPlanets();
  }
  // como en Geometry Dash: sin pantalla, vuelves a intentarlo al instante
  setTimeout(
    () => {
      if (state !== 'dead') {
        return;
      }
      start();
      sesTries++;
      showTry(rec ? reached : 0);
    },
    cause === 'sun' ? 2400 : 850,
  );
}
// "INTENTO N" aparece grande y tenue en el espacio y se desvanece; si fue récord, lo celebra en
// dorado
let sesTries = 1; // intentos de esta sesión en el nivel: vuelve a 1 cada vez que entras al nivel
function showTry(recRing) {
  let el = document.getElementById('tryn');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tryn';
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.innerHTML = 'Intento ' + sesTries + (recRing ? '<b>Récord · anillo ' + recRing + '</b>' : '');
  el.classList.remove('go');
  void el.offsetWidth;
  el.classList.add('go');
}

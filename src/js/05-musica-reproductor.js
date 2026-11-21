// ---------- el reproductor: qué estilo suena, cuándo arranca y cuándo para ----------
function scheduleStep(s, t0) {
  if (musicStyle === 'espacial' && state === 'play' && level >= SW_AT) {
    if (!riserOn && s % 32 === 16) {
      riserOn = true;
      riser(t0, 16 * STEP);
    } else if (riserOn && s % 32 === 0) {
      riserOn = false;
      musicStyle = 'synthwave';
      impact(t0);
      switchAt = t0;
      switchMsg = '¡A toda velocidad!';
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
      riserOn = true;
      riser(t0, 16 * STEP);
    } else if (riserOn && s % 32 === 0) {
      riserOn = false;
      andFast = true;
      impact(t0);
      switchAt = t0;
      switchMsg = '¡Ya casi!';
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
function tick() {
  if (!AC || !musicOn) {
    return;
  }
  try {
    if (nextT < AC.currentTime - 0.2) {
      nextT = AC.currentTime + 0.05;
    }
    while (nextT < AC.currentTime + 0.12) {
      scheduleStep(step, nextT);
      nextT += STEP;
      step = (step + 1) % 128;
    }
  } catch (e) {}
}
function startMusic() {
  if (!AC) {
    return;
  }
  try {
    musicStyle =
      !tutorial && state !== 'home' && state !== 'levels'
        ? lvl >= 3
          ? 'gal' + lvl
          : lvl === 1
            ? 'magallanes'
            : lvl === 2
              ? 'andromeda'
              : 'cosmos'
        : 'espacial';
    riserOn = false;
    switchAt = 0;
    andFast = false;
    musicOn = true;
    step = 0;
    nextT = AC.currentTime + 0.08;
    kickQueue = [];
    musicStart = nextT;
    const n = AC.currentTime;
    musicBus.gain.cancelScheduledValues(n);
    musicBus.gain.setValueAtTime(0.0001, n);
    musicBus.gain.exponentialRampToValueAtTime(0.55, n + 0.25);
    if (!schedTimer) {
      schedTimer = setInterval(tick, 25);
    }
    galAmbience(musicStyle === 'andromeda');
    if (hzS) {
      hzS.crashed = false;
    }
    tensionOn();
    tick();
  } catch (e) {}
}
let galAmb = null;
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
function stopMusic(quick) {
  galAmbience(false);
  try {
    hzDroneStop(quick);
  } catch (e) {}
  if (!AC) {
    return;
  }
  try {
    musicOn = false;
    const n = AC.currentTime;
    musicBus.gain.cancelScheduledValues(n);
    musicBus.gain.setValueAtTime(Math.max(musicBus.gain.value, 0.0001), n);
    musicBus.gain.exponentialRampToValueAtTime(0.0001, n + (quick ? 0.06 : 0.35));
  } catch (e) {}
}

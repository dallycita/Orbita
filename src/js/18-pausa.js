/**
 * Pausa: congela el juego y suspende el audio (la música sigue justo donde quedó, al ritmo).
 * Se ve como la pantalla de "Escapaste", con controles de volumen; al seguir hay una cuenta
 * 3·2·1 para no volver de golpe. Sus sonidos usan otro contexto de audio (`pzAC`), porque `AC`
 * está suspendido mientras dura la pausa.
 */
let paused = false,
  pzCount = null,
  pzPanelCls = '',
  pzDrag = null,
  pzAC = null;
const PZ_ICO = {
  re: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 4.5v4h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lv: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.6" fill="currentColor"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="9.6" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".55"/></svg>',
  go: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
  mus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
  sfx: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
};
const STAR_PATH =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>';
/**
 * HTML de una fila de volumen (ícono para silenciar, nombre, barra deslizable y valor).
 *
 * @param {string} k Canal: 'mus' (música) o 'sfx' (efectos).
 * @param {string} ico Ícono SVG.
 * @param {string} lb Nombre visible.
 * @param {number} v Volumen, de 0 a 100.
 * @returns {string} HTML de la fila.
 */
function pzVolHTML(k, ico, lb, v) {
  return (
    '<div class="pz-vol' +
    (k === 'sfx' ? ' fx' : '') +
    (v <= 0 ? ' zero' : '') +
    '" data-vol="' +
    k +
    '"><button type="button" class="ico" data-pz="mute-' +
    k +
    '" aria-label="' +
    lb +
    ': silenciar o activar">' +
    ico +
    '</button><span class="lb">' +
    lb +
    '</span>' +
    '<span class="line" style="--v:' +
    v +
    '%" role="slider" aria-label="Volumen de ' +
    lb +
    '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
    Math.round(v) +
    '"><i></i><b></b></span><span class="val">' +
    Math.round(v) +
    '</span></div>'
  );
}
/**
 * Pausa la partida en curso y muestra el panel con el avance del nivel, las estrellas y los
 * botones. No hace nada si ya está en pausa o no se está jugando.
 */
function pauseGame() {
  if (paused || state !== 'play') {
    return;
  }
  paused = true;
  gest = null;
  pending = false;
  try {
    if (AC && AC.state === 'running') {
      AC.suspend();
    }
  } catch (e) {}
  buzz(12);
  pzSnd('open');
  const g = curGoal(),
    v = Math.min(level, g),
    bst = tutorial ? 0 : Math.min(bestOf(lvl), g),
    L = LEVELS[lvl] || LEVELS[0];
  const cr = !tutorial && COIN_RINGS[lvl] ? [...COIN_RINGS[lvl]] : [],
    gotS = new Set(lvStarsGot(lvl));
  for (const [k, r] of rings) {
    if (r.coin && r.coin.got) {
      gotS.add(k);
    }
  }
  const nSt = cr.filter(k => gotS.has(k)).length;
  pzPanelCls = elPanel.className;
  elPanel.className = 'wscr pzp';
  elPanel.innerHTML =
    '<div class="title wtit">Pausa</div><div class="wtries">' +
    (tutorial ? 'Tutorial' : L.name) +
    ' · anillo ' +
    v +
    ' de ' +
    g +
    '</div>' +
    '<div class="pz-trip" style="--p:' +
    ((v / g) * 100).toFixed(1) +
    '%;--r:' +
    ((bst / g) * 100).toFixed(1) +
    '%"><span class="bh"></span><span class="line"><i></i>' +
    (bst > 0 && bst < g ? '<u class="rec"></u>' : '') +
    '<b class="me"></b></span><span class="exit"></span></div>' +
    (cr.length
      ? '<div class="wstars" aria-label="Estrellas: ' +
        nSt +
        ' de ' +
        cr.length +
        '">' +
        cr
          .map(
            (k, i) =>
              '<span class="' +
              (gotS.has(k) ? 'on' : '') +
              '" style="animation-delay:' +
              (0.3 + i * 0.07).toFixed(2) +
              's">' +
              STAR_PATH +
              '</span>',
          )
          .join('') +
        '</div>'
      : '') +
    '<div class="wact"><button type="button" class="wico" data-pz="again" aria-label="Reintentar">' +
    PZ_ICO.re +
    '</button><button type="button" class="wgo" data-pz="go" aria-label="Seguir">' +
    PZ_ICO.go +
    '</button><button type="button" class="wico" data-pz="levels" aria-label="Niveles">' +
    PZ_ICO.lv +
    '</button></div>' +
    '<div class="pz-sl">' +
    pzVolHTML('mus', PZ_ICO.mus, 'Música', volMus) +
    pzVolHTML('sfx', PZ_ICO.sfx, 'SFX', volSfx) +
    '</div>';
  if (document.body && document.body.classList) {
    document.body.classList.add('paused');
  }
}
/**
 * Quita el panel de pausa y devuelve al panel las clases que tenía antes.
 */
function pzClose() {
  elPanel.className = pzPanelCls || 'hide';
  elPanel.innerHTML = '';
  if (document.body && document.body.classList) {
    document.body.classList.remove('paused');
  }
}
let pzBus = null,
  pzNoise = null,
  pzHoverT = 0,
  pzLastV = {};
/**
 * Prepara el contexto de audio propio de la pausa (con el mismo eco de los botones del juego
 * y un búfer de ruido) y aplica el volumen de efectos.
 *
 * @returns {AudioContext} El contexto `pzAC`.
 */
function pzCtx() {
  if (!pzAC) {
    pzAC = new (window.AudioContext || window.webkitAudioContext)();
    const out = pzAC.createGain(),
      comp = pzAC.createDynamicsCompressor(),
      dl = pzAC.createDelay(1),
      fb = pzAC.createGain(),
      wet = pzAC.createGain();
    out.gain.value = 0.6;
    dl.delayTime.value = 0.27;
    fb.gain.value = 0.35;
    wet.gain.value = 0.45;
    pzBus = pzAC.createGain();
    pzBus.connect(out);
    pzBus.connect(dl);
    dl.connect(fb);
    fb.connect(dl);
    dl.connect(wet);
    wet.connect(out);
    out.connect(comp);
    comp.connect(pzAC.destination);
    const len = pzAC.sampleRate;
    pzNoise = pzAC.createBuffer(1, len, pzAC.sampleRate);
    const d = pzNoise.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = Math.random() * 2 - 1;
    }
  }
  if (pzAC.state === 'suspended') {
    pzAC.resume();
  }
  pzBus.gain.value = volGain(volSfx);
  return pzAC;
}
/**
 * Nota de cristal, igual que `uiTone` pero en el contexto de la pausa.
 *
 * @param {number} semi Semitonos sobre la nota base `ROOT`.
 * @param {number} t0 Momento de inicio, en segundos del reloj de `pzAC`.
 * @param {number} dur Duración, en segundos.
 * @param {number} gain Ganancia máxima.
 * @param {string} [type] Forma de onda; por defecto 'sine'.
 */
function pzTone(semi, t0, dur, gain, type) {
  const A = pzAC,
    o = A.createOscillator(),
    g = A.createGain(),
    lp = A.createBiquadFilter();
  o.type = type || 'sine';
  o.frequency.value = ROOT * Math.pow(2, semi / 12);
  lp.type = 'lowpass';
  lp.frequency.value = 3200;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(lp);
  lp.connect(g);
  g.connect(pzBus);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
/**
 * Soplo de aire: ruido con un filtro que barre de `f0` a `f1`.
 *
 * @param {number} t0 Momento de inicio, en segundos del reloj de `pzAC`.
 * @param {number} dur Duración, en segundos.
 * @param {number} f0 Frecuencia inicial del filtro, en Hz.
 * @param {number} f1 Frecuencia final del filtro, en Hz.
 * @param {number} gain Ganancia máxima.
 * @param {string} [type] Tipo de filtro; por defecto 'bandpass'.
 */
function pzAir(t0, dur, f0, f1, gain, type) {
  const A = pzAC,
    src = A.createBufferSource(),
    f = A.createBiquadFilter(),
    g = A.createGain();
  src.buffer = pzNoise;
  src.loop = true;
  f.type = type || 'bandpass';
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(f0, t0);
  f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(pzBus);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}
/**
 * Golpe grave que se desliza de `f0` a `f1`.
 *
 * @param {number} t0 Momento de inicio, en segundos del reloj de `pzAC`.
 * @param {number} f0 Frecuencia inicial, en Hz.
 * @param {number} f1 Frecuencia final, en Hz.
 * @param {number} dur Duración, en segundos.
 * @param {number} gain Ganancia máxima.
 */
function pzSub(t0, f0, f1, dur, gain) {
  const A = pzAC,
    o = A.createOscillator(),
    g = A.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(pzBus);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
/**
 * Sonidos de la pausa.
 *
 * @param {string} kind 'open', 'go', 'count', 'launch', 'again', 'levels', 'mute', 'unmute', 'slide' u
 *   'hover'.
 * @param {number} [v] Número de la cuenta (3, 2, 1) para 'count', o volumen de 0 a 100 para
 *   'slide'.
 */
function pzSnd(kind, v) {
  if (muted) {
    return;
  }
  try {
    pzCtx();
    const n = pzAC.currentTime + 0.005;
    if (kind === 'open') {
      // El tiempo se detiene: el aire baja, tres notas de cristal que caen y un golpe grave.
      pzAir(n, 0.55, 3200, 260, 0.2, 'lowpass');
      pzSub(n, 140, 46, 0.5, 0.3);
      pzTone(19, n, 1.2, 0.06);
      pzTone(15, n + 0.07, 1.2, 0.05);
      pzTone(12, n + 0.14, 1.6, 0.055);
      pzTone(24, n + 0.14, 0.7, 0.012);
    } else if (kind === 'go') {
      pzTone(12, n, 1, 0.06);
      pzTone(19, n + 0.06, 1.1, 0.05);
      pzTone(24, n + 0.12, 1.3, 0.045);
      pzAir(n, 0.4, 400, 4200, 0.1);
    } else if (kind === 'count') {
      const s = { 3: 12, 2: 15, 1: 19 }[v] || 12;
      pzTone(s, n, 0.55, 0.075);
      pzTone(s + 12, n, 0.3, 0.018);
      pzSub(n, 110, 70, 0.14, 0.14);
    } else if (kind === 'launch') {
      // Vuelve el juego: un destello y el grave que te lanza.
      pzTone(24, n, 0.9, 0.05);
      pzTone(31, n + 0.03, 0.7, 0.02);
      pzAir(n, 0.35, 6000, 1200, 0.12, 'highpass');
      pzSub(n, 70, 140, 0.22, 0.2);
    } else if (kind === 'again') {
      // Reintentar: un rebobinado corto.
      pzAir(n, 0.32, 300, 3800, 0.16);
      pzTone(7, n, 0.5, 0.05);
      pzTone(12, n + 0.08, 0.7, 0.055);
      pzSub(n + 0.02, 60, 110, 0.2, 0.18);
    } else if (kind === 'levels') {
      // Niveles: el mismo cristal que las flechas del juego, de regreso.
      pzTone(19, n, 1.1, 0.06);
      pzTone(12, n + 0.07, 1.3, 0.055);
      pzTone(24, n + 0.07, 0.7, 0.015);
    } else if (kind === 'mute') {
      pzTone(12, n, 0.4, 0.045);
      pzTone(5, n + 0.06, 0.6, 0.04);
    } else if (kind === 'unmute') {
      pzTone(5, n, 0.4, 0.04);
      pzTone(12, n + 0.06, 0.6, 0.05);
    } else if (kind === 'slide') {
      // Al arrastrar: una nota que sube con el volumen, en la escala del juego.
      const sc = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24],
        s = sc[Math.min(sc.length - 1, Math.round((v / 100) * (sc.length - 1)))];
      pzTone(s, n, 0.35, 0.02 + (0.045 * v) / 100);
      pzTone(s + 12, n, 0.18, 0.008);
    } else if (kind === 'hover') {
      const now = performance.now();
      if (now - pzHoverT < 60) {
        return;
      }
      pzHoverT = now;
      const nt = [0, 3, 7, 10, 12, 15];
      pzTone(nt[Math.floor(Math.random() * nt.length)] + 12, n, 0.9, 0.04);
    }
  } catch (e) {}
}
function pzTick(i) {
  pzSnd('count', i);
}
/**
 * Sale de la pausa con una cuenta 3·2·1 (solo 1 con movimiento reducido) y luego reanuda el
 * juego y el audio. Reinicia `last` para que el tiempo en pausa no cuente como un cuadro largo.
 */
function resumeGame() {
  if (!paused || pzCount || !document.body.classList.contains('paused')) {
    return;
  }
  pzClose();
  let el = document.getElementById('pzcount');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pzcount';
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  const quick = reduceMotion;
  let n = quick ? 1 : 3;
  const show = () => {
    el.innerHTML = '<i></i><b>' + n + '</b>' + (n === 3 ? '<u>Prepárate</u>' : '');
    pzTick(n);
    buzz(8);
  };
  show();
  pzCount = setInterval(() => {
    n--;
    if (n > 0) {
      show();
      return;
    }
    clearInterval(pzCount);
    pzCount = null;
    el.innerHTML = '';
    pzSnd('launch');
    paused = false;
    last = performance.now();
    try {
      if (AC && AC.state === 'suspended') {
        AC.resume();
      }
    } catch (e) {}
  }, 620);
}
/**
 * Sale de la pausa sin cuenta, para reintentar o ir a los niveles.
 */
function pzLeave() {
  if (pzCount) {
    clearInterval(pzCount);
    pzCount = null;
    const el = document.getElementById('pzcount');
    if (el) {
      el.innerHTML = '';
    }
  }
  pzClose();
  paused = false;
  last = performance.now();
  try {
    if (AC && AC.state === 'suspended') {
      AC.resume();
    }
  } catch (e) {}
}
/**
 * Cambia un volumen, actualiza su fila y lo guarda. Al arrastrar, suena una nota cada 10.
 *
 * @param {string} k Canal: 'mus' o 'sfx'.
 * @param {number} v Volumen, de 0 a 100 (se recorta a ese rango).
 * @param {Element} [row] Fila de volumen a actualizar.
 */
function pzSetVol(k, v, row) {
  v = Math.max(0, Math.min(100, Math.round(v)));
  {
    const step = Math.round(v / 10);
    if (pzDrag && pzLastV[k] !== step) {
      pzLastV[k] = step;
      pzSnd('slide', v);
    }
  }
  if (k === 'mus') {
    volMus = v;
  } else {
    volSfx = v;
  }
  if (row) {
    const ln = row.querySelector('.line'),
      val = row.querySelector('.val');
    if (ln) {
      ln.style.setProperty('--v', v + '%');
      ln.setAttribute('aria-valuenow', String(v));
    }
    if (val) {
      val.textContent = String(v);
    }
    row.classList.toggle('zero', v <= 0);
  }
  applyVolumes();
  saveVolumes();
}
// Volumen de cada canal antes de silenciarlo, para restaurarlo.
const pzPrev = { mus: 100, sfx: 100 };
/**
 * Atiende un toque en el panel de pausa: botones (seguir, reintentar, niveles, silenciar) o
 * el inicio del arrastre de una barra de volumen.
 *
 * @param {PointerEvent} e Evento del toque.
 */
function pausePress(e) {
  if (pzCount) {
    return;
  }
  const tg = e && e.target && e.target.closest ? e.target : null;
  if (!tg) {
    return;
  }
  const b = tg.closest('[data-pz]'),
    row = tg.closest('.pz-vol');
  if (e.cancelable) {
    e.preventDefault();
  }
  if (b) {
    const A = b.dataset.pz;
    if (A === 'go') {
      pzSnd('go');
      setTimeout(resumeGame, 140);
    } else if (A === 'again') {
      pzSnd('again');
      pzLeave();
      start();
      sesTries++;
      showTry(0);
    } else if (A === 'levels') {
      pzSnd('levels');
      pzLeave();
      state = 'menu';
      stopMusic(true);
      openLevels();
    } else if (A === 'mute-mus' || A === 'mute-sfx') {
      const k = A.slice(5),
        cur = k === 'mus' ? volMus : volSfx;
      if (cur > 0) {
        pzPrev[k] = cur;
        pzSnd('mute');
        pzSetVol(k, 0, row);
      } else {
        pzSetVol(k, pzPrev[k] || 80, row);
        pzSnd('unmute');
      }
      buzz(6);
    }
    return;
  }
  if (row && tg.closest('.line')) {
    const ln = row.querySelector('.line'),
      r = ln.getBoundingClientRect();
    pzDrag = { k: row.dataset.vol, row, x0: r.left, w: r.width, id: e.pointerId };
    row.classList.add('drag');
    pzSetVol(pzDrag.k, ((e.clientX - r.left) / r.width) * 100, row);
  }
}
window.addEventListener('pointermove', e => {
  if (
    !pzDrag ||
    (e.pointerId !== undefined && pzDrag.id !== undefined && e.pointerId !== pzDrag.id)
  ) {
    return;
  }
  pzSetVol(pzDrag.k, ((e.clientX - pzDrag.x0) / pzDrag.w) * 100, pzDrag.row);
});
const pzEnd = () => {
  if (pzDrag) {
    pzDrag.row.classList.remove('drag');
    pzLastV[pzDrag.k] = null;
    pzDrag = null;
    buzz(6);
  }
};
window.addEventListener('pointerup', pzEnd);
window.addEventListener('pointercancel', pzEnd);
// Si se sale de la app o llega una llamada, el juego se pausa solo.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'play' && !paused) {
    pauseGame();
  }
});

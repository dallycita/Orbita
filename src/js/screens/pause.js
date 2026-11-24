/**
 * Pausa: congela el juego y suspende el audio (la música sigue justo donde quedó, al ritmo).
 * Se ve como la pantalla de "Escapaste", con controles de volumen; al seguir hay una cuenta
 * 3·2·1 para no volver de golpe. Sus sonidos usan otro contexto de audio (`pzAC`), porque `AC`
 * está suspendido mientras dura la pausa.
 */
import { buzz, elPanel, reduceMotion } from '../core/display.js';
import { AC, applyVolumes, saveVolumes } from '../audio/engine.js';
import { stopMusic } from '../audio/music-player.js';
import { bestOf, run, setState, state } from '../core/state.js';
import { curGoal, setGest, setPending, tutorialState } from '../core/run-state.js';

import { sesTries, setSesTries, showTry, start } from '../game/run.js';
import { openLevels } from './levels.js';

import { COIN_RINGS, LEVELS } from '../data/levels.js';
import { setVolMus, setVolSfx, settings } from '../core/settings.js';
import { lvStarsGot } from '../game/progress.js';
import { paused, setPaused } from '../core/screen.js';
import { setLast } from '../core/clock.js';
import { pzSnd, pzTick } from '../audio/pause-sounds.js';

let pzCount = null;
let pzPanelCls = '';
let pzDrag = null;
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
  setPaused(true);
  setGest(null);
  setPending(false);
  try {
    if (AC && AC.state === 'running') {
      AC.suspend();
    }
  } catch (e) {}
  buzz(12);
  pzSnd('open');
  const g = curGoal(),
    v = Math.min(run.level, g),
    bst = tutorialState.tutorial ? 0 : Math.min(bestOf(run.lvl), g),
    L = LEVELS[run.lvl] || LEVELS[0];
  const cr = !tutorialState.tutorial && COIN_RINGS[run.lvl] ? [...COIN_RINGS[run.lvl]] : [],
    gotS = new Set(lvStarsGot(run.lvl));
  for (const [k, r] of run.rings) {
    if (r.coin && r.coin.got) {
      gotS.add(k);
    }
  }
  const nSt = cr.filter(k => gotS.has(k)).length;
  pzPanelCls = elPanel.className;
  elPanel.className = 'wscr pzp';
  elPanel.innerHTML =
    '<div class="title wtit">Pausa</div><div class="wtries">' +
    (tutorialState.tutorial ? 'Tutorial' : L.name) +
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
    pzVolHTML('mus', PZ_ICO.mus, 'Música', settings.volMus) +
    pzVolHTML('sfx', PZ_ICO.sfx, 'SFX', settings.volSfx) +
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
let pzLastV = {};
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
    setPaused(false);
    setLast(performance.now());
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
  setPaused(false);
  setLast(performance.now());
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
    setVolMus(v);
  } else {
    setVolSfx(v);
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
      setSesTries(sesTries + 1);
      showTry(0);
    } else if (A === 'levels') {
      pzSnd('levels');
      pzLeave();
      setState('menu');
      stopMusic(true);
      openLevels();
    } else if (A === 'mute-mus' || A === 'mute-sfx') {
      const k = A.slice(5),
        cur = k === 'mus' ? settings.volMus : settings.volSfx;
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
const pzEnd = () => {
  if (pzDrag) {
    pzDrag.row.classList.remove('drag');
    pzLastV[pzDrag.k] = null;
    pzDrag = null;
    buzz(6);
  }
};

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initPause() {
  window.addEventListener('pointermove', e => {
    if (
      !pzDrag ||
      (e.pointerId !== undefined && pzDrag.id !== undefined && e.pointerId !== pzDrag.id)
    ) {
      return;
    }
    pzSetVol(pzDrag.k, ((e.clientX - pzDrag.x0) / pzDrag.w) * 100, pzDrag.row);
  });
  window.addEventListener('pointerup', pzEnd);
  window.addEventListener('pointercancel', pzEnd);
  // Si se sale de la app o llega una llamada, el juego se pausa solo.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'play' && !paused) {
      pauseGame();
    }
  });
}

export { pauseGame, pausePress, pzCount, resumeGame };

/**
 * Controles: toques, gestos y teclado. Un toque hace algo distinto según la pantalla (`state`);
 * en partida salta, y deslizar hacia arriba justo después convierte el salto en salto doble.
 */
import {
  BONE,
  R0,
  elPanel,
  hudMode,
  musicStyle,
  refreshChips,
  setHudMode,
  setMusicStyle,
} from '../core/display.js';
import { AC, initAudio } from '../audio/engine.js';
import { startMusic, stopMusic } from '../audio/music-player.js';
import { run, setState, state } from '../core/state.js';
import { chargeMax } from '../game/planets.js';
import {
  effects,
  input,
  outcome,
  setGest,
  setPending,
  setPendingT,
  tutorialState,
} from '../core/run-state.js';
import { pushing } from '../game/beat.js';
import { wh, whTap } from '../game/wormhole.js';
import {
  doubleJump,
  jump,
  sesTries,
  setSesTries,
  showTry,
  start,
  upgradeToDouble,
} from '../game/run.js';
import { startTutorial } from '../game/tutorial.js';
import { pauseGame, pausePress, pzCount, resumeGame } from './pause.js';
import { endIntro } from './intro.js';
import { skipSplash, splashT } from './splash.js';
import { openLevels, setLvIndex, startLevel } from './levels.js';
import { openHome } from './home.js';

import { planetStep } from './planets.js';
import { LEVELS } from '../data/levels.js';
import { showStop, uiGlass } from '../audio/ui-sounds.js';
import {
  HOME_IN,
  homeT,
  paused,
  pendingTut,
  setHomeT,
  setLogoT0,
  setPendingTut,
} from '../core/screen.js';
import { elHome, elLv } from '../core/dom.js';

/**
 * Atiende un toque o la tecla de acción según la pantalla actual: pausa, botones de los paneles,
 * opciones de música y modo, saltar pantallas, empezar la partida o saltar.
 *
 * @param {PointerEvent} [e] Evento del toque; sin evento, viene del teclado.
 */
function press(e) {
  if (paused) {
    pausePress(e);
    return;
  }
  if (e && e.target && e.target.closest && e.target.closest('#quit')) {
    if (e.cancelable) {
      e.preventDefault();
    }
    if (state === 'play') {
      pauseGame();
    } else if (state === 'dead') {
      setState('menu');
      stopMusic(true);
      openLevels();
    }
    return;
  }
  if (state === 'home' && homeT < HOME_IN) {
    setHomeT(HOME_IN + 0.6);
    setLogoT0(homeT - 3);
    showStop(0.3);
    if (elHome) {
      elHome.classList.remove('off');
    }
    return;
  }
  if (state === 'levels' || state === 'home' || state === 'planets' || state === 'missions') {
    return;
  }
  const act = e && e.target && e.target.closest ? e.target.closest('[data-act]') : null;
  if (act && (state === 'dead' || state === 'win')) {
    if (e.cancelable) {
      e.preventDefault();
    }
    if (elPanel.classList) {
      elPanel.classList.remove('wscr');
    }
    const A = act.dataset.act;
    if (A === 'levels') {
      openLevels();
    } else if (A === 'lvl1') {
      startLevel(0);
    } else if (A === 'next' && LEVELS[run.lvl + 1]) {
      setLvIndex(run.lvl + 1);
      startLevel(run.lvl + 1);
    } else if (A === 'again' && outcome.canRestart) {
      start();
      setSesTries(sesTries + 1);
      showTry(0);
    }
    return;
  }
  const chip = e && e.target && e.target.closest ? e.target.closest('.chip') : null;
  if (chip && state !== 'play') {
    if (e.cancelable) {
      e.preventDefault();
    }
    initAudio();
    if (AC && AC.state === 'suspended') {
      AC.resume();
    }
    if (chip.dataset.music) {
      setMusicStyle(chip.dataset.music);
      refreshChips();
      try {
        localStorage.setItem('orbita_p1_musica', musicStyle);
      } catch (_) {}
      startMusic(); // Vista previa: se escucha completa mientras se elige.
    } else {
      setHudMode(chip.dataset.mode);
      refreshChips();
      try {
        localStorage.setItem('orbita_p1_modo', hudMode);
      } catch (_) {}
    }
    return;
  }
  if (e && e.cancelable) {
    e.preventDefault();
  }
  initAudio();
  if (AC && AC.state === 'suspended') {
    AC.resume();
  }
  if (state === 'pretitle') {
    openHome(true);
    return;
  }
  if (state === 'splash') {
    if (splashT > 0.8) {
      skipSplash();
    }
    return;
  }
  if (state === 'intro') {
    endIntro(true);
    return;
  }
  if (state === 'menu') {
    if (pendingTut) {
      setPendingTut(false);
      startTutorial();
    } else {
      start();
      showTry(0);
    }
    return;
  }
  if (state === 'win' && tutorialState.tutorial) {
    return;
  }
  if (state === 'win') {
    return;
  }
  if (state === 'dead') {
    if (outcome.canRestart) {
      start();
    }
    return;
  }
  if (state === 'play' && wh) {
    whTap();
    return;
  }
  if (state === 'play' && !run.jumping && !pushing) {
    jump();
    if (e && e.pointerId !== undefined) {
      setGest({ id: e.pointerId, y: e.clientY });
      if (run.charge >= chargeMax()) {
        setPending(true);
        setPendingT(0);
      } // Espera un instante por si es un deslizamiento hacia arriba (salto doble).
    }
  }
}
const endGest = e => {
  if (input.gest && e.pointerId === input.gest.id) {
    setGest(null);
    setPending(false);
  }
};
/**
 * Tecla del poder (D o Mayúsculas): funciona antes de saltar y también en pleno salto; si no
 * está cargado, avisa cuántos Perfectos faltan.
 */
function powerKey() {
  if (state !== 'play' || wh) {
    return;
  }
  if (run.charge < chargeMax()) {
    const f = chargeMax() - run.charge;
    if (!effects.texts.some(x => x.key === 'faltan')) {
      effects.texts.push({
        txt: 'Te ' + (f === 1 ? 'falta 1 Perfecto' : 'faltan ' + f + ' Perfectos'),
        x: 0,
        y: -R0 - 30,
        life: 1,
        size: 13,
        col: BONE,
        center: true,
        key: 'faltan',
      });
    }
    return;
  }
  if (run.jumping) {
    upgradeToDouble();
  } else {
    doubleJump();
  }
}

/** Lo que este módulo hace al cargar el juego; main.js lo llama en orden. */
export function initControls() {
  // Deslizar más de 22 píxeles hacia arriba durante el toque mejora el salto a salto doble.
  window.addEventListener('pointermove', e => {
    if (!input.gest || e.pointerId !== input.gest.id) {
      return;
    }
    if (input.gest.y - e.clientY > 22) {
      setGest(null);
      if (input.pending) {
        upgradeToDouble();
      }
      setPending(false);
    }
  });
  window.addEventListener('pointerup', endGest);
  window.addEventListener('pointercancel', endGest);
  window.addEventListener('pointerdown', press, { passive: false });
  // Teclado: Escape o P pausan; Espacio, Enter y flecha arriba actúan como un toque; las flechas
  // laterales recorren planetas y niveles.
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (paused) {
        if (!pzCount) {
          resumeGame();
        }
      } else if (state === 'play') {
        pauseGame();
      }
      return;
    }
    if (paused) {
      if ((e.code === 'Space' || e.code === 'Enter') && !pzCount) {
        e.preventDefault();
        resumeGame();
      }
      return;
    }
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
      e.preventDefault();
      if (!e.repeat) {
        press();
      }
    } else if (state === 'planets' && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) {
      uiGlass(e.code === 'ArrowRight' ? 1 : -1);
      planetStep(e.code === 'ArrowRight' ? 1 : -1);
    } else if (state === 'levels' && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) {
      const b =
        elLv &&
        elLv.querySelector &&
        elLv.querySelector(e.code === 'ArrowRight' ? '.arrow.r' : '.arrow.l');
      if (b && b.click) {
        b.click();
      }
    } else if (
      (e.code === 'KeyD' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') &&
      !e.repeat
    ) {
      e.preventDefault();
      powerKey();
    }
  });
}
